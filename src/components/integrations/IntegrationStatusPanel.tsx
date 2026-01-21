import { integrationsData, statusConfig, syncLogsData } from "@/lib/integrationsData";
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const IntegrationStatusPanel = () => {
  const onlineCount = integrationsData.filter(i => i.status === "online").length;
  const offlineCount = integrationsData.filter(i => i.status === "offline").length;
  const degradedCount = integrationsData.filter(i => i.status === "degraded").length;
  const totalUptime = integrationsData.reduce((sum, i) => sum + i.uptime, 0) / integrationsData.length;

  const recentLogs = syncLogsData.slice(0, 5);

  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Status em Tempo Real</h3>
      
      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
          <CheckCircle className="h-5 w-5 text-success" />
          <div>
            <p className="text-lg font-bold text-foreground">{onlineCount}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <p className="text-lg font-bold text-foreground">{degradedCount}</p>
            <p className="text-xs text-muted-foreground">Degradado</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
          <XCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-lg font-bold text-foreground">{offlineCount}</p>
            <p className="text-xs text-muted-foreground">Offline</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-lg font-bold text-foreground">{totalUptime.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <h4 className="font-medium text-foreground mb-3">Atividade Recente</h4>
      <div className="space-y-2">
        {recentLogs.map((log) => {
          const integration = integrationsData.find(i => i.id === log.integrationId);
          
          return (
            <div 
              key={log.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                log.status === "success" && "bg-success",
                log.status === "warning" && "bg-warning",
                log.status === "error" && "bg-destructive"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  <span className="font-medium">{integration?.shortName}</span>
                  {" - "}
                  {log.message}
                </p>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {format(new Date(log.timestamp), "HH:mm", { locale: ptBR })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IntegrationStatusPanel;
