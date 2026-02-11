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
    const { supplier_id, external_code, external_codes } = await req.json();

    if (!supplier_id) {
      return new Response(JSON.stringify({ error: "supplier_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const codes: string[] = external_codes ?? (external_code ? [external_code] : []);
    if (codes.length === 0) {
      return new Response(JSON.stringify({ error: "external_code or external_codes required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: mappings, error } = await supabase
      .from("supplier_error_map")
      .select("external_code, category, recommended_action")
      .eq("supplier_id", supplier_id)
      .in("external_code", codes);

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch error mappings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build lookup
    const mapped = new Map((mappings ?? []).map((m) => [m.external_code, m]));
    const results = codes.map((code) => {
      const match = mapped.get(code);
      return {
        external_code: code,
        category: match?.category ?? "unknown",
        recommended_action: match?.recommended_action ?? { action: "manual_review", description: "Unmapped error code" },
        is_transient: (match?.category ?? "unknown") === "transient",
        should_retry: (match?.category ?? "unknown") === "transient",
      };
    });

    return new Response(
      JSON.stringify({ success: true, supplier_id, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
