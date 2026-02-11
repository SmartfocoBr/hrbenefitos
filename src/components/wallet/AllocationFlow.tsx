import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Calculator, CheckCircle2, AlertCircle, Loader2, ArrowRight, Send, XCircle,
} from "lucide-react";
import { useWalletSimulation, SimulationResult } from "@/hooks/useWalletSimulation";
import { useApplyAllocation } from "@/hooks/useApplyAllocation";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/walletData";

interface AllocationItem {
  category: string;
  label: string;
  amount: number;
  tax_percentage: number;
}

interface AllocationFlowProps {
  walletId: string;
  employeeId: string;
  availableAmount: number;
  policyId?: string | null;
  connectorId?: string | null;
  onComplete?: (txId: string) => void;
}

const DEFAULT_CATEGORIES: Omit<AllocationItem, "amount">[] = [
  { category: "alimentacao", label: "Alimentação", tax_percentage: 0 },
  { category: "saude", label: "Saúde", tax_percentage: 0 },
  { category: "transporte", label: "Transporte", tax_percentage: 0 },
  { category: "bemestar", label: "Bem-estar", tax_percentage: 27.5 },
  { category: "educacao", label: "Educação", tax_percentage: 15 },
  { category: "cultura", label: "Cultura", tax_percentage: 27.5 },
];

export function AllocationFlow({
  walletId, employeeId, availableAmount, policyId, connectorId, onComplete,
}: AllocationFlowProps) {
  const [step, setStep] = useState<"input" | "review" | "confirm">("input");
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const simulate = useWalletSimulation();
  const apply = useApplyAllocation();

  const totalRequested = useMemo(
    () => Object.values(amounts).reduce((s, v) => s + (v || 0), 0),
    [amounts]
  );

  const allocationItems = useMemo(
    () =>
      DEFAULT_CATEGORIES.filter((c) => (amounts[c.category] || 0) > 0).map((c) => ({
        ...c,
        amount: amounts[c.category] || 0,
      })),
    [amounts]
  );

  const handleSimulate = () => {
    if (allocationItems.length === 0) return;
    simulate.mutate(
      { wallet_id: walletId, allocation_json: allocationItems },
      {
        onSuccess: (data) => {
          setSimulation(data);
          setStep("review");
        },
        onError: (err) => toast({ title: "Erro na simulação", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleApply = () => {
    apply.mutate(
      {
        wallet_id: walletId,
        employee_id: employeeId,
        allocation_json: allocationItems,
        policy_id: policyId ?? null,
        connector_id: connectorId ?? null,
      },
      {
        onSuccess: (data) => {
          setConfirmOpen(false);
          setStep("confirm");
          toast({ title: "Alocação enviada", description: `Transação ${data.transaction_id.slice(0, 8)}… pendente de confirmação.` });
          onComplete?.(data.transaction_id);
        },
        onError: (err) => toast({ title: "Erro ao aplicar", description: err.message, variant: "destructive" }),
      }
    );
  };

  if (step === "confirm") {
    return (
      <Card className="border-green-500/30">
        <CardContent className="pt-6 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h3 className="text-xl font-semibold">Alocação Enviada!</h3>
          <p className="text-muted-foreground">
            Sua transação está com status <Badge variant="secondary">Pendente</Badge> e será finalizada após confirmação do fornecedor.
          </p>
          <Button variant="outline" onClick={() => { setStep("input"); setSimulation(null); setAmounts({}); }}>
            Nova Alocação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Input */}
      {step === "input" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Distribuir Benefícios
            </CardTitle>
            <CardDescription>
              Disponível: <span className="font-semibold text-foreground">{formatCurrency(availableAmount)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DEFAULT_CATEGORIES.map((cat) => (
              <div key={cat.category} className="flex items-center gap-4">
                <Label className="w-28 text-sm">{cat.label}</Label>
                <Input
                  type="number"
                  min={0}
                  step={10}
                  placeholder="0,00"
                  className="w-36"
                  value={amounts[cat.category] || ""}
                  onChange={(e) =>
                    setAmounts((p) => ({ ...p, [cat.category]: Number(e.target.value) || 0 }))
                  }
                />
                {cat.tax_percentage > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {cat.tax_percentage}% imposto
                  </Badge>
                )}
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total solicitado</span>
              <span className={totalRequested > availableAmount ? "text-destructive font-bold" : "font-bold"}>
                {formatCurrency(totalRequested)}
              </span>
            </div>
            {totalRequested > availableAmount && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Saldo insuficiente.</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={totalRequested <= 0 || totalRequested > availableAmount || simulate.isPending}
              onClick={handleSimulate}
            >
              {simulate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Simular Alocação
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Review Simulation */}
      {step === "review" && simulation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Resultado da Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {simulation.violations.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {simulation.violations.map((v) => v.message).join("; ")}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Solicitado</p>
                <p className="text-lg font-bold">{formatCurrency(simulation.total_requested)}</p>
              </div>
              <div className="text-center p-3 bg-destructive/10 rounded-lg">
                <p className="text-xs text-muted-foreground">Impostos</p>
                <p className="text-lg font-bold text-destructive">-{formatCurrency(simulation.total_tax)}</p>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg">
                <p className="text-xs text-muted-foreground">Líquido</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(simulation.total_net)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              {simulation.breakdown.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{item.category}</span>
                  <div className="flex items-center gap-4">
                    <span>{formatCurrency(item.amount)}</span>
                    {item.tax_amount > 0 && (
                      <span className="text-destructive text-xs">-{formatCurrency(item.tax_amount)}</span>
                    )}
                    <span className="font-medium">{formatCurrency(item.net_amount)}</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator />
            <div className="flex justify-between text-sm">
              <span>Saldo restante após alocação</span>
              <span className="font-bold">{formatCurrency(simulation.remaining_after)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep("input")}>
              Voltar
            </Button>
            <Button
              className="flex-1"
              disabled={!simulation.valid}
              onClick={() => setConfirmOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Confirmar Alocação
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Alocação</DialogTitle>
            <DialogDescription>
              Você está prestes a alocar <strong>{formatCurrency(simulation?.total_requested ?? 0)}</strong>.
              Esta ação moverá o valor para reserva e iniciará o processamento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleApply} disabled={apply.isPending}>
              {apply.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
