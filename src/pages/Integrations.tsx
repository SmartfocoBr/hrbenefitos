import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import IntegrationCard from "@/components/integrations/IntegrationCard";
import IntegrationDetailDialog from "@/components/integrations/IntegrationDetailDialog";
import IntegrationStatusPanel from "@/components/integrations/IntegrationStatusPanel";
import { Integration } from "@/types/integration";
import { integrationsData, typeConfig, statusConfig } from "@/lib/integrationsData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  RefreshCw,
  Database,
  Link2,
  Activity,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/dashboard/StatsCard";

type TypeFilter = "all" | keyof typeof typeConfig;
type StatusFilter = "all" | keyof typeof statusConfig;

const Integrations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredIntegrations = useMemo(() => {
    return integrationsData.filter((integration) => {
      const matchesSearch = 
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.shortName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === "all" || integration.type === typeFilter;
      const matchesStatus = statusFilter === "all" || integration.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const online = integrationsData.filter(i => i.status === "online").length;
    const total = integrationsData.length;
    const avgUptime = integrationsData.reduce((sum, i) => sum + i.uptime, 0) / total;
    const totalRecords = integrationsData.reduce((sum, i) => sum + i.recordsProcessed, 0);
    
    return {
      total,
      online,
      avgUptime: avgUptime.toFixed(1),
      totalRecords,
    };
  }, []);

  const handleManage = (integration: Integration) => {
    setSelectedIntegration(integration);
    setDialogOpen(true);
  };

  const handleSync = (integration: Integration) => {
    toast({
      title: "Sincronização iniciada",
      description: `${integration.name} está sendo sincronizado...`,
    });
  };

  const handleSyncAll = () => {
    const onlineIntegrations = integrationsData.filter(i => i.status === "online");
    toast({
      title: "Sincronização em massa iniciada",
      description: `${onlineIntegrations.length} integrações estão sendo sincronizadas...`,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Integration Hub</h1>
            <p className="text-muted-foreground mt-1">
              {stats.total} integrações configuradas • {stats.online} online
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" onClick={handleSyncAll}>
              <RefreshCw className="h-4 w-4" />
              Sincronizar Tudo
            </Button>
            <Button className="btn-premium gap-2">
              <Plus className="h-4 w-4" />
              Nova Integração
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="animate-fade-in-up">
            <StatsCard 
              title="Total Integrações" 
              value={stats.total.toString()}
              icon={Link2}
              description="conectadas"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-100">
            <StatsCard 
              title="Online" 
              value={stats.online.toString()}
              change={`${Math.round((stats.online / stats.total) * 100)}%`}
              changeType="positive"
              icon={CheckCircle}
              description="disponíveis"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-200">
            <StatsCard 
              title="Uptime Médio" 
              value={`${stats.avgUptime}%`}
              change="+0.2%"
              changeType="positive"
              icon={Activity}
              description="últimos 30 dias"
            />
          </div>
          <div className="animate-fade-in-up animation-delay-300">
            <StatsCard 
              title="Registros Processados" 
              value={`${(stats.totalRecords / 1000).toFixed(0)}K`}
              change="+12%"
              changeType="positive"
              icon={Database}
              description="este mês"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters and Cards */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 animate-fade-in-up animation-delay-200">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar integração..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-muted/50"
                />
              </div>

              {/* Type Filter */}
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-colors px-3 py-1.5",
                    typeFilter === "all" 
                      ? "bg-accent text-accent-foreground border-accent" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => setTypeFilter("all")}
                >
                  Todas
                </Badge>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-colors px-3 py-1.5",
                      typeFilter === key 
                        ? "bg-accent text-accent-foreground border-accent" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => setTypeFilter(key as TypeFilter)}
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
                  variant={statusFilter === "online" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("online")}
                >
                  Online
                </Button>
                <Button
                  variant={statusFilter === "offline" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("offline")}
                >
                  Offline
                </Button>
              </div>
            </div>

            {/* Integration Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up animation-delay-300">
              {filteredIntegrations.map((integration, index) => (
                <div 
                  key={integration.id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <IntegrationCard 
                    integration={integration} 
                    onManage={handleManage}
                    onSync={handleSync}
                  />
                </div>
              ))}
            </div>

            {filteredIntegrations.length === 0 && (
              <div className="text-center py-16">
                <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Nenhuma integração encontrada</h3>
                <p className="text-muted-foreground mt-1">
                  Tente ajustar os filtros ou termos de busca
                </p>
              </div>
            )}
          </div>

          {/* Status Panel */}
          <div className="animate-fade-in-up animation-delay-400">
            <IntegrationStatusPanel />
          </div>
        </div>

        {/* Detail Dialog */}
        <IntegrationDetailDialog
          integration={selectedIntegration}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Integrations;
