import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import BenefitCard, { Benefit } from "@/components/benefits/BenefitCard";
import BenefitDetailDialog from "@/components/benefits/BenefitDetailDialog";
import { benefitsData, categoryConfig } from "@/lib/benefitsData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus, 
  Grid3X3, 
  List, 
  Download,
  DollarSign,
  Users,
  Gift,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/dashboard/StatsCard";

type CategoryFilter = "all" | keyof typeof categoryConfig;
type StatusFilter = "all" | "active" | "inactive" | "pending";

const Benefits = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredBenefits = useMemo(() => {
    return benefitsData.filter((benefit) => {
      const matchesSearch = 
        benefit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        benefit.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        benefit.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || benefit.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || benefit.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const activeBenefits = benefitsData.filter(b => b.status === "active");
    const totalCost = activeBenefits.reduce((sum, b) => sum + b.monthlyCost, 0);
    const totalEnrolled = activeBenefits.reduce((sum, b) => sum + b.enrolledCount, 0);
    const avgAdhesion = activeBenefits.length > 0
      ? Math.round(activeBenefits.reduce((sum, b) => sum + (b.enrolledCount / b.eligibleCount * 100), 0) / activeBenefits.length)
      : 0;
    
    return {
      totalBenefits: benefitsData.length,
      activeBenefits: activeBenefits.length,
      totalCost,
      totalEnrolled,
      avgAdhesion,
    };
  }, []);

  const handleManageBenefit = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Benefícios</h1>
            <p className="text-muted-foreground mt-1">
              {stats.totalBenefits} benefícios configurados • {stats.activeBenefits} ativos
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button className="btn-premium gap-2">
              <Plus className="h-4 w-4" />
              Novo Benefício
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="animate-fade-in-up">
            <StatsCard 
              title="Custo Total Mensal" 
              value={`R$${(stats.totalCost / 1000000).toFixed(2)}M`}
              change="-2.4%"
              changeType="positive"
              icon={DollarSign}
              description="vs. mês anterior"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-100">
            <StatsCard 
              title="Total Inscritos" 
              value={stats.totalEnrolled.toLocaleString()}
              change="+127"
              changeType="positive"
              icon={Users}
              description="novas adesões"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <StatsCard 
              title="Benefícios Ativos" 
              value={stats.activeBenefits.toString()}
              change="+2"
              changeType="positive"
              icon={Gift}
              description="de 18 categorias"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300">
            <StatsCard 
              title="Adesão Média" 
              value={`${stats.avgAdhesion}%`}
              change="+3.2%"
              changeType="positive"
              icon={TrendingUp}
              description="engajamento"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up animation-delay-200">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar benefício por nome, sigla ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer transition-colors px-3 py-1.5",
                categoryFilter === "all" 
                  ? "bg-accent text-accent-foreground border-accent" 
                  : "hover:bg-muted"
              )}
              onClick={() => setCategoryFilter("all")}
            >
              Todas
            </Badge>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <Badge
                key={key}
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors px-3 py-1.5",
                  categoryFilter === key 
                    ? "bg-accent text-accent-foreground border-accent" 
                    : "hover:bg-muted"
                )}
                onClick={() => setCategoryFilter(key as CategoryFilter)}
              >
                {config.label}
              </Badge>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Ativos
            </Button>
            <Button
              variant={statusFilter === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("inactive")}
            >
              Inativos
            </Button>
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
              <Grid3X3 className="h-5 w-5" />
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

        {/* Benefits Grid */}
        <div className={cn(
          "animate-fade-in-up animation-delay-300",
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
        )}>
          {filteredBenefits.map((benefit, index) => (
            <div 
              key={benefit.id} 
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <BenefitCard benefit={benefit} onManage={handleManageBenefit} />
            </div>
          ))}
        </div>

        {filteredBenefits.length === 0 && (
          <div className="text-center py-16">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum benefício encontrado</h3>
            <p className="text-muted-foreground mt-1">
              Tente ajustar os filtros ou termos de busca
            </p>
          </div>
        )}

        {/* Benefit Detail Dialog */}
        <BenefitDetailDialog
          benefit={selectedBenefit}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Benefits;
