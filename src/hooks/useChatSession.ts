import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hr-chatbot`;
const ESCALATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-escalate`;

export function useChatSession() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [escalationTicket, setEscalationTicket] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Você precisa estar logado para usar o assistente");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }, []);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const headers = await getAuthHeaders();
      const allMessages = [...messages, userMsg];

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: allMessages,
          session_id: sessionIdRef.current,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao enviar mensagem");
      }

      const data = await resp.json();

      if (data.session_id) {
        sessionIdRef.current = data.session_id;
        setSessionId(data.session_id);
      }

      const botMsg: Message = { role: "assistant", content: data.reply };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar mensagem",
        variant: "destructive",
      });
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, getAuthHeaders]);

  const escalate = useCallback(async (summary?: string) => {
    if (!sessionIdRef.current) {
      toast({ title: "Erro", description: "Inicie uma conversa antes de escalar.", variant: "destructive" });
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const resp = await fetch(ESCALATE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          summary: summary || messages.filter(m => m.role === "user").pop()?.content || "",
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao escalar");
      }

      const data = await resp.json();
      setEscalationTicket(data.ticket_id);

      const botMsg: Message = {
        role: "assistant",
        content: `🎫 **Chamado criado: ${data.ticket_id}**\n\n${data.message}`,
      };
      setMessages(prev => [...prev, botMsg]);

      toast({ title: "Chamado criado", description: `Ticket: ${data.ticket_id}` });
    } catch (error) {
      console.error("Escalation error:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar chamado",
        variant: "destructive",
      });
    }
  }, [messages, getAuthHeaders]);

  const clearChat = useCallback(() => {
    setMessages([]);
    sessionIdRef.current = null;
    setSessionId(null);
    setEscalationTicket(null);
  }, []);

  return {
    messages,
    isLoading,
    sessionId,
    escalationTicket,
    sendMessage,
    escalate,
    clearChat,
  };
}
