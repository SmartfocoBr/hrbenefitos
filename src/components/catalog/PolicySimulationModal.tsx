import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Play, Loader2 } from "lucide-react";
import { usePolicySimulation, SimulationResult } from "@/hooks/usePolicySimulation";
import { useEmployees } from "@/hooks/useEmployees";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyId: string | null;
}

const PolicySimulationModal = ({ open, onOpenChange, policyId }: Props) => {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const { employees = [] } = useEmployees();
  const { simulate } = usePolicySimulation();

  const handleRun = async () => {
    if (!policyId || !employeeId) return;
    setResult(null);
    simulate.mutate(
      { policy_id: policyId, employee_id: employeeId },
      { onSuccess: (data) => setResult(data) }
    );
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setResult(null);
      setEmployeeId("");
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Simular Política</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Colaborador</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Selecione um colaborador" /></SelectTrigger>
              <SelectContent>
                {employees.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.first_name} {e.last_name} — {e.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleRun}
            disabled={!employeeId || simulate.isPending}
            className="w-full"
          >
            {simulate.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Simulando...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" />Executar Simulação</>
            )}
          </Button>

          {result && (
            <Card className={result.eligible ? "border-primary/50" : "border-destructive/50"}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  {result.eligible ? (
                    <><CheckCircle2 className="h-5 w-5 text-primary" /><span className="font-medium text-primary">Elegível</span></>
                  ) : (
                    <><XCircle className="h-5 w-5 text-destructive" /><span className="font-medium text-destructive">Não Elegível</span></>
                  )}
                  {result.metadata && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      v{result.metadata.policy_version}
                    </Badge>
                  )}
                </div>

                {result.reasons && result.reasons.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Motivos:</p>
                    <ul className="text-sm space-y-1">
                      {result.reasons.map((r, i) => (
                        <li key={i} className="text-destructive text-xs">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.computed_limits && Object.keys(result.computed_limits).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Limites Calculados:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(result.computed_limits).map(([k, v]) => (
                        <div key={k} className="bg-muted rounded px-2 py-1">
                          <span className="text-xs text-muted-foreground">{k}</span>
                          <p className="text-sm font-medium">{typeof v === "number" ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(v)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.metadata && (
                  <p className="text-xs text-muted-foreground">
                    Avaliado em {new Date(result.metadata.evaluated_at).toLocaleString("pt-BR")} · Política: {result.metadata.policy_name}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PolicySimulationModal;
