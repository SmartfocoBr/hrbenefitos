import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

function redactSecrets(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ["password", "secret", "token", "api_key", "apikey", "authorization"];
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitive.some((s) => k.toLowerCase().includes(s))) {
      result[k] = "[REDACTED]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      result[k] = redactSecrets(v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result;
}

function isTransientError(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number,
  backoffMs: number
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (resp.ok || !isTransientError(resp.status)) return resp;
      lastError = new Error(`HTTP ${resp.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt)));
    }
  }
  throw lastError ?? new Error("Request failed after retries");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instruction_id } = await req.json();
    if (!instruction_id) {
      return new Response(JSON.stringify({ error: "instruction_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch instruction with supplier config
    const { data: instruction, error: instrErr } = await supabase
      .from("supplier_instructions")
      .select("*, supplier_providers(*, connector_secrets:connectors(connector_secrets(encrypted_secrets)))")
      .eq("id", instruction_id)
      .single();

    if (instrErr || !instruction) {
      return new Response(JSON.stringify({ error: "Instruction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supplier = instruction.supplier_providers;
    const apiConfig = (supplier?.api_config ?? {}) as Record<string, unknown>;
    const endpoint = (apiConfig.endpoint as string) ?? "";
    const method = ((apiConfig.method as string) ?? "POST").toUpperCase();

    if (!endpoint) {
      // Update instruction as failed
      await supabase
        .from("supplier_instructions")
        .update({ status: "failed", provider_response: { error: "No endpoint configured" }, processed_at: new Date().toISOString() })
        .eq("id", instruction_id);

      return new Response(JSON.stringify({ error: "Supplier endpoint not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((apiConfig.headers as Record<string, string>) ?? {}),
    };

    // Inject secrets if available
    const connectorSecrets = supplier?.connector_secrets?.[0]?.connector_secrets?.encrypted_secrets as Record<string, string> | null;
    if (connectorSecrets) {
      if (connectorSecrets.api_key && apiConfig.auth_header) {
        headers[apiConfig.auth_header as string] = connectorSecrets.api_key;
      } else if (connectorSecrets.bearer_token) {
        headers["Authorization"] = `Bearer ${connectorSecrets.bearer_token}`;
      }
    }

    // Update status to processing
    await supabase
      .from("supplier_instructions")
      .update({ status: "processing" })
      .eq("id", instruction_id);

    let responseBody: unknown = null;
    let responseStatus = 0;
    let success = false;
    let lastError: string | null = null;

    try {
      const resp = await fetchWithRetry(
        endpoint,
        {
          method,
          headers,
          body: method !== "GET" ? JSON.stringify(instruction.payload) : undefined,
        },
        MAX_RETRIES,
        BASE_BACKOFF_MS
      );

      responseStatus = resp.status;
      try {
        responseBody = await resp.json();
      } catch {
        responseBody = await resp.text().catch(() => null);
      }

      success = resp.ok;
      if (!success) {
        lastError = `HTTP ${resp.status}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (lastError.includes("abort")) lastError = `Timeout after ${TIMEOUT_MS}ms`;
    }

    // Look up error mapping if failed
    let errorCategory: string | null = null;
    let recommendedAction: unknown = null;
    if (!success && responseBody && typeof responseBody === "object") {
      const externalCode = (responseBody as Record<string, unknown>).error_code as string | undefined;
      if (externalCode) {
        const { data: errorMap } = await supabase
          .from("supplier_error_map")
          .select("category, recommended_action")
          .eq("supplier_id", instruction.supplier_id)
          .eq("external_code", externalCode)
          .maybeSingle();

        if (errorMap) {
          errorCategory = errorMap.category;
          recommendedAction = errorMap.recommended_action;
        }
      }
    }

    // Extract provider_tx_id from response
    const providerTxId = responseBody && typeof responseBody === "object"
      ? ((responseBody as Record<string, unknown>).transaction_id as string ??
         (responseBody as Record<string, unknown>).id as string ?? null)
      : null;

    // Update instruction
    await supabase
      .from("supplier_instructions")
      .update({
        status: success ? "completed" : (errorCategory === "permanent" ? "failed" : "error"),
        provider_response: redactSecrets((responseBody ?? { error: lastError }) as Record<string, unknown>),
        provider_tx_id: providerTxId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", instruction_id);

    return new Response(
      JSON.stringify({
        success,
        instruction_id,
        status: success ? "completed" : "error",
        error_category: errorCategory,
        recommended_action: recommendedAction,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
