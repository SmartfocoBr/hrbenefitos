import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Settings, TrendingUp } from "lucide-react";

export interface Benefit {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  category: "alimentacao" | "saude" | "transporte" | "bemestar" | "financeiro" | "outros";
  status: "active" | "inactive" | "pending";
  enrolledCount: number;
  eligibleCount: number;
  monthlyCost: number;
  provider?: string;
  color: string;
}

interface BenefitCardProps {
  benefit: Benefit;
  onManage: (benefit: Benefit) => void;
}

const categoryLabels = {
  alimentacao: "Alimentação",
  saude: "Saúde",
  transporte: "Transporte",
  bemestar: "Bem-estar",
  financeiro: "Financeiro",
  outros: "Outros",
};

const statusConfig = {
  active: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  inactive: { label: "Inativo", className: "bg-muted text-muted-foreground border-muted" },
  pending: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/20" },
};

const BenefitCard = ({ benefit, onManage }: BenefitCardProps) => {
  const Icon = benefit.icon;
  const status = statusConfig[benefit.status];
  const adhesionRate = benefit.eligibleCount > 0 
    ? Math.round((benefit.enrolledCount / benefit.eligibleCount) * 100) 
    : 0;

  return (
    <div className="stats-card group cursor-pointer" onClick={() => onManage(benefit)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="p-3 rounded-xl transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${benefit.color}15` }}
        >
          <Icon className="h-6 w-6" style={{ color: benefit.color }} />
        </div>
        <Badge variant="outline" className={cn("text-xs", status.className)}>
          {status.label}
        </Badge>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{benefit.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{benefit.description}</p>
        </div>

        {benefit.provider && (
          <p className="text-xs text-muted-foreground">
            Fornecedor: <span className="font-medium">{benefit.provider}</span>
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Users className="h-3 w-3" />
          </div>
          <p className="text-lg font-bold text-foreground">{benefit.enrolledCount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Inscritos</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <TrendingUp className="h-3 w-3" />
          </div>
          <p className="text-lg font-bold text-foreground">{adhesionRate}%</p>
          <p className="text-xs text-muted-foreground">Adesão</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">
            R${(benefit.monthlyCost / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-muted-foreground">Custo/mês</p>
        </div>
      </div>

      {/* Action */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full mt-4 text-accent hover:text-accent hover:bg-accent/10"
        onClick={(e) => {
          e.stopPropagation();
          onManage(benefit);
        }}
      >
        <Settings className="h-4 w-4 mr-2" />
        Gerenciar
      </Button>
    </div>
  );
};

export default BenefitCard;
