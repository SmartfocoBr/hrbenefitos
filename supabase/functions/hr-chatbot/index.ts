import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const RATE_LIMIT_MAX = 50; // Max requests per hour per user

// Generic HR assistant prompt without sensitive company data
const HR_SYSTEM_PROMPT_BASE = `Você é o assistente virtual de RH da Benefitos, uma plataforma de gestão de benefícios corporativos. Seu nome é Beni.

**REGRAS DE RESPOSTA:**
1. Seja sempre educado, empático e profissional
2. Use linguagem simples e direta
3. Quando não souber algo específico, oriente o colaborador a procurar o RH
4. Para questões sensíveis (demissão, assédio), recomende falar diretamente com RH
5. Forneça informações práticas e acionáveis
6. Use emojis moderadamente para tornar a conversa mais amigável
7. Responda sempre em português brasileiro

**CONTATOS ÚTEIS:**
- RH: rh@benefitos.com.br
- Portal do Colaborador: portal.benefitos.com.br`;

// Input validation schema
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function validateMessages(messages: unknown): { valid: boolean; error?: string; data?: ChatMessage[] } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "Mensagens devem ser um array" };
  }

  if (messages.length === 0) {
    return { valid: false, error: "Pelo menos uma mensagem é necessária" };
  }

  if (messages.length > 20) {
    return { valid: false, error: "Máximo de 20 mensagens permitido" };
  }

  const validatedMessages: ChatMessage[] = [];

  for (const msg of messages) {
    if (typeof msg !== "object" || msg === null) {
      return { valid: false, error: "Formato de mensagem inválido" };
    }

    const { role, content } = msg as Record<string, unknown>;

    if (role !== "user" && role !== "assistant") {
      return { valid: false, error: "Role deve ser 'user' ou 'assistant'" };
    }

    if (typeof content !== "string") {
      return { valid: false, error: "Conteúdo deve ser uma string" };
    }

    if (content.length === 0) {
      return { valid: false, error: "Conteúdo não pode ser vazio" };
    }

    if (content.length > 2000) {
      return { valid: false, error: "Conteúdo máximo de 2000 caracteres por mensagem" };
    }

    validatedMessages.push({
      role: role as "user" | "assistant",
      content: content.trim().slice(0, 2000),
    });
  }

  return { valid: true, data: validatedMessages };
}

// Rate limiting check using service role client
async function checkRateLimit(
  serviceClient: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; error?: string }> {
  const rateLimitKey = `chatbot:${userId}`;
  const nowSeconds = Math.floor(Date.now() / 1000);

  try {
    // Get current rate limit entry
    const { data: rateLimitData, error: fetchError } = await serviceClient
      .from("rate_limits")
      .select("count, window_start")
      .eq("key", rateLimitKey)
      .maybeSingle();

    if (fetchError) {
      console.error("Rate limit fetch error:", fetchError);
      // Allow request on error (fail open for availability)
      return { allowed: true };
    }

    if (rateLimitData) {
      const windowStartSeconds = new Date(rateLimitData.window_start).getTime() / 1000;
      const windowElapsed = nowSeconds - windowStartSeconds;

      if (windowElapsed < RATE_LIMIT_WINDOW) {
        // Still within rate limit window
        if (rateLimitData.count >= RATE_LIMIT_MAX) {
          const remainingMinutes = Math.ceil((RATE_LIMIT_WINDOW - windowElapsed) / 60);
          return {
            allowed: false,
            error: `Você atingiu o limite de ${RATE_LIMIT_MAX} mensagens por hora. Tente novamente em ${remainingMinutes} minutos.`,
          };
        }

        // Increment counter
        await serviceClient
          .from("rate_limits")
          .update({ count: rateLimitData.count + 1 })
          .eq("key", rateLimitKey);
      } else {
        // Window expired, reset counter
        await serviceClient
          .from("rate_limits")
          .update({
            count: 1,
            window_start: new Date().toISOString(),
          })
          .eq("key", rateLimitKey);
      }
    } else {
      // Create new rate limit entry
      await serviceClient.from("rate_limits").insert({
        key: rateLimitKey,
        count: 1,
        window_start: new Date().toISOString(),
      });
    }

    return { allowed: true };
  } catch (err) {
    console.error("Rate limit check error:", err);
    // Allow request on unexpected errors
    return { allowed: true };
  }
}

// Build dynamic system prompt with user's company benefits
async function buildSystemPrompt(supabase: SupabaseClient, userId: string): Promise<string> {
  let dynamicContent = "";

  try {
    // Get user's company through employee record
    const { data: employee } = await supabase
      .from("employees")
      .select("company_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (employee?.company_id) {
      // Get company benefit policies
      const { data: policies } = await supabase
        .from("company_benefit_policies")
        .select("monthly_limit, min_tenure_days, contract_types, is_enabled, benefit_id")
        .eq("company_id", employee.company_id)
        .eq("is_enabled", true);

      if (policies && policies.length > 0) {
        // Get benefit details separately
        const benefitIds = policies.map(p => p.benefit_id);
        const { data: benefits } = await supabase
          .from("benefits")
          .select("id, name, category, description, provider")
          .in("id", benefitIds);

        if (benefits && benefits.length > 0) {
          const benefitMap = new Map(benefits.map(b => [b.id, b]));
          
          dynamicContent = "\n\n**BENEFÍCIOS DISPONÍVEIS NA SUA EMPRESA:**\n";
          for (const policy of policies) {
            const benefit = benefitMap.get(policy.benefit_id);
            if (benefit) {
              dynamicContent += `- ${benefit.name}`;
              if (policy.monthly_limit) {
                dynamicContent += ` (limite: R$ ${Number(policy.monthly_limit).toLocaleString("pt-BR")}/mês)`;
              }
              if (benefit.provider) {
                dynamicContent += ` - ${benefit.provider}`;
              }
              dynamicContent += "\n";
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error loading company benefits:", error);
    // Continue with base prompt if loading fails
  }

  return HR_SYSTEM_PROMPT_BASE + dynamicContent;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado. Faça login para usar o assistente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // User client for authenticated queries
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Service client for rate limiting (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Verify user by getting user data
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("User verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Sessão inválida. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    // 4. Check rate limit
    const rateLimitResult = await checkRateLimit(serviceClient, userId);
    if (!rateLimitResult.allowed) {
      console.warn("Rate limit exceeded for user:", userId);
      return new Response(
        JSON.stringify({ error: rateLimitResult.error }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Parse and validate input
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "JSON inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages: rawMessages } = requestBody as { messages?: unknown };
    const validation = validateMessages(rawMessages);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = validation.data!;
    console.log("Validated messages count:", messages.length);

    // 6. Build dynamic system prompt with user's company benefits
    const systemPrompt = await buildSystemPrompt(supabase, userId);

    // 7. Call AI gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Por favor, aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Limite de uso atingido. Entre em contato com o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua mensagem. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
