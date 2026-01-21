import { Employee } from "@/types/employee";
import { statusConfig, contractConfig } from "@/lib/employeesData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  User, 
  Mail, 
  MapPin, 
  Building2, 
  Gift,
  Users,
  DollarSign,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmployeeCardProps {
  employee: Employee;
  onView: (employee: Employee) => void;
}

const EmployeeCard = ({ employee, onView }: EmployeeCardProps) => {
  const status = statusConfig[employee.status];
  const contract = contractConfig[employee.contractType];

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <div 
      className="stats-card group cursor-pointer"
      onClick={() => onView(employee)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-lg">
            {getInitials(employee.name)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">{employee.name}</h3>
            <p className="text-sm text-muted-foreground">{employee.position}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-xs", status.bgClass)}>
          {status.label}
        </Badge>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{employee.department}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{employee.email}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{employee.location}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Gift className="h-3 w-3" />
          </div>
          <p className="text-lg font-bold text-foreground">{employee.activeBenefits}</p>
          <p className="text-xs text-muted-foreground">Benefícios</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Users className="h-3 w-3" />
          </div>
          <p className="text-lg font-bold text-foreground">{employee.dependentsCount}</p>
          <p className="text-xs text-muted-foreground">Dependentes</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <DollarSign className="h-3 w-3" />
          </div>
          <p className="text-lg font-bold text-foreground">
            R${(employee.totalBenefitsCost / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-muted-foreground">Custo/mês</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <Badge variant="secondary" className="text-xs" style={{ borderColor: contract.color }}>
          {contract.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Desde {format(new Date(employee.hireDate), "MMM yyyy", { locale: ptBR })}
        </span>
      </div>
    </div>
  );
};

export default EmployeeCard;
