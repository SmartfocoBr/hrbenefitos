import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardMetrics } from "@/hooks/useRealtimeDashboard";
import { 
  Building2, 
  Users, 
  Gift, 
  Wallet, 
  ArrowRightLeft, 
  DollarSign,
  TrendingUp,
  Target,
  PieChart,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RealtimeMetricsGridProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `R$${(value / 1000).toFixed(1)}K`;
  }
  return `R$${value.toFixed(0)}`;
};

export function RealtimeMetricsGrid({ metrics, isLoading }: RealtimeMetricsGridProps) {
  const metricCards = [
    {
      title: "Empresas Ativas",
      value: metrics.activeCompanies,
      total: metrics.totalCompanies,
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Colaboradores Ativos",
      value: metrics.activeEmployees,
      total: metrics.totalEmployees,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Benefícios Ativos",
      value: metrics.activeBenefits,
      total: metrics.totalBenefits,
      icon: Gift,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Transações Hoje",
      value: metrics.totalTransactionsToday,
      icon: ArrowRightLeft,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  const financialCards = [
    {
      title: "Orçamento Mensal",
      value: formatCurrency(metrics.monthlyBudget),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Gasto",
      value: formatCurrency(metrics.monthlySpent),
      icon: TrendingUp,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Custo/Colaborador",
      value: formatCurrency(metrics.averageCostPerEmployee),
      icon: PieChart,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Saldo Carteiras",
      value: formatCurrency(metrics.totalWalletBalance),
      icon: Wallet,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          const percentage = card.total ? (card.value / card.total) * 100 : 0;
          
          return (
            <Card
              key={card.title}
              className={cn(
                "p-4 card-elevated transition-all duration-300 hover:shadow-lg",
                isLoading && "animate-pulse"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg", card.bgColor)}>
                  <Icon className={cn("h-5 w-5", card.color)} />
                </div>
                {card.total && (
                  <span className="text-xs text-muted-foreground">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? "..." : card.value}
                  {card.total && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / {card.total}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                {card.total && (
                  <Progress value={percentage} className="h-1.5 mt-2" />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialCards.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <Card
              key={card.title}
              className={cn(
                "p-4 card-elevated transition-all duration-300 hover:shadow-lg",
                isLoading && "animate-pulse"
              )}
              style={{ animationDelay: `${(index + 4) * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", card.bgColor)}>
                  <Icon className={cn("h-5 w-5", card.color)} />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {isLoading ? "..." : card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Utilization Rate */}
      <Card className="p-6 card-elevated">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Taxa de Utilização do Orçamento</h3>
              <p className="text-sm text-muted-foreground">Percentual do orçamento mensal utilizado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold text-foreground">
              {isLoading ? "..." : `${metrics.utilizationRate.toFixed(1)}%`}
            </span>
          </div>
        </div>
        <Progress 
          value={Math.min(metrics.utilizationRate, 100)} 
          className="h-3"
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </Card>
    </div>
  );
}
