import { useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Search,
  Download,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Activity,
  RefreshCw,
  Eye,
  Trash2,
  SkipForward,
  Play,
  Terminal,
  Database,
} from "lucide-react";
import { useSystemLogs } from "@/hooks/useSystemLogs";
import { useGlobalDLQ, useDLQActions } from "@/hooks/useGlobalDLQ";
import { useReprocessJobs } from "@/hooks/useReprocessJobs";
import { useTenant } from "@/hooks/useTenant";

// ─── Helpers ────────────────────────────────────────────
const levelBadge = (level: string) => {
  switch (level) {
    case "error": return <Badge variant="destructive">error</Badge>;
    case "warn": return <Badge className="bg-warning/10 text-warning border-warning/20">warn</Badge>;
    case "info": return <Badge variant="secondary">info</Badge>;
    default: return <Badge variant="outline">{level}</Badge>;
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case "success": return <Badge className="bg-success/10 text-success border-success/20">success</Badge>;
    case "running": return <Badge className="bg-info/10 text-info border-info/20">running</Badge>;
    case "failed": return <Badge variant="destructive">failed</Badge>;
    case "queued": return <Badge variant="secondary">queued</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR") : "—";

const JsonViewer = ({ data }: { data: unknown }) => (
  <pre className="text-xs bg-muted rounded-lg p-3 overflow-auto max-h-[300px] font-mono whitespace-pre-wrap break-all">
    {JSON.stringify(data, null, 2)}
  </pre>
);

// ─── Compliance / Security data (kept from original) ────
const complianceItems = [
  { id: 1, category: "LGPD", item: "Consentimento de Dados", status: "compliant", lastCheck: "2024-01-15", nextReview: "2024-04-15", description: "Todos os colaboradores com consentimento ativo" },
  { id: 2, category: "LGPD", item: "Política de Retenção", status: "compliant", lastCheck: "2024-01-10", nextReview: "2024-04-10", description: "Dados pessoais com período de retenção definido" },
  { id: 3, category: "Segurança", item: "Autenticação 2FA", status: "attention", lastCheck: "2024-01-12", nextReview: "2024-02-12", description: "85% dos usuários admin com 2FA ativo" },
  { id: 4, category: "Segurança", item: "Backup de Dados", status: "compliant", lastCheck: "2024-01-15", nextReview: "2024-01-22", description: "Backups diários realizados com sucesso" },
  { id: 5, category: "Trabalhista", item: "PAT - Programa de Alimentação", status: "compliant", lastCheck: "2024-01-05", nextReview: "2024-07-05", description: "Cadastro no PAT válido até 12/2024" },
  { id: 6, category: "Trabalhista", item: "Vale-Transporte", status: "attention", lastCheck: "2024-01-08", nextReview: "2024-02-08", description: "3 colaboradores pendentes de atualização cadastral" },
];

const getComplianceStatusBadge = (status: string) => {
  switch (status) {
    case "compliant": return <Badge className="bg-success/10 text-success border-success/20">Conforme</Badge>;
    case "attention": return <Badge className="bg-warning/10 text-warning border-warning/20">Atenção</Badge>;
    default: return <Badge variant="secondary">Desconhecido</Badge>;
  }
};

// ─── Main Component ─────────────────────────────────────
const Audit = () => {
  const [activeTab, setActiveTab] = useState("logs");
  const { activeTenantId: currentTenantId } = useTenant();

  // Logs state
  const [logSearch, setLogSearch] = useState("");
  const [logLevel, setLogLevel] = useState("all");
  const [logService, setLogService] = useState("all");
  const [selectedLog, setSelectedLog] = useState<Record<string, unknown> | null>(null);

  // DLQ state
  const [dlqSource, setDlqSource] = useState("all");
  const [reprocessDlq, setReprocessDlq] = useState<Record<string, unknown> | null>(null);
  const [payloadEdit, setPayloadEdit] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Hooks
  const { data: logs, isLoading: logsLoading } = useSystemLogs({
    tenantId: currentTenantId ?? undefined,
    level: logLevel !== "all" ? logLevel : undefined,
    service: logService !== "all" ? logService : undefined,
    search: logSearch || undefined,
  });

  const { data: dlqItems, isLoading: dlqLoading } = useGlobalDLQ(
    currentTenantId ?? undefined,
    dlqSource !== "all" ? dlqSource : undefined
  );

  const { data: jobs, isLoading: jobsLoading } = useReprocessJobs();
  const { reprocess, skip, deleteDLQ } = useDLQActions();

  // Derived
  const services = useMemo(() => {
    if (!logs) return [];
    return [...new Set(logs.map((l: { service: string }) => l.service))];
  }, [logs]);

  const dlqSources = useMemo(() => {
    if (!dlqItems) return [];
    return [...new Set(dlqItems.map((d: { source: string }) => d.source))];
  }, [dlqItems]);

  const handleReprocess = useCallback(() => {
    if (!reprocessDlq) return;
    let overrides: Record<string, unknown> | undefined;
    try {
      if (payloadEdit.trim()) overrides = JSON.parse(payloadEdit);
    } catch {
      // Invalid JSON, send without overrides
    }
    reprocess.mutate({ dlq_id: reprocessDlq.id as string, payload_overrides: overrides });
    setReprocessDlq(null);
    setPayloadEdit("");
  }, [reprocessDlq, payloadEdit, reprocess]);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Observabilidade & Auditoria</h1>
            <p className="text-muted-foreground mt-1">
              Logs do sistema, fila de mensagens mortas e rastreamento de reprocessamento
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 card-elevated text-center">
            <p className="text-2xl font-bold text-foreground">{logs?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Logs</p>
          </Card>
          <Card className="p-4 card-elevated text-center">
            <p className="text-2xl font-bold text-foreground">{dlqItems?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">DLQ Items</p>
          </Card>
          <Card className="p-4 card-elevated text-center">
            <p className="text-2xl font-bold text-foreground">
              {jobs?.filter((j: { status: string }) => j.status === "running").length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Jobs Ativos</p>
          </Card>
          <Card className="p-4 card-elevated text-center">
            <p className="text-2xl font-bold text-destructive">
              {logs?.filter((l: { level: string }) => l.level === "error").length ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap">
            <TabsTrigger value="logs" className="gap-2 data-[state=active]:bg-background">
              <Terminal className="h-4 w-4" /> Logs
            </TabsTrigger>
            <TabsTrigger value="dlq" className="gap-2 data-[state=active]:bg-background">
              <Database className="h-4 w-4" /> DLQ
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2 data-[state=active]:bg-background">
              <RefreshCw className="h-4 w-4" /> Reprocessamento
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2 data-[state=active]:bg-background">
              <Shield className="h-4 w-4" /> Conformidade
            </TabsTrigger>
          </TabsList>

          {/* ─── LOGS TAB ────────────────────────────── */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="p-6 card-elevated">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar em mensagens..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={logLevel} onValueChange={setLogLevel}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={logService} onValueChange={setLogService}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os serviços</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                {logsLoading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando logs...</p>
                ) : !logs?.length ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum log encontrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Nível</TableHead>
                        <TableHead className="w-[140px]">Serviço</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead className="w-[160px]">Data</TableHead>
                        <TableHead className="w-[60px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log: Record<string, unknown>) => (
                        <TableRow key={log.id as string}>
                          <TableCell>{levelBadge(log.level as string)}</TableCell>
                          <TableCell className="font-mono text-xs">{log.service as string}</TableCell>
                          <TableCell className="text-sm max-w-[400px] truncate">
                            {log.message as string}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(log.created_at as string)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* ─── DLQ TAB ─────────────────────────────── */}
          <TabsContent value="dlq" className="space-y-4">
            <Card className="p-6 card-elevated">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Select value={dlqSource} onValueChange={setDlqSource}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as fontes</SelectItem>
                    {dlqSources.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                {dlqLoading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando DLQ...</p>
                ) : !dlqItems?.length ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum item na DLQ</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fonte</TableHead>
                        <TableHead>Erro</TableHead>
                        <TableHead className="w-[80px]">Falhas</TableHead>
                        <TableHead className="w-[160px]">Próximo Retry</TableHead>
                        <TableHead className="w-[160px]">Criado em</TableHead>
                        <TableHead className="w-[140px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dlqItems.map((item: Record<string, unknown>) => (
                        <TableRow key={item.id as string}>
                          <TableCell className="font-mono text-xs">{item.source as string}</TableCell>
                          <TableCell className="text-sm max-w-[250px] truncate text-destructive">
                            {typeof item.error === "object"
                              ? JSON.stringify(item.error)
                              : String(item.error ?? "—")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{String(item.failure_count ?? 0)}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(item.next_retry as string | null)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(item.created_at as string)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Reprocessar"
                                onClick={() => {
                                  setReprocessDlq(item);
                                  setPayloadEdit(JSON.stringify(item.payload, null, 2));
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Ignorar"
                                onClick={() => skip.mutate(item.id as string)}
                              >
                                <SkipForward className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Excluir"
                                className="text-destructive"
                                onClick={() => setConfirmDelete(item.id as string)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* ─── REPROCESS JOBS TAB ──────────────────── */}
          <TabsContent value="jobs" className="space-y-4">
            <Card className="p-6 card-elevated">
              <ScrollArea className="h-[500px]">
                {jobsLoading ? (
                  <p className="text-center text-muted-foreground py-8">Carregando jobs...</p>
                ) : !jobs?.length ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum job de reprocessamento</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>DLQ ID</TableHead>
                        <TableHead className="w-[80px]">Tentativas</TableHead>
                        <TableHead>Último Erro</TableHead>
                        <TableHead className="w-[160px]">Criado em</TableHead>
                        <TableHead className="w-[160px]">Finalizado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job: Record<string, unknown>) => (
                        <TableRow key={job.id as string}>
                          <TableCell>{statusBadge(job.status as string)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {(job.dlq_id as string)?.slice(0, 8)}…
                          </TableCell>
                          <TableCell>{String(job.attempts ?? 0)}</TableCell>
                          <TableCell className="text-sm max-w-[300px] truncate text-destructive">
                            {(job.last_error as string) || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(job.created_at as string)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(job.finished_at as string | null)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* ─── COMPLIANCE TAB ──────────────────────── */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="p-6 card-elevated text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">4</p>
                <p className="text-sm text-muted-foreground">Itens Conformes</p>
              </Card>
              <Card className="p-6 card-elevated text-center">
                <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">2</p>
                <p className="text-sm text-muted-foreground">Requerem Atenção</p>
              </Card>
              <Card className="p-6 card-elevated text-center">
                <Clock className="h-12 w-12 text-info mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">3</p>
                <p className="text-sm text-muted-foreground">Revisões Pendentes</p>
              </Card>
            </div>

            <Card className="p-6 card-elevated">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Checklist de Conformidade</h3>
                <p className="text-sm text-muted-foreground">Status dos requisitos regulatórios e de segurança</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Verificação</TableHead>
                    <TableHead>Próxima Revisão</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>{getComplianceStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(item.lastCheck).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(item.nextReview).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[250px]">{item.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Log Detail Dialog ─────────────────────── */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Detalhes do Log
              </DialogTitle>
              <DialogDescription>
                {selectedLog?.service as string} · {formatDate(selectedLog?.created_at as string)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                {levelBadge(selectedLog?.level as string ?? "info")}
                {selectedLog?.hash && (
                  <span className="font-mono text-xs text-muted-foreground">
                    hash: {(selectedLog.hash as string).slice(0, 16)}…
                  </span>
                )}
              </div>
              <p className="text-sm">{selectedLog?.message as string}</p>
              {selectedLog?.context && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Contexto</p>
                  <JsonViewer data={selectedLog.context} />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ─── Reprocess Dialog ──────────────────────── */}
        <Dialog open={!!reprocessDlq} onOpenChange={() => setReprocessDlq(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Reprocessar Item da DLQ
              </DialogTitle>
              <DialogDescription>
                Edite o payload abaixo se necessário e confirme o reprocessamento.
                Esta ação pode disparar efeitos colaterais em sistemas externos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Erro Original</p>
                <p className="text-sm text-destructive">
                  {typeof reprocessDlq?.error === "object"
                    ? JSON.stringify(reprocessDlq.error)
                    : String(reprocessDlq?.error ?? "—")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Payload (editável)</p>
                <Textarea
                  value={payloadEdit}
                  onChange={(e) => setPayloadEdit(e.target.value)}
                  className="font-mono text-xs min-h-[200px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReprocessDlq(null)}>
                Cancelar
              </Button>
              <Button onClick={handleReprocess} disabled={reprocess.isPending}>
                {reprocess.isPending ? "Processando..." : "Confirmar Reprocessamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Delete Confirmation ───────────────────── */}
        <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir item da DLQ?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível e requer permissão de super_admin ou SRE.
                O item e seus dados de reprocessamento serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (confirmDelete) deleteDLQ.mutate(confirmDelete);
                  setConfirmDelete(null);
                }}
              >
                Excluir Permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Audit;
