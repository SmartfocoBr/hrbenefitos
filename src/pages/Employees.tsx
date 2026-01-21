import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import EmployeeCard from "@/components/employees/EmployeeCard";
import EmployeeDetailDialog from "@/components/employees/EmployeeDetailDialog";
import { Employee } from "@/types/employee";
import { employeesData, statusConfig, contractConfig } from "@/lib/employeesData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Grid3X3,
  List,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/dashboard/StatsCard";

type StatusFilter = "all" | keyof typeof statusConfig;
type ContractFilter = "all" | keyof typeof contractConfig;

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [contractFilter, setContractFilter] = useState<ContractFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    return employeesData.filter((employee) => {
      const matchesSearch = 
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
      const matchesContract = contractFilter === "all" || employee.contractType === contractFilter;
      
      return matchesSearch && matchesStatus && matchesContract;
    });
  }, [searchQuery, statusFilter, contractFilter]);

  const stats = useMemo(() => {
    const active = employeesData.filter(e => e.status === "active").length;
    const total = employeesData.length;
    const totalBenefits = employeesData.reduce((sum, e) => sum + e.activeBenefits, 0);
    const totalCost = employeesData.reduce((sum, e) => sum + e.totalBenefitsCost, 0);
    const totalDependents = employeesData.reduce((sum, e) => sum + e.dependentsCount, 0);
    
    return {
      total,
      active,
      totalBenefits,
      totalCost,
      totalDependents,
      avgBenefitsPerEmployee: (totalBenefits / total).toFixed(1),
    };
  }, []);

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Colaboradores</h1>
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
              value={stats.total.toString()}
              change="+12"
              changeType="positive"
              icon={Users}
              description="este mês"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-100">
            <StatsCard 
              title="Ativos" 
              value={stats.active.toString()}
              change={`${Math.round((stats.active / stats.total) * 100)}%`}
              changeType="positive"
              icon={UserCheck}
              description="do total"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <StatsCard 
              title="Benefícios Distribuídos" 
              value={stats.totalBenefits.toString()}
              change={`~${stats.avgBenefitsPerEmployee}/pessoa`}
              changeType="neutral"
              icon={Gift}
              description="média"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300">
            <StatsCard 
              title="Custo Total Benefícios" 
              value={`R$${(stats.totalCost / 1000).toFixed(0)}K`}
              change="-2.1%"
              changeType="positive"
              icon={DollarSign}
              description="vs. mês anterior"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up animation-delay-200">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, departamento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/50"
            />
          </div>

          {/* Status Filter */}
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

          {/* Contract Filter */}
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

          {/* View Mode */}
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

        {/* Employees Grid */}
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
              <EmployeeCard employee={employee} onView={handleViewEmployee} />
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum colaborador encontrado</h3>
            <p className="text-muted-foreground mt-1">
              Tente ajustar os filtros ou termos de busca
            </p>
          </div>
        )}

        {/* Employee Detail Dialog */}
        <EmployeeDetailDialog
          employee={selectedEmployee}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Employees;
