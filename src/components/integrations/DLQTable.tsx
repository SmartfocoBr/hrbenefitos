import { useState } from "react";
import { useConnectorDLQ, useReprocessDLQ } from "@/hooks/useConnectorDLQ";
import { useConnectors } from "@/hooks/useConnectors";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Eye, RotateCcw, Search } from "lucide-react";

const DLQTable = () => {
  const [connectorFilter, setConnectorFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [payloadEdit, setPayloadEdit] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: connectors } = useConnectors();
  const { data: dlqItems, isLoading, refetch } = useConnectorDLQ(
    connectorFilter !== "all" ? connectorFilter : undefined
  );
  const reprocessMutation = useReprocessDLQ();

  const filtered = dlqItems?.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.id.toLowerCase().includes(q) ||
      item.execution_id?.toLowerCase().includes(q) ||
      item.error?.toLowerCase().includes(q)
    );
  });

  const openItem = (item: any) => {
    setSelectedItem(item);
    setPayloadEdit(JSON.stringify(item.payload, null, 2));
    setModalOpen(true);
  };

  const handleReprocess = () => {
    if (!selectedItem) return;
    let overrides: Record<string, unknown> | undefined;
    try {
      const edited = JSON.parse(payloadEdit);
      const original = selectedItem.payload;
      if (JSON.stringify(edited) !== JSON.stringify(original)) {
        overrides = edited;
      }
    } catch { /* use original */ }

    reprocessMutation.mutate({ dlq_id: selectedItem.id, payload_overrides: overrides }, {
      onSuccess: () => setModalOpen(false),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID ou erro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={connectorFilter} onValueChange={setConnectorFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por conector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
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
              <TableHead>Conector</TableHead>
              <TableHead>Falhas</TableHead>
              <TableHead>Erro</TableHead>
              <TableHead>Próximo Retry</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
              </TableRow>
            ) : !filtered?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum item na DLQ
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">
                    {(item.connectors as any)?.name ?? item.connector_id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="text-xs">{item.failure_count}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-destructive max-w-[250px] truncate" title={item.error ?? ""}>
                    {item.error ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.next_retry ? new Date(item.next_retry).toLocaleString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openItem(item)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-primary"
                        onClick={() => openItem(item)}
                        title="Reprocessar"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Item DLQ — Reprocessar</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">ID:</span> <span className="font-mono text-xs">{selectedItem.id}</span></div>
                <div><span className="text-muted-foreground">Falhas:</span> {selectedItem.failure_count}</div>
                <div><span className="text-muted-foreground">Execution:</span> <span className="font-mono text-xs">{selectedItem.execution_id ?? "—"}</span></div>
              </div>

              {selectedItem.error && (
                <div>
                  <p className="text-sm font-medium mb-1 text-destructive">Erro</p>
                  <pre className="bg-destructive/10 text-destructive p-3 rounded text-xs overflow-auto">
                    {selectedItem.error}
                  </pre>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-1">Payload (editável para reprocessamento)</p>
                <Textarea
                  value={payloadEdit}
                  onChange={(e) => setPayloadEdit(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleReprocess} disabled={reprocessMutation.isPending} className="gap-1">
              <RotateCcw className="h-3.5 w-3.5" />
              {reprocessMutation.isPending ? "Reprocessando..." : "Reprocessar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DLQTable;
