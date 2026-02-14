import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "JSON inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionId = body.session_id as string | undefined;
    const summary = typeof body.summary === "string" ? body.summary.slice(0, 500) : "";

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "session_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify session belongs to user
    const { data: session } = await serviceClient
      .from("chat_sessions")
      .select("id, user_id, tenant_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (!session || session.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Sessão não encontrada." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing open escalation
    const { data: existing } = await serviceClient
      .from("chat_escalations")
      .select("id, ticket_id")
      .eq("session_id", sessionId)
      .eq("status", "open")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          ticket_id: existing.ticket_id,
          escalation_id: existing.id,
          message: "Já existe um chamado aberto para esta conversa.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate ticket ID: ESC-<timestamp_short>-<random>
    const ticketId = `ESC-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    // Create escalation
    const { data: escalation, error: escError } = await serviceClient
      .from("chat_escalations")
      .insert({
        session_id: sessionId,
        ticket_id: ticketId,
        status: "open",
      })
      .select("id, ticket_id, status, created_at")
      .single();

    if (escError) {
      console.error("Escalation creation error:", escError);
      return new Response(JSON.stringify({ error: "Erro ao criar chamado." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist a system message in the chat noting the escalation
    await serviceClient.from("chat_messages").insert({
      session_id: sessionId,
      sender_type: "bot",
      content: `🎫 Chamado ${ticketId} criado. Um atendente entrará em contato em breve.${summary ? ` Resumo: ${summary}` : ""}`,
    });

    console.log("Escalation created:", ticketId, "for session:", sessionId);

    return new Response(
      JSON.stringify({
        ticket_id: escalation.ticket_id,
        escalation_id: escalation.id,
        status: escalation.status,
        created_at: escalation.created_at,
        message: `Chamado ${ticketId} criado com sucesso. Um atendente entrará em contato.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Escalation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
