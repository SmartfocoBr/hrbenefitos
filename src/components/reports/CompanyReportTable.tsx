import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2 } from "lucide-react";
import { CompanyReport } from "@/types/report";
import { formatCurrency } from "@/lib/reportsData";

interface CompanyReportTableProps {
  data: CompanyReport[];
}

const CompanyReportTable = ({ data }: CompanyReportTableProps) => {
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "text-green-600";
    if (utilization >= 70) return "text-amber-600";
    return "text-red-600";
  };

  const getProgressColor = (utilization: number) => {
    if (utilization >= 90) return "bg-green-500";
    if (utilization >= 70) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="card-elevated p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Performance por Empresa</h3>
        <p className="text-sm text-muted-foreground">Utilização de orçamento e benefícios mais populares</p>
      </div>
      
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Empresa</TableHead>
              <TableHead className="font-semibold text-center">Colaboradores</TableHead>
              <TableHead className="font-semibold text-right">Orçamento</TableHead>
              <TableHead className="font-semibold text-right">Gasto</TableHead>
              <TableHead className="font-semibold text-center">Utilização</TableHead>
              <TableHead className="font-semibold">Top Benefícios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((company) => (
              <TableRow key={company.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{company.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {company.employees.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(company.budget)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(company.spent)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full max-w-[100px]">
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${getProgressColor(company.utilization)}`}
                          style={{ width: `${company.utilization}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${getUtilizationColor(company.utilization)}`}>
                      {company.utilization.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {company.topBenefits.slice(0, 2).map((benefit, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                    {company.topBenefits.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{company.topBenefits.length - 2}
                      </Badge>
                    )}
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

export default CompanyReportTable;
