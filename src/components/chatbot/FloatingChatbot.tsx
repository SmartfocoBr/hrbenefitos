import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle, X, Minimize2, Maximize2,
  Sparkles, HelpCircle, RefreshCw, HeadphonesIcon, Ticket,
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { cn } from "@/lib/utils";
import { useChatSession } from "@/hooks/useChatSession";

const QUICK_QUESTIONS = [
  "Quais benefícios eu tenho direito?",
  "Como incluir um dependente?",
  "Qual o valor do VR?",
  "Como funciona o PLR?",
];

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    escalationTicket,
    sendMessage,
    escalate,
    clearChat,
  } = useChatSession();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed z-50 shadow-2xl transition-all duration-300 overflow-hidden flex flex-col",
        isMinimized
          ? "bottom-6 right-6 w-80 h-14"
          : "bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className="font-semibold">Beni - Assistente RH</h3>
            {!isMinimized && (
              <p className="text-xs text-white/80">Online • Responde em segundos</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && messages.length > 0 && (
            <>
              {!escalationTicket && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => escalate()}
                  className="h-8 w-8 text-white hover:bg-white/20"
                  title="Falar com humano"
                >
                  <HeadphonesIcon className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-8 w-8 text-white hover:bg-white/20"
                title="Nova conversa"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Escalation Banner */}
          {escalationTicket && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b flex items-center gap-2 text-sm shrink-0">
              <Ticket className="h-4 w-4 text-amber-600" />
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                Chamado: {escalationTicket}
              </span>
            </div>
          )}

          {/* Messages Area */}
          <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-4">
                    <HelpCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Olá! Sou o Beni 👋</h4>
                  <p className="text-sm text-muted-foreground">
                    Posso ajudar com dúvidas sobre benefícios, políticas e procedimentos de RH.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Perguntas frequentes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((question) => (
                      <Badge
                        key={question}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3"
                        onClick={() => sendMessage(question)}
                      >
                        {question}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2">
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                  />
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3 p-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <ChatInput
            onSend={sendMessage}
            disabled={isLoading}
            placeholder="Pergunte sobre benefícios, políticas..."
          />
        </>
      )}
    </Card>
  );
}
