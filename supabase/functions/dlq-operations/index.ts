import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPS_ROLES = ["super_admin", "company_admin", "hr_manager", "sre", "operations"];

async function getUserAndRoles(
  supabase: ReturnType<typeof createClient>,
  authHeader: string
) {
  const token = authHeader.replace("Bearer ", "");
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: claims, error } = await anonClient.auth.getClaims(token);
  if (error || !claims?.claims) return null;

  const userId = claims.claims.sub as string;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role, company_id")
    .eq("user_id", userId);

  return { userId, roles: roles ?? [] };
}

function hasOpsAccess(
  roles: { role: string; company_id: string | null }[],
  tenantId?: string
): boolean {
  return roles.some(
    (r) =>
      OPS_ROLES.includes(r.role) &&
      (r.role === "super_admin" || r.role === "sre" || !tenantId || r.company_id === tenantId)
  );
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const user = await getUserAndRoles(supabase, authHeader);
    if (!user) return jsonResp({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── LIST ────────────────────────────────────────────────
    if (req.method === "GET" || action === "list") {
      const tenantId = url.searchParams.get("tenant_id");
      if (!hasOpsAccess(user.roles, tenantId ?? undefined)) {
        return jsonResp({ error: "Forbidden" }, 403);
      }

      let query = supabase
        .from("dlq")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (tenantId) query = query.eq("tenant_id", tenantId);

      const source = url.searchParams.get("source");
      if (source) query = query.eq("source", source);

      const { data, error } = await query;
      if (error) return jsonResp({ error: error.message }, 500);
      return jsonResp({ items: data });
    }

    // POST actions
    const body = await req.json();

    // ─── REPROCESS ───────────────────────────────────────────
    if (action === "reprocess") {
      const { dlq_id, payload_overrides } = body;
      if (!dlq_id) return jsonResp({ error: "dlq_id required" }, 400);

      // Fetch DLQ item
      const { data: dlqItem, error: dlqErr } = await supabase
        .from("dlq")
        .select("*")
        .eq("id", dlq_id)
        .single();

      if (dlqErr || !dlqItem) return jsonResp({ error: "DLQ item not found" }, 404);

      if (!hasOpsAccess(user.roles, dlqItem.tenant_id)) {
        return jsonResp({ error: "Forbidden" }, 403);
      }

      // Merge payload
      const finalPayload = payload_overrides
        ? { ...(dlqItem.payload as Record<string, unknown>), ...payload_overrides }
        : dlqItem.payload;

      // Create reprocess job
      const { data: job, error: jobErr } = await supabase
        .from("reprocess_jobs")
        .insert({
          dlq_id,
          initiated_by: user.userId,
          status: "running",
          attempts: 1,
        })
        .select("id")
        .single();

      if (jobErr) return jsonResp({ error: jobErr.message }, 500);

      // Attempt reprocessing based on source
      let reprocessError: string | null = null;
      try {
        if (dlqItem.source.startsWith("connector:")) {
          // Route to connector execution
          const connectorId = dlqItem.source.replace("connector:", "");
          const { data: execId } = await supabase.rpc("create_connector_execution", {
            p_connector_id: connectorId,
            p_tenant_id: dlqItem.tenant_id,
            p_job_type: "dlq_retry",
            p_payload: finalPayload,
          });

          // Fire and forget the execution
          const funcUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/execute-connector-job`;
          await fetch(funcUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ execution_id: execId }),
          });
        }
        // For other sources, the reprocess job record is enough — 
        // downstream consumers poll reprocess_jobs
      } catch (err) {
        reprocessError = err instanceof Error ? err.message : String(err);
      }

      // Update job status
      const finalStatus = reprocessError ? "failed" : "success";
      await supabase
        .from("reprocess_jobs")
        .update({
          status: finalStatus,
          last_error: reprocessError,
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      // Update DLQ item
      if (reprocessError) {
        await supabase
          .from("dlq")
          .update({ failure_count: (dlqItem.failure_count ?? 0) + 1 })
          .eq("id", dlq_id);
      }

      // Audit log
      await supabase.from("system_logs").insert({
        tenant_id: dlqItem.tenant_id,
        actor_id: user.userId,
        service: "dlq-operations",
        level: reprocessError ? "warn" : "info",
        message: `DLQ item ${dlq_id} reprocessed: ${finalStatus}`,
        context: {
          dlq_id,
          job_id: job.id,
          source: dlqItem.source,
          has_overrides: !!payload_overrides,
          error: reprocessError,
        },
      });

      return jsonResp({
        success: !reprocessError,
        job_id: job.id,
        dlq_id,
        status: finalStatus,
        error: reprocessError,
      });
    }

    // ─── SKIP / DELETE ───────────────────────────────────────
    if (action === "skip" || action === "delete") {
      const { dlq_id } = body;
      if (!dlq_id) return jsonResp({ error: "dlq_id required" }, 400);

      // Fetch item for tenant check
      const { data: dlqItem } = await supabase
        .from("dlq")
        .select("*")
        .eq("id", dlq_id)
        .single();

      if (!dlqItem) return jsonResp({ error: "DLQ item not found" }, 404);

      // Delete requires super_admin or sre
      if (action === "delete") {
        const canDelete = user.roles.some((r) =>
          ["super_admin", "sre"].includes(r.role)
        );
        if (!canDelete) {
          return jsonResp({ error: "Only super_admin or SRE can delete DLQ items" }, 403);
        }
      } else if (!hasOpsAccess(user.roles, dlqItem.tenant_id)) {
        return jsonResp({ error: "Forbidden" }, 403);
      }

      if (action === "delete") {
        await supabase.from("dlq").delete().eq("id", dlq_id);
      } else {
        // Skip: set next_retry to null (won't be picked up again)
        await supabase
          .from("dlq")
          .update({ next_retry: null })
          .eq("id", dlq_id);
      }

      // Audit log
      await supabase.from("system_logs").insert({
        tenant_id: dlqItem.tenant_id,
        actor_id: user.userId,
        service: "dlq-operations",
        level: "info",
        message: `DLQ item ${dlq_id} ${action === "delete" ? "deleted" : "skipped"} by ${user.userId}`,
        context: {
          dlq_id,
          action,
          source: dlqItem.source,
          original_error: dlqItem.error,
        },
      });

      return jsonResp({ success: true, dlq_id, action });
    }

    return jsonResp({ error: "Unknown action. Use ?action=list|reprocess|skip|delete" }, 400);
  } catch (err) {
    return jsonResp(
      { error: err instanceof Error ? err.message : "Internal error" },
      500
    );
  }
});
