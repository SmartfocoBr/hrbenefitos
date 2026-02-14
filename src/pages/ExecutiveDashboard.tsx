import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  RefreshCw, Download, Users, Wallet, Gift, HeartPulse,
  FileSpreadsheet, BarChart3, TrendingUp, Loader2, AlertCircle,
  CheckCircle2, Clock, ExternalLink,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMetrics } from "@/hooks/useMetrics";
import { useGenerateReport } from "@/hooks/useGenerateReport";
import { useTenant } from "@/hooks/useTenant";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

const REPORT_TYPES = [
  { value: "employees", label: "Colaboradores", icon: Users },
  { value: "benefits_summary", label: "Benefícios", icon: Gift },
  { value: "wallet_transactions", label: "Transações", icon: Wallet },
];

const ExecutiveDashboard = () => {
  const { activeTenantId: currentTenantId } = useTenant();
  const { metrics, refreshedAt, isLoading, isRefreshing, error, refresh } = useMetrics(currentTenantId);
  const { isGenerating, lastReport, generate, getDownloadUrl } = useGenerateReport();
  const [selectedReport, setSelectedReport] = useState("employees");

  const kpiCards = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        title: "Colaboradores Ativos",
        value: metrics.total_employees?.value ?? 0,
        icon: Users,
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        title: "Saldo Total Carteiras",
        value: metrics.total_wallet_balance?.value ?? 0,
        icon: Wallet,
        color: "text-emerald-600",
        bgColor: "bg-emerald-500/10",
        format: "currency",
      },
      {
        title: "Benefícios Ativos",
        value: metrics.benefits_usage?.value ?? 0,
        icon: Gift,
        color: "text-violet-600",
        bgColor: "bg-violet-500/10",
        subtitle: `de ${(metrics.benefits_usage?.payload as Record<string, unknown>)?.total_count ?? 0} total`,
      },
      {
        title: "Instruções Pendentes",
        value: metrics.pending_instructions?.value ?? 0,
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-500/10",
      },
    ];
  }, [metrics]);

  const connectorChartData = useMemo(() => {
    if (!metrics?.connector_health_summary?.payload) return [];
    const p = metrics.connector_health_summary.payload as Record<string, number>;
    return [
      { name: "Saudável", value: p.healthy ?? 0 },
      { name: "Com Falha", value: p.unhealthy ?? 0 },
      { name: "Desconhecido", value: p.unknown ?? 0 },
    ].filter((d) => d.value > 0);
  }, [metrics]);

  const benefitsChartData = useMemo(() => {
    if (!metrics?.benefits_usage?.payload) return [];
    const p = metrics.benefits_usage.payload as Record<string, unknown>;
    return [
      { name: "Ativos", value: Number(p.enabled_count ?? 0) },
      { name: "Inativos", value: Number(p.total_count ?? 0) - Number(p.enabled_count ?? 0) },
    ].filter((d) => d.value > 0);
  }, [metrics]);

  const handleGenerateReport = async () => {
    if (!currentTenantId) return;
    const result = await generate(currentTenantId, selectedReport);
    if (result?.download_url) {
      window.open(result.download_url, "_blank");
    }
  };

  const handleDownloadLast = async () => {
    if (!lastReport?.report?.id) return;
    const url = await getDownloadUrl(lastReport.report.id);
    if (url) window.open(url, "_blank");
  };

  const formatValue = (value: number, format?: string) => {
    if (format === "currency") {
      return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    }
    return value.toLocaleString("pt-BR");
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Executivo</h1>
            <p className="text-muted-foreground mt-1">
              KPIs e métricas consolidadas
              {refreshedAt && (
                <span className="ml-2 text-xs">
                  • Atualizado: {new Date(refreshedAt).toLocaleString("pt-BR")}
                </span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar Métricas
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    {isLoading ? (
                      <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">
                        {formatValue(kpi.value, kpi.format)}
                      </p>
                    )}
                    {kpi.subtitle && (
                      <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${kpi.bgColor}`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="charts" className="gap-2 data-[state=active]:bg-background">
              <BarChart3 className="h-4 w-4" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger value="exports" className="gap-2 data-[state=active]:bg-background">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Relatórios
            </TabsTrigger>
          </TabsList>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Connector Health Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-primary" />
                    Saúde dos Conectores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-[250px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : connectorChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={connectorChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {connectorChartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Nenhum conector configurado
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Benefits Bar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5 text-violet-600" />
                    Benefícios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-[250px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : benefitsChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={benefitsChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {benefitsChartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Nenhum benefício configurado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Exports Tab */}
          <TabsContent value="exports" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gerar Relatório CSV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger className="w-full sm:w-[240px]">
                      <SelectValue placeholder="Tipo de relatório" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((rt) => (
                        <SelectItem key={rt.value} value={rt.value}>
                          <div className="flex items-center gap-2">
                            <rt.icon className="h-4 w-4" />
                            {rt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={handleGenerateReport} disabled={isGenerating || !currentTenantId} className="gap-2">
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isGenerating ? "Gerando..." : "Gerar e Baixar"}
                  </Button>
                </div>

                {lastReport && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lastReport.report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lastReport.report.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadLast} className="gap-1.5 shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Baixar
                    </Button>
                  </div>
                )}

                {!currentTenantId && (
                  <p className="text-sm text-muted-foreground">
                    Selecione uma empresa para gerar relatórios.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ExecutiveDashboard;
