import { Card } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Target, CheckCircle, PieChart } from "lucide-react";
import { ReportSummary } from "@/types/report";
import { formatCurrency } from "@/lib/reportsData";

interface ReportSummaryCardsProps {
  data: ReportSummary;
}

const ReportSummaryCards = ({ data }: ReportSummaryCardsProps) => {
  const cards = [
    {
      title: "Orçamento Total",
      value: formatCurrency(data.totalBudget),
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Gasto",
      value: formatCurrency(data.totalSpent),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Colaboradores",
      value: data.totalEmployees.toLocaleString("pt-BR"),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Custo Médio",
      value: formatCurrency(data.averagePerEmployee),
      icon: PieChart,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Taxa de Utilização",
      value: `${data.utilizationRate.toFixed(1)}%`,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Conformidade",
      value: `${data.complianceRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-cyan-600",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="p-4 card-elevated">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <p className="text-lg font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ReportSummaryCards;
