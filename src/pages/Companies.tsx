import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import CompanyCard from "@/components/companies/CompanyCard";
import CompanyDetailDialog from "@/components/companies/CompanyDetailDialog";
import { Company } from "@/types/company";
import { companiesData, statusConfig, segmentConfig } from "@/lib/companiesData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Download,
  Building2,
  Users,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/dashboard/StatsCard";

type StatusFilter = "all" | keyof typeof statusConfig;

const Companies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredCompanies = useMemo(() => {
    return companiesData.filter((company) => {
      const matchesSearch = 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.cnpj.includes(searchQuery);
      
      const matchesStatus = statusFilter === "all" || company.status === statusFilter;
      const matchesSegment = segmentFilter === "all" || company.segment === segmentFilter;
      
      return matchesSearch && matchesStatus && matchesSegment;
    });
  }, [searchQuery, statusFilter, segmentFilter]);

  const stats = useMemo(() => {
    const active = companiesData.filter(c => c.status === "active").length;
    const totalEmployees = companiesData.reduce((sum, c) => sum + c.employeeCount, 0);
    const totalBudget = companiesData.reduce((sum, c) => sum + c.monthlyBudget, 0);
    const totalSpent = companiesData.reduce((sum, c) => sum + c.monthlySpent, 0);
    
    return {
      total: companiesData.length,
      active,
      totalEmployees,
      totalBudget,
      totalSpent,
      avgUtilization: ((totalSpent / totalBudget) * 100).toFixed(1),
    };
  }, []);

  const segments = useMemo(() => {
    return [...new Set(companiesData.map(c => c.segment))];
  }, []);

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Empresas</h1>
            <p className="text-muted-foreground mt-1">
              {stats.total} empresas cadastradas • {stats.active} ativas
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button className="btn-premium gap-2">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="animate-fade-in-up">
            <StatsCard 
              title="Total Empresas" 
              value={stats.total.toString()}
              change="+1"
              changeType="positive"
              icon={Building2}
              description="este mês"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-100">
            <StatsCard 
              title="Total Colaboradores" 
              value={stats.totalEmployees.toLocaleString()}
              change="+245"
              changeType="positive"
              icon={Users}
              description="todas empresas"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <StatsCard 
              title="Orçamento Total" 
              value={`R$${(stats.totalBudget / 1000000).toFixed(1)}M`}
              icon={DollarSign}
              description="mensal consolidado"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300">
            <StatsCard 
              title="Utilização Média" 
              value={`${stats.avgUtilization}%`}
              change="-1.2%"
              changeType="positive"
              icon={TrendingUp}
              description="do orçamento"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up animation-delay-200">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, razão social ou CNPJ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/50"
            />
          </div>

          {/* Segment Filter */}
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-colors px-3 py-1.5",
                segmentFilter === "all" 
                  ? "bg-accent text-accent-foreground border-accent" 
                  : "hover:bg-muted"
              )}
              onClick={() => setSegmentFilter("all")}
            >
              Todos
            </Badge>
            {segments.map((segment) => (
              <Badge
                key={segment}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors px-3 py-1.5",
                  segmentFilter === segment 
                    ? "bg-accent text-accent-foreground border-accent" 
                    : "hover:bg-muted"
                )}
                onClick={() => setSegmentFilter(segment)}
              >
                {segment}
              </Badge>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {Object.entries(statusConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(statusFilter === key ? "all" : key as StatusFilter)}
              >
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-300">
          {filteredCompanies.map((company, index) => (
            <div 
              key={company.id} 
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CompanyCard company={company} onView={handleViewCompany} />
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhuma empresa encontrada</h3>
            <p className="text-muted-foreground mt-1">
              Tente ajustar os filtros ou termos de busca
            </p>
          </div>
        )}

        {/* Company Detail Dialog */}
        <CompanyDetailDialog
          company={selectedCompany}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Companies;
