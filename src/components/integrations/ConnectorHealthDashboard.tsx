import { useConnectorHealth } from "@/hooks/useConnectorHealth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, AlertTriangle, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  healthy: { icon: CheckCircle, color: "text-green-500", label: "Saudável" },
  success: { icon: CheckCircle, color: "text-green-500", label: "Sucesso" },
  degraded: { icon: AlertTriangle, color: "text-yellow-500", label: "Degradado" },
  unhealthy: { icon: XCircle, color: "text-destructive", label: "Indisponível" },
  failed: { icon: XCircle, color: "text-destructive", label: "Falhou" },
  unknown: { icon: HelpCircle, color: "text-muted-foreground", label: "Desconhecido" },
};

const LatencySparkline = ({ history }: { history: Array<{ latency_ms?: number }> }) => {
  const points = history.slice(0, 30).reverse();
  if (points.length < 2) return null;

  const values = points.map((p) => p.latency_ms ?? 0);
  const max = Math.max(...values, 1);
  const h = 40;
  const w = 200;
  const step = w / (values.length - 1);

  const path = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / max) * h}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
    </svg>
  );
};

const ConnectorHealthDashboard = () => {
  const { data: healthRecords, isLoading } = useConnectorHealth();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-48" />
          </Card>
        ))}
      </div>
    );
  }

  if (!healthRecords?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum registro de saúde encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {healthRecords.map((health) => {
        const st = statusMap[health.status ?? "unknown"] ?? statusMap.unknown;
        const Icon = st.icon;
        const history = Array.isArray(health.history) ? (health.history as Array<{ latency_ms?: number; status?: string; error?: string; ts?: string }>) : [];

        return (
          <Card key={health.id} className="relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 right-0 h-1", health.status === "healthy" || health.status === "success" ? "bg-green-500" : health.status === "degraded" ? "bg-yellow-500" : health.status === "unhealthy" || health.status === "failed" ? "bg-destructive" : "bg-muted")} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {(health.connectors as any)?.name ?? "Conector"}
                </CardTitle>
                <Badge variant="outline" className="gap-1">
                  <Icon className={cn("h-3 w-3", st.color)} />
                  {st.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {(health.connectors as any)?.connector_type ?? ""}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Latência
                </span>
                <span className="font-mono font-medium">
                  {health.latency_ms != null ? `${health.latency_ms}ms` : "—"}
                </span>
              </div>

              <LatencySparkline history={history} />

              {health.last_error && (
                <p className="text-xs text-destructive truncate" title={health.last_error}>
                  ⚠ {health.last_error}
                </p>
              )}

              {health.last_check && (
                <p className="text-xs text-muted-foreground">
                  Último check: {new Date(health.last_check).toLocaleString("pt-BR")}
                </p>
              )}

              {/* Recent history */}
              {history.length > 0 && (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {history.slice(0, 5).map((entry, i) => {
                    const est = statusMap[entry.status ?? "unknown"] ?? statusMap.unknown;
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className={est.color}>{est.label}</span>
                        <span className="text-muted-foreground font-mono">
                          {entry.latency_ms != null ? `${entry.latency_ms}ms` : "—"}
                        </span>
                        <span className="text-muted-foreground">
                          {entry.ts ? new Date(entry.ts).toLocaleTimeString("pt-BR") : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ConnectorHealthDashboard;
