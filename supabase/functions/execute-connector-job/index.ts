import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MS = 30_000;
const MAX_PAYLOAD_LOG_SIZE = 10 * 1024; // 10KB - above this, store in bucket

function redactSecrets(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ["password", "secret", "token", "api_key", "apikey", "authorization"];
  const redacted: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitive.some((s) => k.toLowerCase().includes(s))) {
      redacted[k] = "[REDACTED]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      redacted[k] = redactSecrets(v as Record<string, unknown>);
    } else {
      redacted[k] = v;
    }
  }
  return redacted;
}

function isTransientError(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { execution_id } = await req.json();
    if (!execution_id) {
      return new Response(JSON.stringify({ error: "execution_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch execution
    const { data: execution, error: execErr } = await supabase
      .from("connector_executions")
      .select("*, connectors(*, connector_secrets(encrypted_secrets))")
      .eq("id", execution_id)
      .single();

    if (execErr || !execution) {
      return new Response(JSON.stringify({ error: "Execution not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const connector = execution.connectors;
    const config = connector?.config as Record<string, unknown> | null;
    const secrets = connector?.connector_secrets?.encrypted_secrets as Record<string, string> | null;
    const retryPolicy = (connector?.retry_policy as { max_retries?: number; backoff_ms?: number }) ?? {
      max_retries: 3,
      backoff_ms: 1000,
    };

    // Mark started
    await supabase.rpc("mark_execution_started", { p_execution_id: execution_id });

    // Build request
    const endpoint = (config?.endpoint as string) ?? "";
    const method = ((config?.method as string) ?? "POST").toUpperCase();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((config?.headers as Record<string, string>) ?? {}),
    };

    // Inject secrets into headers if configured
    if (secrets) {
      if (secrets.api_key && config?.auth_header) {
        headers[config.auth_header as string] = secrets.api_key;
      } else if (secrets.bearer_token) {
        headers["Authorization"] = `Bearer ${secrets.bearer_token}`;
      }
    }

    let responseBody: unknown = null;
    let responseStatus = 0;
    let lastError: string | null = null;
    let success = false;

    // Execute with timeout
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const resp = await fetch(endpoint, {
        method,
        headers,
        body: method !== "GET" ? JSON.stringify(execution.request_payload) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      responseStatus = resp.status;
      try {
        responseBody = await resp.json();
      } catch {
        responseBody = await resp.text().catch(() => null);
      }

      if (resp.ok) {
        success = true;
      } else {
        lastError = `HTTP ${resp.status}: ${typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody)}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (lastError.includes("abort")) {
        lastError = `Timeout after ${TIMEOUT_MS}ms`;
      }
    }

    // Store large payloads in bucket
    const tenantId = execution.tenant_id;
    const payloadPath = `${tenantId}/${execution_id}`;

    const reqPayloadStr = JSON.stringify(execution.request_payload ?? {});
    if (reqPayloadStr.length > MAX_PAYLOAD_LOG_SIZE) {
      await supabase.storage
        .from("connectors-payloads")
        .upload(`${payloadPath}/request.json`, reqPayloadStr, {
          contentType: "application/json",
          upsert: true,
        });
    }

    const resPayloadStr = JSON.stringify(responseBody ?? {});
    if (resPayloadStr.length > MAX_PAYLOAD_LOG_SIZE) {
      await supabase.storage
        .from("connectors-payloads")
        .upload(`${payloadPath}/response.json`, resPayloadStr, {
          contentType: "application/json",
          upsert: true,
        });
    }

    // Log to connector_logs
    const redactedMeta = redactSecrets({
      endpoint,
      method,
      status: responseStatus,
      latency_hint: "see connector_health",
    });

    await supabase.from("connector_logs").insert({
      execution_id,
      level: success ? "info" : "error",
      message: success ? `Job succeeded (HTTP ${responseStatus})` : `Job failed: ${lastError}`,
      metadata: redactedMeta,
    });

    // Mark result
    const finalStatus = success ? "success" : "failed";
    await supabase.rpc("mark_execution_result", {
      p_execution_id: execution_id,
      p_status: finalStatus,
      p_response: responseBody && resPayloadStr.length <= MAX_PAYLOAD_LOG_SIZE ? responseBody : null,
      p_last_error: lastError,
      p_finished_at: new Date().toISOString(),
    });

    // On failure, check retry policy and move to DLQ if exhausted
    if (!success) {
      const attempts = (execution.attempts ?? 0) + 1;
      const isTransient = responseStatus > 0 ? isTransientError(responseStatus) : true;

      if (!isTransient || attempts >= (retryPolicy.max_retries ?? 3)) {
        await supabase.rpc("move_execution_to_dlq", {
          p_execution_id: execution_id,
          p_error: lastError ?? "Unknown error",
          p_payload: execution.request_payload ?? {},
        });
      }
    }

    return new Response(
      JSON.stringify({ success, status: finalStatus, execution_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
