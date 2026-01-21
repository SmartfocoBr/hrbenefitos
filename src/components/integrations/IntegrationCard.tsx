import { Integration, IntegrationStatus } from "@/types/integration";
import { statusConfig } from "@/lib/integrationsData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  RefreshCw, 
  Settings, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IntegrationCardProps {
  integration: Integration;
  onManage: (integration: Integration) => void;
  onSync: (integration: Integration) => void;
}

const StatusIcon = ({ status }: { status: IntegrationStatus }) => {
  switch (status) {
    case "online":
      return <CheckCircle className="h-4 w-4" />;
    case "offline":
      return <XCircle className="h-4 w-4" />;
    case "degraded":
      return <AlertTriangle className="h-4 w-4" />;
    case "syncing":
      return <Loader2 className="h-4 w-4 animate-spin" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const IntegrationCard = ({ integration, onManage, onSync }: IntegrationCardProps) => {
  const Icon = integration.icon;
  const status = statusConfig[integration.status];

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return "Nunca sincronizado";
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
  };

  return (
    <div className="stats-card group">
      {/* Status indicator bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: status.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pt-2">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-xl transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${integration.color}15` }}
          >
            <Icon className="h-6 w-6" style={{ color: integration.color }} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{integration.name}</h3>
            <p className="text-xs text-muted-foreground">{integration.version}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs flex items-center gap-1", status.bgClass)}>
          <StatusIcon status={integration.status} />
          {status.label}
        </Badge>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {integration.description}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-border">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            {integration.recordsProcessed.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Registros</p>
        </div>
        <div className="text-center">
          <p className={cn(
            "text-lg font-bold",
            integration.errorCount > 0 ? "text-destructive" : "text-success"
          )}>
            {integration.errorCount}
          </p>
          <p className="text-xs text-muted-foreground">Erros</p>
        </div>
        <div className="text-center">
          <p className={cn(
            "text-lg font-bold",
            integration.uptime >= 99.5 ? "text-success" : 
            integration.uptime >= 98 ? "text-warning" : "text-destructive"
          )}>
            {integration.uptime}%
          </p>
          <p className="text-xs text-muted-foreground">Uptime</p>
        </div>
      </div>

      {/* Sync Info */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Última sync:
          </span>
          <span className="font-medium text-foreground">
            {formatLastSync(integration.lastSync)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Frequência:
          </span>
          <span className="font-medium text-foreground">{integration.syncFrequency}</span>
        </div>
      </div>

      {/* Features Tags */}
      <div className="mt-4 flex flex-wrap gap-1">
        {integration.features.slice(0, 3).map((feature) => (
          <span 
            key={feature}
            className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
          >
            {feature}
          </span>
        ))}
        {integration.features.length > 3 && (
          <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
            +{integration.features.length - 3}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1"
          onClick={() => onSync(integration)}
          disabled={integration.status === "syncing" || integration.status === "pending"}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", integration.status === "syncing" && "animate-spin")} />
          Sincronizar
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onManage(integration)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default IntegrationCard;
