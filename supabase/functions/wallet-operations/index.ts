import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ["password", "secret", "token", "api_key", "apikey", "authorization", "cpf", "salary"];
  const redacted: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitive.some((s) => k.toLowerCase().includes(s))) {
      redacted[k] = "[REDACTED]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      redacted[k] = redactSensitive(v as Record<string, unknown>);
    } else {
      redacted[k] = v;
    }
  }
  return redacted;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    switch (path) {
      case "simulate":
        return await handleSimulate(req);
      case "apply":
        return await handleApply(req);
      case "webhook":
        return await handleWebhook(req);
      default:
        return jsonResponse({ error: "Unknown endpoint. Use /simulate, /apply, or /webhook" }, 404);
    }
  } catch (err) {
    console.error("wallet-operations error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});

// ─── /simulate ───────────────────────────────────────────
async function handleSimulate(req: Request) {
  if (req.method !== "POST") return jsonResponse({ error: "POST required" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // Validate user via anon client
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(
    authHeader.replace("Bearer ", "")
  );
  if (claimsErr || !claims?.claims) return jsonResponse({ error: "Unauthorized" }, 401);

  const { wallet_id, allocation_json, context } = await req.json();
  if (!wallet_id || !allocation_json) {
    return jsonResponse({ error: "wallet_id and allocation_json required" }, 400);
  }

  // Use service role to call the DB function
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await serviceClient.rpc("simulate_allocation", {
    p_wallet_id: wallet_id,
    p_allocation_json: allocation_json,
    p_context: context ?? {},
  });

  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse(data);
}

// ─── /apply ──────────────────────────────────────────────
async function handleApply(req: Request) {
  if (req.method !== "POST") return jsonResponse({ error: "POST required" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(
    authHeader.replace("Bearer ", "")
  );
  if (claimsErr || !claims?.claims) return jsonResponse({ error: "Unauthorized" }, 401);

  const userId = claims.claims.sub as string;

  // RBAC check: must be company_admin or hr_manager
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: userRole } = await serviceClient
    .from("user_roles")
    .select("role, company_id")
    .eq("user_id", userId)
    .in("role", ["super_admin", "company_admin", "hr_manager"])
    .limit(1)
    .maybeSingle();

  if (!userRole) {
    return jsonResponse({ error: "Forbidden: insufficient permissions" }, 403);
  }

  const { wallet_id, employee_id, allocation_json, policy_id, connector_id } = await req.json();

  if (!wallet_id || !employee_id || !allocation_json) {
    return jsonResponse({ error: "wallet_id, employee_id, and allocation_json required" }, 400);
  }

  // 1. Apply allocation atomically
  const { data: txId, error: applyErr } = await serviceClient.rpc("apply_allocation", {
    p_wallet_id: wallet_id,
    p_employee_id: employee_id,
    p_allocation_json: allocation_json,
    p_policy_id: policy_id ?? null,
    p_actor: userId,
  });

  if (applyErr) return jsonResponse({ error: applyErr.message }, 500);

  // 2. Optionally trigger Integration Hub connector for supplier settlement
  let executionId: string | null = null;
  if (connector_id && userRole.company_id) {
    try {
      const { data: execId } = await serviceClient.rpc("create_connector_execution", {
        p_connector_id: connector_id,
        p_tenant_id: userRole.company_id,
        p_job_type: "wallet_settlement",
        p_payload: redactSensitive({
          transaction_id: txId,
          wallet_id,
          employee_id,
          allocation: allocation_json,
          policy_id: policy_id ?? null,
        }) as unknown as Record<string, never>,
      });
      executionId = execId;

      // Fire-and-forget: trigger execute-connector-job
      const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/execute-connector-job`;
      fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ execution_id: execId }),
      }).catch((e) => console.error("Failed to trigger connector job:", e));
    } catch (e) {
      console.error("Connector dispatch error (non-blocking):", e);
    }
  }

  return jsonResponse({
    transaction_id: txId,
    execution_id: executionId,
    status: "pending",
  });
}

// ─── /webhook ────────────────────────────────────────────
// Called by Integration Hub / connector callbacks to finalize transactions
async function handleWebhook(req: Request) {
  if (req.method !== "POST") return jsonResponse({ error: "POST required" }, 405);

  // Webhook auth via service role key in header (internal only)
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (authHeader !== `Bearer ${serviceKey}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { transaction_id, provider_tx_id, status } = await req.json();

  if (!transaction_id || !status) {
    return jsonResponse({ error: "transaction_id and status required" }, 400);
  }

  if (!["completed", "failed"].includes(status)) {
    return jsonResponse({ error: "status must be completed or failed" }, 400);
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey
  );

  const { error } = await serviceClient.rpc("finalize_transaction", {
    p_transaction_id: transaction_id,
    p_provider_tx_id: provider_tx_id ?? null,
    p_status: status,
  });

  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ finalized: true, transaction_id, status });
}
