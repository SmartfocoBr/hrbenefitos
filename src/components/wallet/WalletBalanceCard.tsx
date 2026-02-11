import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wallet, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/walletData";

interface WalletBalanceCardProps {
  amount: number;
  available: number;
  reserved: number;
  currency: string;
  validTo?: string | null;
}

export function WalletBalanceCard({ amount, available, reserved, currency, validTo }: WalletBalanceCardProps) {
  const usedPct = amount > 0 ? ((amount - available) / amount) * 100 : 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Total</p>
              <p className="text-3xl font-bold">{formatCurrency(amount)}</p>
            </div>
          </div>
          <Badge variant="outline" className="uppercase">{currency}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <p className="text-xs text-muted-foreground">Disponível</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(available)}</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg">
            <p className="text-xs text-muted-foreground">Reservado</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(reserved)}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Utilização</span>
            <span>{usedPct.toFixed(0)}%</span>
          </div>
          <Progress value={usedPct} className="h-2" />
        </div>

        {validTo && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Expira em {new Date(validTo).toLocaleDateString("pt-BR")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
