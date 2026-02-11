import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MS = 15_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supplier_id, tenant_id } = await req.json();
    if (!supplier_id || !tenant_id) {
      return new Response(JSON.stringify({ error: "supplier_id and tenant_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch supplier config
    const { data: supplier, error: supErr } = await supabase
      .from("supplier_providers")
      .select("*")
      .eq("id", supplier_id)
      .eq("tenant_id", tenant_id)
      .single();

    if (supErr || !supplier) {
      return new Response(JSON.stringify({ error: "Supplier not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiConfig = (supplier.api_config ?? {}) as Record<string, unknown>;
    const balanceEndpoint = (apiConfig.balance_endpoint as string) ?? "";

    if (!balanceEndpoint) {
      return new Response(JSON.stringify({ error: "Balance endpoint not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((apiConfig.headers as Record<string, string>) ?? {}),
    };

    // Fetch balance from supplier API
    let balance: number | null = null;
    let metadata: Record<string, unknown> = {};
    let fetchError: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const resp = await fetch(balanceEndpoint, { method: "GET", headers, signal: controller.signal });
      clearTimeout(timeout);

      if (resp.ok) {
        const body = await resp.json();
        balance = typeof body.balance === "number" ? body.balance : (parseFloat(body.balance) || null);
        metadata = { raw_response: body, fetched_at: new Date().toISOString() };
      } else {
        fetchError = `HTTP ${resp.status}`;
      }
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }

    if (balance === null) {
      return new Response(
        JSON.stringify({ error: fetchError ?? "Could not fetch balance" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert into supplier_balances
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from("supplier_balances")
      .select("id")
      .eq("supplier_id", supplier_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("supplier_balances")
        .update({ reported_balance: balance, last_reported_at: now, metadata, updated_at: now })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("supplier_balances")
        .insert({ supplier_id, reported_balance: balance, last_reported_at: now, metadata });
    }

    return new Response(
      JSON.stringify({ success: true, supplier_id, balance, fetched_at: now }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
