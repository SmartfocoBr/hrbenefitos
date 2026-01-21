import { Company } from "@/types/company";
import { statusConfig, segmentConfig } from "@/lib/companiesData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  Users, 
  Gift,
  DollarSign,
  MapPin,
  TrendingUp,
  Database
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CompanyCardProps {
  company: Company;
  onView: (company: Company) => void;
}

const CompanyCard = ({ company, onView }: CompanyCardProps) => {
  const status = statusConfig[company.status];
  const segment = segmentConfig[company.segment] || { color: "#6b7280" };
  const budgetUsage = (company.monthlySpent / company.monthlyBudget) * 100;

  return (
    <div 
      className="stats-card group cursor-pointer"
      onClick={() => onView(company)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
            style={{ backgroundColor: `${segment.color}15`, color: segment.color }}
          >
            {company.tradeName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">{company.tradeName}</h3>
            <p className="text-sm text-muted-foreground">{company.segment}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs", status.bgClass)}>
          {status.label}
        </Badge>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{company.city} - {company.state}</span>
        </div>
        {company.erpIntegration && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Database className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{company.erpIntegration}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-border">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Users className="h-3 w-3" />
          </div>
          <p className="text-lg font-bold text-foreground">{company.employeeCount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Colaboradores</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Building2 className="h-3 w-3" />
          </div>
          <p className="text-lg font-bold text-foreground">{company.costCenterCount}</p>
          <p className="text-xs text-muted-foreground">C. Custo</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Gift className="h-3 w-3" />
          </div>
          <p className="text-lg font-bold text-foreground">{company.activeBenefits}</p>
          <p className="text-xs text-muted-foreground">Benefícios</p>
        </div>
      </div>

      {/* Budget Usage */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Orçamento utilizado</span>
          <span className={cn(
            "font-medium",
            budgetUsage > 95 ? "text-destructive" : budgetUsage > 85 ? "text-warning" : "text-success"
          )}>
            {budgetUsage.toFixed(0)}%
          </span>
        </div>
        <Progress 
          value={budgetUsage} 
          className={cn(
            "h-2",
            budgetUsage > 95 ? "[&>div]:bg-destructive" : budgetUsage > 85 ? "[&>div]:bg-warning" : ""
          )} 
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>R${(company.monthlySpent / 1000).toFixed(0)}K gasto</span>
          <span>R${(company.monthlyBudget / 1000).toFixed(0)}K total</span>
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;
