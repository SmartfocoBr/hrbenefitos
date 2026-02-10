import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth - only ops/admin users
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub as string;

    // Service role client for privileged operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // Mode: single reprocess or poll scheduler
    if (body.mode === "poll") {
      // Scheduler mode: poll all connectors with ready DLQ items
      const { data: dlqItems } = await supabase
        .from("connector_dlq")
        .select("id, connector_id, execution_id, payload")
        .lte("next_retry", new Date().toISOString())
        .order("next_retry", { ascending: true })
        .limit(10);

      if (!dlqItems || dlqItems.length === 0) {
        return new Response(
          JSON.stringify({ reprocessed: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results = [];
      for (const item of dlqItems) {
        // Fetch connector to get tenant_id
        const { data: connector } = await supabase
          .from("connectors")
          .select("tenant_id")
          .eq("id", item.connector_id)
          .single();

        if (!connector) continue;

        // Create new execution
        const { data: newExecId } = await supabase.rpc("create_connector_execution", {
          p_connector_id: item.connector_id,
          p_tenant_id: connector.tenant_id,
          p_job_type: "dlq_retry",
          p_payload: item.payload,
        });

        // Increment failure count on DLQ item
        await supabase
          .from("connector_dlq")
          .update({
            failure_count: (item as unknown as { failure_count: number }).failure_count + 1,
            next_retry: null, // Clear to prevent re-pick until next failure
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        // Log reprocess event
        await supabase.from("connector_logs").insert({
          execution_id: newExecId,
          level: "info",
          message: `DLQ item ${item.id} reprocessed as execution ${newExecId}`,
          metadata: { dlq_id: item.id, original_execution_id: item.execution_id },
        });

        results.push({ dlq_id: item.id, new_execution_id: newExecId });
      }

      return new Response(
        JSON.stringify({ reprocessed: results.length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single reprocess mode
    const { dlq_id, payload_overrides } = body;
    if (!dlq_id) {
      return new Response(JSON.stringify({ error: "dlq_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch DLQ item
    const { data: dlqItem, error: dlqErr } = await supabase
      .from("connector_dlq")
      .select("*, connectors(tenant_id)")
      .eq("id", dlq_id)
      .single();

    if (dlqErr || !dlqItem) {
      return new Response(JSON.stringify({ error: "DLQ item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = (dlqItem.connectors as unknown as { tenant_id: string })?.tenant_id;

    // RBAC check: user must be admin for this tenant
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("company_id", tenantId)
      .in("role", ["super_admin", "company_admin", "hr_manager"]);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Merge payload
    const finalPayload = payload_overrides
      ? { ...(dlqItem.payload as Record<string, unknown>), ...payload_overrides }
      : dlqItem.payload;

    // Create new execution
    const { data: newExecId } = await supabase.rpc("create_connector_execution", {
      p_connector_id: dlqItem.connector_id,
      p_tenant_id: tenantId,
      p_job_type: "dlq_retry",
      p_payload: finalPayload,
    });

    // Update DLQ
    await supabase
      .from("connector_dlq")
      .update({
        failure_count: (dlqItem.failure_count ?? 0) + 1,
        next_retry: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dlq_id);

    // Log
    await supabase.from("connector_logs").insert({
      execution_id: newExecId,
      level: "info",
      message: `DLQ item ${dlq_id} manually reprocessed by user ${userId}`,
      metadata: { dlq_id, original_execution_id: dlqItem.execution_id, has_overrides: !!payload_overrides },
    });

    return new Response(
      JSON.stringify({ success: true, new_execution_id: newExecId, dlq_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
