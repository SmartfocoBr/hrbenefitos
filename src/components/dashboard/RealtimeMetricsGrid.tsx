import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardMetrics } from "@/hooks/useRealtimeDashboard";
import { motion } from "framer-motion";
import { SkeletonCard, SkeletonMetric } from "@/components/ui/skeleton";
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  }),
};

const hoverVariants = {
  hover: { 
    scale: 1.03, 
    y: -4,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 }
  },
  tap: { 
    scale: 0.98,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 }
  }
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

  // Show skeleton loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={`skeleton-card-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <SkeletonCard />
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={`skeleton-metric-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 4) * 0.1 }}
            >
              <SkeletonMetric />
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <SkeletonCard className="h-32" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          const percentage = card.total ? (card.value / card.total) * 100 : 0;
          
          return (
            <motion.div
              key={card.title}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <motion.div variants={hoverVariants}>
                <Card className="p-4 card-elevated transition-shadow duration-300 hover:shadow-lg hover:shadow-accent/10 cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <motion.div 
                      className={cn("p-2 rounded-lg", card.bgColor)}
                      whileHover={{ rotate: 12, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Icon className={cn("h-5 w-5", card.color)} />
                    </motion.div>
                    {card.total && (
                      <span className="text-xs text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">
                      {card.value}
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
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialCards.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <motion.div
              key={card.title}
              custom={index + 4}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <motion.div variants={hoverVariants}>
                <Card className="p-4 card-elevated transition-shadow duration-300 hover:shadow-lg hover:shadow-accent/10 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={cn("p-2 rounded-lg", card.bgColor)}
                      whileHover={{ rotate: 12, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Icon className={cn("h-5 w-5", card.color)} />
                    </motion.div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {card.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{card.title}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Utilization Rate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 24 }}
      >
        <Card className="p-6 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2 rounded-lg bg-primary/10"
                whileHover={{ rotate: 12, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Target className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-foreground">Taxa de Utilização do Orçamento</h3>
                <p className="text-sm text-muted-foreground">Percentual do orçamento mensal utilizado</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <motion.span 
                className="text-2xl font-bold text-foreground"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {`${metrics.utilizationRate.toFixed(1)}%`}
              </motion.span>
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
      </motion.div>
    </div>
  );
}
