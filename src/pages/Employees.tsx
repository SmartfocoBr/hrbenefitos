import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees, Employee } from "@/hooks/useEmployees";
import { RealtimeIndicator } from "@/components/dashboard/RealtimeIndicator";
import { 
  Search, 
  Plus, 
  Download,
  Upload,
  Users,
  Gift,
  DollarSign,
  UserCheck,
  Filter,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/dashboard/StatsCard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type StatusFilter = "all" | "active" | "inactive" | "on_leave" | "terminated";
type ContractFilter = "all" | "clt" | "pj" | "intern" | "temp";

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  inactive: { label: "Inativo", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
  on_leave: { label: "Afastado", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  terminated: { label: "Desligado", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

const contractConfig: Record<string, { label: string; color: string }> = {
  clt: { label: "CLT", color: "bg-blue-500/10 text-blue-600" },
  pj: { label: "PJ", color: "bg-purple-500/10 text-purple-600" },
  intern: { label: "Estágio", color: "bg-cyan-500/10 text-cyan-600" },
  temp: { label: "Temp", color: "bg-orange-500/10 text-orange-600" },
};

const Employees = () => {
  const { employees, stats, isLoading, error } = useEmployees();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [contractFilter, setContractFilter] = useState<ContractFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (employee.department?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (employee.position?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
      const matchesContract = contractFilter === "all" || employee.contract_type === contractFilter;
      
      return matchesSearch && matchesStatus && matchesContract;
    });
  }, [employees, searchQuery, statusFilter, contractFilter]);

  const EmployeeCard = ({ employee }: { employee: Employee }) => {
    const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
    const statusCfg = statusConfig[employee.status];
    const contractCfg = contractConfig[employee.contract_type];

    return (
      <Card className="p-5 card-elevated hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border-2 border-border group-hover:border-primary transition-colors">
            <AvatarImage src={employee.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {employee.first_name} {employee.last_name}
              </h3>
              <Badge variant="outline" className={cn("text-xs shrink-0", statusCfg?.color)}>
                {statusCfg?.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {employee.position || "Cargo não definido"}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          {employee.department && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{employee.department}</span>
            </div>
          )}
          {employee.hire_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Desde {format(new Date(employee.hire_date), "MMM yyyy", { locale: ptBR })}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <Badge className={cn("text-xs", contractCfg?.color)}>
            {contractCfg?.label}
          </Badge>
          {employee.salary && (
            <span className="text-sm font-medium text-foreground">
              R$ {Number(employee.salary).toLocaleString("pt-BR")}
            </span>
          )}
        </div>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">Colaboradores</h1>
              <RealtimeIndicator isConnected={!isLoading} />
            </div>
            <p className="text-muted-foreground mt-1">
              {stats.total} colaboradores • {stats.active} ativos
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button className="btn-premium gap-2">
              <Plus className="h-4 w-4" />
              Novo Colaborador
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="animate-fade-in-up">
            <StatsCard 
              title="Total Colaboradores" 
              value={isLoading ? "..." : stats.total.toString()}
              change={`${stats.clt} CLT`}
              changeType="positive"
              icon={Users}
              description="cadastrados"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-100">
            <StatsCard 
              title="Ativos" 
              value={isLoading ? "..." : stats.active.toString()}
              change={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%"}
              changeType="positive"
              icon={UserCheck}
              description="do total"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <StatsCard 
              title="Dependentes" 
              value={isLoading ? "..." : stats.totalDependents.toString()}
              change="ativos"
              changeType="neutral"
              icon={Gift}
              description="cadastrados"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300">
            <StatsCard 
              title="Folha Total" 
              value={isLoading ? "..." : `R$${(stats.totalSalary / 1000).toFixed(0)}K`}
              change="mensal"
              changeType="neutral"
              icon={DollarSign}
              description="salários"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up animation-delay-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, departamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/50"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-colors px-3 py-1.5",
                statusFilter === "all" 
                  ? "bg-accent text-accent-foreground border-accent" 
                  : "hover:bg-muted"
              )}
              onClick={() => setStatusFilter("all")}
            >
              Todos
            </Badge>
            {Object.entries(statusConfig).map(([key, config]) => (
              <Badge
                key={key}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors px-3 py-1.5",
                  statusFilter === key 
                    ? "bg-accent text-accent-foreground border-accent" 
                    : "hover:bg-muted"
                )}
                onClick={() => setStatusFilter(key as StatusFilter)}
              >
                {config.label}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            {Object.entries(contractConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={contractFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setContractFilter(contractFilter === key ? "all" : key as ContractFilter)}
              >
                {config.label}
              </Button>
            ))}
          </div>

          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              )}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              className={cn(
                "p-2 transition-colors",
                viewMode === "list" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Employees Grid */}
        {!isLoading && (
          <div className={cn(
            "animate-fade-in-up animation-delay-300",
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
          )}>
            {filteredEmployees.map((employee, index) => (
              <div 
                key={employee.id} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <EmployeeCard employee={employee} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredEmployees.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum colaborador encontrado</h3>
            <p className="text-muted-foreground mt-1">
              {employees.length === 0 
                ? "Adicione colaboradores para começar" 
                : "Tente ajustar os filtros ou termos de busca"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Employees;
