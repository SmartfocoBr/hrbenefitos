import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limiting
const RATE_LIMIT_WINDOW = 3600;
const RATE_LIMIT_MAX = 50;

// PII patterns to redact before sending to LLM
const PII_PATTERNS: { regex: RegExp; replacement: string }[] = [
  { regex: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, replacement: "[CPF_REDACTED]" },
  { regex: /\b\d{11}\b/g, replacement: "[CPF_REDACTED]" },
  { regex: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, replacement: "[CNPJ_REDACTED]" },
  { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: "[EMAIL_REDACTED]" },
  { regex: /\b(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}\b/g, replacement: "[PHONE_REDACTED]" },
  { regex: /\b\d{4}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}\b/g, replacement: "[CARD_REDACTED]" },
];

function redactPII(text: string): { redacted: string; hadPII: boolean } {
  let redacted = text;
  let hadPII = false;
  for (const { regex, replacement } of PII_PATTERNS) {
    const newText = redacted.replace(regex, replacement);
    if (newText !== redacted) hadPII = true;
    redacted = newText;
  }
  return { redacted, hadPII };
}

const HR_SYSTEM_PROMPT_BASE = `Você é o assistente virtual de RH da Benefitos, uma plataforma de gestão de benefícios corporativos. Seu nome é Beni.

**REGRAS DE RESPOSTA:**
1. Seja sempre educado, empático e profissional
2. Use linguagem simples e direta
3. Quando não souber algo específico, oriente o colaborador a procurar o RH
4. Para questões sensíveis (demissão, assédio), recomende falar diretamente com RH
5. Forneça informações práticas e acionáveis
6. Use emojis moderadamente para tornar a conversa mais amigável
7. Responda sempre em português brasileiro
8. Se o colaborador pedir para falar com um humano ou abrir um chamado, responda exatamente com: [ESCALATE] seguido de um breve resumo do problema.

**CONTATOS ÚTEIS:**
- RH: rh@benefitos.com.br
- Portal do Colaborador: portal.benefitos.com.br`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function validateMessages(messages: unknown): { valid: boolean; error?: string; data?: ChatMessage[] } {
  if (!Array.isArray(messages)) return { valid: false, error: "Mensagens devem ser um array" };
  if (messages.length === 0) return { valid: false, error: "Pelo menos uma mensagem é necessária" };
  if (messages.length > 20) return { valid: false, error: "Máximo de 20 mensagens permitido" };

  const validated: ChatMessage[] = [];
  for (const msg of messages) {
    if (typeof msg !== "object" || msg === null) return { valid: false, error: "Formato de mensagem inválido" };
    const { role, content } = msg as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return { valid: false, error: "Role deve ser 'user' ou 'assistant'" };
    if (typeof content !== "string" || content.length === 0) return { valid: false, error: "Conteúdo inválido" };
    if (content.length > 2000) return { valid: false, error: "Conteúdo máximo de 2000 caracteres" };
    validated.push({ role: role as "user" | "assistant", content: content.trim().slice(0, 2000) });
  }
  return { valid: true, data: validated };
}

async function checkRateLimit(serviceClient: SupabaseClient, userId: string): Promise<{ allowed: boolean; error?: string }> {
  const rateLimitKey = `chatbot:${userId}`;
  const nowSeconds = Math.floor(Date.now() / 1000);
  try {
    const { data, error } = await serviceClient.from("rate_limits").select("count, window_start").eq("key", rateLimitKey).maybeSingle();
    if (error) return { allowed: true };

    if (data) {
      const elapsed = nowSeconds - new Date(data.window_start).getTime() / 1000;
      if (elapsed < RATE_LIMIT_WINDOW) {
        if (data.count >= RATE_LIMIT_MAX) {
          return { allowed: false, error: `Limite de ${RATE_LIMIT_MAX} msgs/hora atingido. Tente em ${Math.ceil((RATE_LIMIT_WINDOW - elapsed) / 60)} min.` };
        }
        await serviceClient.from("rate_limits").update({ count: data.count + 1 }).eq("key", rateLimitKey);
      } else {
        await serviceClient.from("rate_limits").update({ count: 1, window_start: new Date().toISOString() }).eq("key", rateLimitKey);
      }
    } else {
      await serviceClient.from("rate_limits").insert({ key: rateLimitKey, count: 1, window_start: new Date().toISOString() });
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

// Fetch relevant KB articles using full-text search
async function fetchKBContext(serviceClient: SupabaseClient, tenantId: string, query: string): Promise<string> {
  try {
    // Simple keyword-based search using PostgreSQL full-text
    const searchTerms = query
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5)
      .join(" & ");

    if (!searchTerms) return "";

    const { data: articles } = await serviceClient
      .from("kb_articles")
      .select("title, content")
      .eq("tenant_id", tenantId)
      .textSearch("content", searchTerms, { config: "portuguese" })
      .limit(3);

    if (!articles || articles.length === 0) return "";

    let context = "\n\n**BASE DE CONHECIMENTO RELEVANTE:**\n";
    for (const article of articles) {
      // Truncate to avoid exceeding context window
      const snippet = article.content.slice(0, 500);
      context += `\n📄 **${article.title}**\n${snippet}\n`;
    }
    return context;
  } catch (err) {
    console.error("KB fetch error:", err);
    return "";
  }
}

// Build system prompt with company benefits + KB context
async function buildSystemPrompt(supabase: SupabaseClient, serviceClient: SupabaseClient, userId: string, tenantId: string | null, lastUserMsg: string): Promise<string> {
  let dynamicContent = "";

  try {
    if (tenantId) {
      const { data: policies } = await supabase
        .from("company_benefit_policies")
        .select("monthly_limit, min_tenure_days, contract_types, is_enabled, benefit_id")
        .eq("company_id", tenantId)
        .eq("is_enabled", true);

      if (policies && policies.length > 0) {
        const benefitIds = policies.map((p) => p.benefit_id);
        const { data: benefits } = await supabase.from("benefits").select("id, name, category, description, provider").in("id", benefitIds);

        if (benefits && benefits.length > 0) {
          const benefitMap = new Map(benefits.map((b) => [b.id, b]));
          dynamicContent = "\n\n**BENEFÍCIOS DISPONÍVEIS NA EMPRESA:**\n";
          for (const policy of policies) {
            const benefit = benefitMap.get(policy.benefit_id);
            if (benefit) {
              dynamicContent += `- ${benefit.name}`;
              if (policy.monthly_limit) dynamicContent += ` (limite: R$ ${Number(policy.monthly_limit).toLocaleString("pt-BR")}/mês)`;
              if (benefit.provider) dynamicContent += ` - ${benefit.provider}`;
              dynamicContent += "\n";
            }
          }
        }
      }

      // Fetch KB articles relevant to the user's last message
      const kbContext = await fetchKBContext(serviceClient, tenantId, lastUserMsg);
      dynamicContent += kbContext;
    }
  } catch (error) {
    console.error("Error loading context:", error);
  }

  return HR_SYSTEM_PROMPT_BASE + dynamicContent;
}

// Get or create a chat session for the user
async function getOrCreateSession(serviceClient: SupabaseClient, userId: string, tenantId: string): Promise<string> {
  // Find existing open session
  const { data: existing } = await serviceClient
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .eq("status", "open")
    .order("last_activity", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Update last_activity
    await serviceClient.from("chat_sessions").update({ last_activity: new Date().toISOString() }).eq("id", existing.id);
    return existing.id;
  }

  // Create new session
  const { data: newSession, error } = await serviceClient
    .from("chat_sessions")
    .insert({ user_id: userId, tenant_id: tenantId, status: "open" })
    .select("id")
    .single();

  if (error) throw new Error("Failed to create chat session");
  return newSession.id;
}

// Persist a message to chat_messages
async function persistMessage(serviceClient: SupabaseClient, sessionId: string, senderType: string, senderId: string | null, content: string) {
  await serviceClient.from("chat_messages").insert({
    session_id: sessionId,
    sender_type: senderType,
    sender_id: senderId,
    content,
  });
}

// Get user's tenant ID
async function getUserTenantId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data: employee } = await supabase.from("employees").select("company_id").eq("user_id", userId).maybeSingle();
  if (employee?.company_id) return employee.company_id;

  const { data: role } = await supabase.from("user_roles").select("company_id").eq("user_id", userId).not("company_id", "is", null).limit(1).maybeSingle();
  return role?.company_id ?? null;
}

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Rate limit
    const rl = await checkRateLimit(serviceClient, userId);
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: rl.error }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "JSON inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages: rawMessages, session_id: providedSessionId } = body as { messages?: unknown; session_id?: string };
    const validation = validateMessages(rawMessages);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = validation.data!;
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content ?? "";

    // Redact PII from messages before LLM
    const redactedMessages = messages.map((m) => {
      const { redacted } = redactPII(m.content);
      return { ...m, content: redacted };
    });

    // Get tenant
    const tenantId = await getUserTenantId(supabase, userId);

    // Session persistence (best-effort, don't block chat if DB fails)
    let sessionId = providedSessionId ?? null;
    try {
      if (tenantId) {
        if (!sessionId) {
          sessionId = await getOrCreateSession(serviceClient, userId, tenantId);
        }
        // Persist the latest user message
        await persistMessage(serviceClient, sessionId, "user", userId, lastUserMsg);
      }
    } catch (err) {
      console.error("Session persistence error (non-blocking):", err);
    }

    // Build prompt with KB context
    const systemPrompt = await buildSystemPrompt(supabase, serviceClient, userId, tenantId, lastUserMsg);

    // Call AI gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...redactedMessages],
        stream: false, // Use non-streaming to capture full response for persistence
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao processar mensagem." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const botContent = aiData.choices?.[0]?.message?.content ?? "Desculpe, não consegui processar sua solicitação.";

    // Persist bot response (best-effort)
    try {
      if (sessionId) {
        await persistMessage(serviceClient, sessionId, "bot", null, botContent);
      }
    } catch (err) {
      console.error("Bot message persistence error:", err);
    }

    return new Response(
      JSON.stringify({
        reply: botContent,
        session_id: sessionId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
