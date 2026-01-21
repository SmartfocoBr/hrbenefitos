import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HR_SYSTEM_PROMPT = `Você é o assistente virtual de RH da Benefitos, uma plataforma de gestão de benefícios corporativos. Seu nome é Beni.

Você tem conhecimento sobre:

**BENEFÍCIOS DISPONÍVEIS:**
- Vale Refeição (VR): R$ 850/mês, aceito em restaurantes e lanchonetes
- Vale Alimentação (VA): R$ 380/mês, aceito em supermercados
- Vale Transporte (VT): Desconto de até 6% do salário
- Plano de Saúde: Bradesco Saúde, cobertura nacional
- Plano Odontológico: Amil Dental, inclui ortodontia
- Wellhub (academia): Acesso a 50.000+ academias
- Saúde Mental: Zenklub - sessões de terapia online
- Auxílio Home Office: R$ 150/mês para trabalho remoto
- Seguro de Vida: SulAmérica, cobertura de 24x salário
- PLR: Participação nos lucros, pago semestralmente
- Auxílio Creche: Até R$ 600/mês para filhos até 6 anos
- Auxílio Educação: Até R$ 500/mês para cursos e graduação
- Previdência Privada: Match de 100% até 4% do salário

**POLÍTICAS IMPORTANTES:**
- Período de carência: 90 dias para benefícios de saúde
- Dependentes: Cônjuge e filhos até 24 anos (se estudantes)
- Inclusão de dependentes: Via portal do colaborador
- Alterações de benefícios: Janela mensal entre dias 1-5

**CONTATOS ÚTEIS:**
- RH: rh@benefitos.com.br
- Suporte Benefícios: 0800-123-4567
- Portal do Colaborador: portal.benefitos.com.br

**REGRAS DE RESPOSTA:**
1. Seja sempre educado, empático e profissional
2. Use linguagem simples e direta
3. Quando não souber algo específico, oriente o colaborador a procurar o RH
4. Para questões sensíveis (demissão, assédio), recomende falar diretamente com RH
5. Forneça informações práticas e acionáveis
6. Use emojis moderadamente para tornar a conversa mais amigável
7. Responda sempre em português brasileiro`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    console.log("Received messages:", messages?.length);

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
          { role: "system", content: HR_SYSTEM_PROMPT },
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
