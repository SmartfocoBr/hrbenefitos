import { useState } from "react";
import { useConnectorExecutions } from "@/hooks/useConnectorExecutions";
import { useConnectors } from "@/hooks/useConnectors";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Eye, RefreshCw } from "lucide-react";

const statusColors: Record<string, string> = {
  queued: "bg-muted text-muted-foreground",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const ExecutionHistoryTable = () => {
  const [connectorFilter, setConnectorFilter] = useState<string>("all");
  const [selectedExec, setSelectedExec] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: connectors } = useConnectors();
  const { data: executions, isLoading, refetch } = useConnectorExecutions(
    connectorFilter !== "all" ? connectorFilter : undefined
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={connectorFilter} onValueChange={setConnectorFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por conector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os conectores</SelectItem>
            {connectors?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tentativas</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Erro</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : !executions?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma execução encontrada
                </TableCell>
              </TableRow>
            ) : (
              executions.map((exec) => (
                <TableRow key={exec.id}>
                  <TableCell className="font-mono text-xs">{exec.job_type}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", statusColors[exec.status] ?? "")}>
                      {exec.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{exec.attempts ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {exec.started_at ? new Date(exec.started_at).toLocaleString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {exec.finished_at ? new Date(exec.finished_at).toLocaleString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-destructive max-w-[200px] truncate" title={exec.last_error ?? ""}>
                    {exec.last_error ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setSelectedExec(exec); setPreviewOpen(true); }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Execução</DialogTitle>
          </DialogHeader>
          {selectedExec && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">ID:</span> <span className="font-mono">{selectedExec.id}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={cn("text-xs", statusColors[selectedExec.status])}>{selectedExec.status}</Badge></div>
                <div><span className="text-muted-foreground">Job:</span> {selectedExec.job_type}</div>
                <div><span className="text-muted-foreground">Tentativas:</span> {selectedExec.attempts}</div>
              </div>

              {selectedExec.request_payload && (
                <div>
                  <p className="text-sm font-medium mb-1">Request Payload</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40 font-mono">
                    {JSON.stringify(selectedExec.request_payload, null, 2)}
                  </pre>
                </div>
              )}

              {selectedExec.response_payload && (
                <div>
                  <p className="text-sm font-medium mb-1">Response Payload</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40 font-mono">
                    {JSON.stringify(selectedExec.response_payload, null, 2)}
                  </pre>
                </div>
              )}

              {selectedExec.last_error && (
                <div>
                  <p className="text-sm font-medium mb-1 text-destructive">Erro</p>
                  <pre className="bg-destructive/10 text-destructive p-3 rounded text-xs overflow-auto">
                    {selectedExec.last_error}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExecutionHistoryTable;
