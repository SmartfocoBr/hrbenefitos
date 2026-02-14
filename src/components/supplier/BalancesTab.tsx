import { useSupplierBalances } from "@/hooks/useReconciliations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, Clock, AlertTriangle } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  tenantId: string | null;
}

export default function BalancesTab({ tenantId }: Props) {
  const { data: balances, isLoading } = useSupplierBalances(tenantId ?? undefined);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!balances?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum saldo de fornecedor disponível.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {balances.map((b) => {
        const hoursSinceSync = b.last_reported_at
          ? differenceInHours(new Date(), new Date(b.last_reported_at))
          : null;
        const isStale = hoursSinceSync !== null && hoursSinceSync > 24;

        return (
          <Card key={b.id} className={isStale ? "border-destructive/50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">
                {(b.supplier_providers as any)?.name ?? "Fornecedor"}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {(b.supplier_providers as any)?.provider_type ?? "—"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(b.reported_balance)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {b.last_reported_at
                  ? format(new Date(b.last_reported_at), "dd/MM/yy HH:mm", { locale: ptBR })
                  : "Nunca sincronizado"}
              </div>
              {isStale && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Saldo desatualizado ({hoursSinceSync}h atrás)
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
