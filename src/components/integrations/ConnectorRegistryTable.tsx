import { useState } from "react";
import { useConnectors } from "@/hooks/useConnectors";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpdateConnector } from "@/hooks/useConnectors";
import ConnectorFormDialog from "./ConnectorFormDialog";
import { Search, Plus, Settings, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ConnectorRegistryTable = () => {
  const { data: connectors, isLoading } = useConnectors();
  const updateMutation = useUpdateConnector();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editConnector, setEditConnector] = useState<any>(null);

  const types = Array.from(new Set(connectors?.map((c) => c.connector_type) ?? []));

  const filtered = connectors?.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.connector_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === "all" || c.connector_type === typeFilter;
    return matchSearch && matchType;
  });

  const getHealthStatus = (c: any) => {
    const health = c.connector_health?.[0];
    if (!health) return { status: "unknown", icon: HelpCircle, color: "text-muted-foreground" };
    if (health.status === "healthy" || health.status === "success")
      return { status: health.status, icon: CheckCircle, color: "text-green-500" };
    if (health.status === "degraded")
      return { status: "degraded", icon: HelpCircle, color: "text-yellow-500" };
    return { status: health.status ?? "unhealthy", icon: XCircle, color: "text-destructive" };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="gap-1" onClick={() => { setEditConnector(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo Conector
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Latência</TableHead>
              <TableHead>Último Check</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
              </TableRow>
            ) : !filtered?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum conector encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const hs = getHealthStatus(c);
                const health = c.connector_health?.[0];
                const Icon = hs.icon;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{c.connector_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn("flex items-center gap-1 text-sm", hs.color)}>
                        <Icon className="h-4 w-4" /> {hs.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {health?.latency_ms != null ? `${health.latency_ms}ms` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {health?.last_check ? new Date(health.last_check).toLocaleString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.is_enabled ?? false}
                        onCheckedChange={(checked) => updateMutation.mutate({ id: c.id, is_enabled: checked })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => { setEditConnector(c); setFormOpen(true); }}
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ConnectorFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        connector={editConnector}
      />
    </div>
  );
};

export default ConnectorRegistryTable;
