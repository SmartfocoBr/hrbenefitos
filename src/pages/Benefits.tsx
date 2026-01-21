import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useBenefits, Benefit } from "@/hooks/useBenefits";
import { RealtimeIndicator } from "@/components/dashboard/RealtimeIndicator";
import { 
  Search, 
  Plus, 
  Download,
  DollarSign,
  Users,
  Gift,
  TrendingUp,
  Filter,
  Grid3X3,
  List,
  Heart,
  Utensils,
  Bus,
  Dumbbell,
  PiggyBank,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/dashboard/StatsCard";

type CategoryFilter = "all" | "alimentacao" | "saude" | "transporte" | "bemestar" | "financeiro" | "outros";
type StatusFilter = "all" | "active" | "inactive";

const iconMap: Record<string, React.ElementType> = {
  Heart: Heart,
  Utensils: Utensils,
  Bus: Bus,
  Dumbbell: Dumbbell,
  PiggyBank: PiggyBank,
};

const Benefits = () => {
  const { benefits, stats, categoryConfig, isLoading, error } = useBenefits();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredBenefits = useMemo(() => {
    return benefits.filter((benefit) => {
      const matchesSearch = 
        benefit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (benefit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      const matchesCategory = categoryFilter === "all" || benefit.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" ? benefit.is_active : !benefit.is_active);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [benefits, searchQuery, categoryFilter, statusFilter]);

  const BenefitCard = ({ benefit }: { benefit: Benefit }) => {
    const Icon = iconMap[benefit.icon || ""] || Gift;
    const catConfig = categoryConfig[benefit.category];

    return (
      <Card className="p-5 card-elevated hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="p-3 rounded-xl transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${catConfig?.color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color: catConfig?.color }} />
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              benefit.is_active 
                ? "bg-green-500/10 text-green-600 border-green-500/20" 
                : "bg-red-500/10 text-red-600 border-red-500/20"
            )}
          >
            {benefit.is_active ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> Ativo</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> Inativo</>
            )}
          </Badge>
        </div>

        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {benefit.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {benefit.description || "Sem descrição"}
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Categoria</span>
            <Badge variant="secondary" style={{ backgroundColor: `${catConfig?.color}15`, color: catConfig?.color }}>
              {catConfig?.label || benefit.category}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fornecedor</span>
            <span className="font-medium text-foreground">{benefit.provider || "N/A"}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tributável</span>
            <span className={cn("font-medium", benefit.is_taxable ? "text-amber-600" : "text-green-600")}>
              {benefit.is_taxable ? `Sim (${benefit.tax_percentage}%)` : "Não"}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground truncate" title={benefit.legal_basis || ""}>
            {benefit.legal_basis || "Base legal não especificada"}
          </p>
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
              <h1 className="text-3xl font-bold text-foreground">Gestão de Benefícios</h1>
              <RealtimeIndicator isConnected={!isLoading} />
            </div>
            <p className="text-muted-foreground mt-1">
              {stats.total} benefícios cadastrados • {stats.active} ativos
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
              title="Total Benefícios" 
              value={isLoading ? "..." : stats.total.toString()}
              change={`${stats.active} ativos`}
              changeType="positive"
              icon={Gift}
              description="cadastrados"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-100">
            <StatsCard 
              title="Alimentação" 
              value={isLoading ? "..." : stats.byCategory.alimentacao.toString()}
              change="PAT"
              changeType="neutral"
              icon={Utensils}
              description="benefícios"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <StatsCard 
              title="Saúde" 
              value={isLoading ? "..." : stats.byCategory.saude.toString()}
              change="ANS"
              changeType="neutral"
              icon={Heart}
              description="benefícios"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300">
            <StatsCard 
              title="Tributáveis" 
              value={isLoading ? "..." : stats.taxable.toString()}
              change={`${stats.nonTaxable} isentos`}
              changeType="neutral"
              icon={DollarSign}
              description="com IRPF"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up animation-delay-200">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar benefício por nome ou descrição..."
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

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        )}

        {/* Benefits Grid */}
        {!isLoading && (
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
                <BenefitCard benefit={benefit} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredBenefits.length === 0 && (
          <div className="text-center py-16">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Nenhum benefício encontrado</h3>
            <p className="text-muted-foreground mt-1">
              {benefits.length === 0 
                ? "Adicione benefícios para começar" 
                : "Tente ajustar os filtros ou termos de busca"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Benefits;
