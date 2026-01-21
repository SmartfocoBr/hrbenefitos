import DashboardLayout from "@/components/DashboardLayout";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { RealtimeIndicator } from "@/components/dashboard/RealtimeIndicator";
import { RealtimeMetricsGrid } from "@/components/dashboard/RealtimeMetricsGrid";
import { RealtimeActivityFeed } from "@/components/dashboard/RealtimeActivityFeed";
import AnimatedRealtimeBenefitsChart from "@/components/dashboard/AnimatedRealtimeBenefitsChart";
import AnimatedRealtimePieChart from "@/components/dashboard/AnimatedRealtimePieChart";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Dashboard = () => {
  const { metrics, activities, isLoading, error, isConnected, refetch } = useRealtimeDashboard();

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-5xl font-bold text-foreground">Dashboard Executivo</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Visão geral da gestão de benefícios corporativos em tempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RealtimeIndicator isConnected={isConnected} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Realtime Metrics Grid */}
        <div className="animate-fade-in-up">
          <RealtimeMetricsGrid metrics={metrics} isLoading={isLoading} />
        </div>

        {/* Animated Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up animation-delay-200">
          <AnimatedRealtimeBenefitsChart />
          <AnimatedRealtimePieChart />
        </div>

        {/* Activity Feed */}
        <div className="animate-fade-in-up animation-delay-300">
          <RealtimeActivityFeed activities={activities} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
