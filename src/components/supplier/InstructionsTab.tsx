import { useState } from "react";
import { useSupplierInstructions } from "@/hooks/useSupplierInstructions";
import { useSupplierProviders } from "@/hooks/useSupplierProviders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Loader2, Eye, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  processing: "bg-blue-500/10 text-blue-700 border-blue-200",
  completed: "bg-green-500/10 text-green-700 border-green-200",
  failed: "bg-red-500/10 text-red-700 border-red-200",
  error: "bg-orange-500/10 text-orange-700 border-orange-200",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  completed: "Concluído",
  failed: "Falhou",
  error: "Erro",
};

interface Props {
  tenantId: string | null;
}

export default function InstructionsTab({ tenantId }: Props) {
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [confirmSend, setConfirmSend] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: providers } = useSupplierProviders(tenantId ?? undefined);
  const { data: instructions, isLoading, sendInstruction } = useSupplierInstructions(
    tenantId ?? undefined,
    selectedSupplier || undefined
  );

  const selectedInstruction = instructions?.find((i) => i.id === detailId);

  const handleConfirmSend = () => {
    if (confirmSend) {
      sendInstruction.mutate(confirmSend);
      setConfirmSend(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Instruções de Fornecedor</CardTitle>
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por fornecedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {providers?.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !instructions?.length ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma instrução encontrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TX Provedor</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Processado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructions.map((instr) => (
                <TableRow key={instr.id}>
                  <TableCell className="font-medium">
                    {(instr.supplier_providers as any)?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[instr.status] ?? ""}>
                      {statusLabels[instr.status] ?? instr.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {instr.provider_tx_id ?? "—"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(instr.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {instr.processed_at
                      ? format(new Date(instr.processed_at), "dd/MM/yy HH:mm", { locale: ptBR })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => setDetailId(instr.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {instr.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmSend(instr.id)}
                        disabled={sendInstruction.isPending}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Enviar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Send Confirmation Dialog */}
      <Dialog open={!!confirmSend} onOpenChange={() => setConfirmSend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmar Envio de Instrução
            </DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja enviar esta instrução ao fornecedor? Esta ação não pode ser desfeita e pode resultar em movimentação financeira.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSend(null)}>Cancelar</Button>
            <Button onClick={handleConfirmSend} disabled={sendInstruction.isPending}>
              {sendInstruction.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Instrução</DialogTitle>
          </DialogHeader>
          {selectedInstruction && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">ID:</span>{" "}
                <span className="font-mono">{selectedInstruction.id}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Status:</span>{" "}
                <Badge variant="outline" className={statusColors[selectedInstruction.status] ?? ""}>
                  {statusLabels[selectedInstruction.status] ?? selectedInstruction.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Payload:</span>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(selectedInstruction.payload, null, 2)}
                </pre>
              </div>
              {selectedInstruction.provider_response && (
                <div>
                  <span className="font-medium text-muted-foreground">Resposta do Provedor:</span>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedInstruction.provider_response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
