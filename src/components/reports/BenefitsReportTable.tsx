import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BenefitReport } from "@/types/report";
import { formatCurrency } from "@/lib/reportsData";

interface BenefitsReportTableProps {
  data: BenefitReport[];
}

const BenefitsReportTable = ({ data }: BenefitsReportTableProps) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Alimentação": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
      "Saúde": "bg-blue-500/10 text-blue-600 border-blue-500/20",
      "Transporte": "bg-green-500/10 text-green-600 border-green-500/20",
      "Bem-estar": "bg-amber-500/10 text-amber-600 border-amber-500/20",
      "Outros": "bg-purple-500/10 text-purple-600 border-purple-500/20",
    };
    return colors[category] || "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string, value: number) => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <div className="card-elevated p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Análise Detalhada de Benefícios</h3>
        <p className="text-sm text-muted-foreground">Performance e tendência de cada benefício</p>
      </div>
      
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Benefício</TableHead>
              <TableHead className="font-semibold">Categoria</TableHead>
              <TableHead className="font-semibold text-center">Inscritos</TableHead>
              <TableHead className="font-semibold text-center">Adesão</TableHead>
              <TableHead className="font-semibold text-right">Custo Mensal</TableHead>
              <TableHead className="font-semibold text-center">Tendência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((benefit) => (
              <TableRow key={benefit.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{benefit.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getCategoryColor(benefit.category)}>
                    {benefit.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{benefit.enrolled.toLocaleString("pt-BR")}</span>
                  <span className="text-muted-foreground text-sm"> / {benefit.eligible.toLocaleString("pt-BR")}</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${benefit.adhesionRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{benefit.adhesionRate.toFixed(1)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(benefit.monthlyCost)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getTrendIcon(benefit.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(benefit.trend, benefit.trendValue)}`}>
                      {benefit.trendValue > 0 ? "+" : ""}{benefit.trendValue.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BenefitsReportTable;
