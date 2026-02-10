import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Missing Supabase credentials");

    const supabase = createClient(url, serviceKey);
    const { user_id, email } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, message: "Profile already exists" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user metadata from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(user_id);

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user_id,
      email: email || authUser?.user?.email || null,
      full_name: authUser?.user?.user_metadata?.full_name || authUser?.user?.user_metadata?.name || null,
      avatar_url: authUser?.user?.user_metadata?.avatar_url || null,
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, message: "Profile created" }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Onboard user error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
