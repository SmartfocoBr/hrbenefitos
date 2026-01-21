import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Integration } from "@/types/integration";
import { statusConfig, syncLogsData } from "@/lib/integrationsData";
import { cn } from "@/lib/utils";
import { 
  Settings, 
  Activity, 
  FileText, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  Link2
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IntegrationDetailDialogProps {
  integration: Integration | null;
  open: boolean;
  onClose: () => void;
}

const IntegrationDetailDialog = ({ integration, open, onClose }: IntegrationDetailDialogProps) => {
  if (!integration) return null;

  const Icon = integration.icon;
  const status = statusConfig[integration.status];
  const logs = syncLogsData.filter(log => log.integrationId === integration.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${integration.color}15` }}
            >
              <Icon className="h-8 w-8" style={{ color: integration.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl">{integration.name}</DialogTitle>
                <Badge variant="outline" className={cn("text-xs", status.bgClass)}>
                  {status.label}
                </Badge>
              </div>
              <DialogDescription className="mt-1">
                {integration.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Activity className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{integration.uptime}%</p>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <RefreshCw className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{integration.recordsProcessed.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Registros</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className={cn("text-2xl font-bold", integration.errorCount > 0 ? "text-destructive" : "text-success")}>
              {integration.errorCount}
            </p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold text-foreground">{integration.syncFrequency}</p>
            <p className="text-xs text-muted-foreground">Frequência</p>
          </div>
        </div>

        <Tabs defaultValue="config" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="mapping" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Mapeamento
            </TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Endpoint da API</Label>
                <Input 
                  value={integration.apiEndpoint || "Não configurado"} 
                  readOnly 
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Versão</Label>
                <Input 
                  value={integration.version} 
                  readOnly 
                  className="bg-muted/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Frequência de Sincronização</Label>
              <Select defaultValue="hourly">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Tempo real</SelectItem>
                  <SelectItem value="15min">A cada 15 minutos</SelectItem>
                  <SelectItem value="30min">A cada 30 minutos</SelectItem>
                  <SelectItem value="hourly">Horária</SelectItem>
                  <SelectItem value="daily">Diária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Opções de Sincronização</h4>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Sincronização automática</p>
                    <p className="text-sm text-muted-foreground">Executar sincronizações programadas</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Retry automático</p>
                    <p className="text-sm text-muted-foreground">Tentar novamente em caso de falha</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Validação de dados</p>
                    <p className="text-sm text-muted-foreground">Validar antes de processar</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Funcionalidades Habilitadas</h4>
              <div className="flex flex-wrap gap-2">
                {integration.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="px-3 py-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Histórico de Sincronizações</h4>
              <Button variant="outline" size="sm">Exportar Logs</Button>
            </div>

            <div className="space-y-3">
              {logs.length > 0 ? logs.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border"
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    log.status === "success" && "bg-success/10 text-success",
                    log.status === "warning" && "bg-warning/10 text-warning",
                    log.status === "error" && "bg-destructive/10 text-destructive"
                  )}>
                    {log.status === "success" && <CheckCircle className="h-4 w-4" />}
                    {log.status === "warning" && <AlertTriangle className="h-4 w-4" />}
                    {log.status === "error" && <XCircle className="h-4 w-4" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{log.message}</p>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{log.recordsProcessed.toLocaleString()} registros</span>
                      <span>{log.duration}s duração</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum log disponível</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Mapping Tab */}
          <TabsContent value="mapping" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Mapeamento de Campos</h4>
              <Button variant="outline" size="sm">Editar Mapeamento</Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Campo Origem</th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">→</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Campo BenefitOS</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { source: "MATRICULA", target: "employee_code", type: "string" },
                    { source: "NOME_COMPLETO", target: "full_name", type: "string" },
                    { source: "CPF", target: "tax_id", type: "cpf" },
                    { source: "DATA_ADMISSAO", target: "hire_date", type: "date" },
                    { source: "CENTRO_CUSTO", target: "cost_center", type: "string" },
                    { source: "CARGO", target: "position", type: "string" },
                  ].map((mapping, index) => (
                    <tr key={index} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3 font-mono text-sm text-foreground">{mapping.source}</td>
                      <td className="p-3 text-center text-muted-foreground">→</td>
                      <td className="p-3 font-mono text-sm text-accent">{mapping.target}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">{mapping.type}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="destructive" className="gap-2">
            Desconectar
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
            <Button className="btn-premium gap-2">
              <RefreshCw className="h-4 w-4" />
              Sincronizar Agora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IntegrationDetailDialog;
