import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDownRight, ArrowUpRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/walletData";
import { LedgerEntry } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface TransactionListProps {
  transactions: LedgerEntry[];
  walletId: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  pending: { label: "Pendente", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
  completed: { label: "Confirmado", variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: "Falhou", variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
};

export function TransactionList({ transactions, walletId }: TransactionListProps) {
  const queryClient = useQueryClient();

  // Realtime subscription for ledger updates
  useEffect(() => {
    const channel = supabase
      .channel(`wallet-ledger-${walletId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wallet_ledger", filter: `wallet_id=eq.${walletId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["wallet", walletId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [walletId, queryClient]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px]">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação encontrada.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const cfg = statusConfig[tx.status] ?? statusConfig.pending;
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-full ${tx.type === "allocation" ? "bg-amber-500/10" : "bg-green-500/10"}`}>
                      {tx.type === "allocation" ? (
                        <ArrowDownRight className="h-4 w-4 text-amber-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant={cfg.variant} className="gap-1 text-xs">
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                    <span className="text-sm font-bold">{formatCurrency(tx.amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
