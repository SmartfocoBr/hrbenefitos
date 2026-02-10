import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HEALTH_TIMEOUT_MS = 10_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { connector_id } = await req.json();
    if (!connector_id) {
      return new Response(JSON.stringify({ error: "connector_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch connector config
    const { data: connector, error: connErr } = await supabase
      .from("connectors")
      .select("id, config, connector_secrets(encrypted_secrets)")
      .eq("id", connector_id)
      .single();

    if (connErr || !connector) {
      return new Response(JSON.stringify({ error: "Connector not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = connector.config as Record<string, unknown> | null;
    const secrets = connector.connector_secrets?.encrypted_secrets as Record<string, string> | null;
    const healthEndpoint = (config?.health_endpoint as string) ?? (config?.endpoint as string) ?? "";

    if (!healthEndpoint) {
      // Update health as unknown - no endpoint configured
      await supabase
        .from("connector_health")
        .upsert(
          { connector_id, status: "unknown", last_check: new Date().toISOString(), last_error: "No health endpoint configured" },
          { onConflict: "connector_id" }
        );

      return new Response(
        JSON.stringify({ status: "unknown", reason: "No health endpoint" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build headers
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (secrets?.bearer_token) {
      headers["Authorization"] = `Bearer ${secrets.bearer_token}`;
    } else if (secrets?.api_key && config?.auth_header) {
      headers[config.auth_header as string] = secrets.api_key;
    }

    let status = "healthy";
    let latencyMs = 0;
    let lastError: string | null = null;

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

      const resp = await fetch(healthEndpoint, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      latencyMs = Date.now() - start;

      if (!resp.ok) {
        status = "degraded";
        lastError = `HTTP ${resp.status}`;
      }
    } catch (err) {
      latencyMs = Date.now() - start;
      status = "unhealthy";
      lastError = err instanceof Error ? err.message : String(err);
      if (lastError.includes("abort")) {
        lastError = `Health check timeout (${HEALTH_TIMEOUT_MS}ms)`;
      }
    }

    // Build history entry
    const entry = { ts: new Date().toISOString(), status, latency_ms: latencyMs, error: lastError };

    // Fetch current history
    const { data: currentHealth } = await supabase
      .from("connector_health")
      .select("history")
      .eq("connector_id", connector_id)
      .single();

    const currentHistory = Array.isArray(currentHealth?.history) ? currentHealth.history : [];
    const newHistory = [entry, ...currentHistory].slice(0, 50);

    await supabase
      .from("connector_health")
      .upsert(
        {
          connector_id,
          status,
          last_check: new Date().toISOString(),
          latency_ms: latencyMs,
          last_error: lastError,
          history: newHistory,
        },
        { onConflict: "connector_id" }
      );

    return new Response(
      JSON.stringify({ connector_id, status, latency_ms: latencyMs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
