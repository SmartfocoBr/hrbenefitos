import DashboardLayout from "@/components/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import BenefitsBarChart from "@/components/dashboard/BenefitsBarChart";
import BenefitsPieChart from "@/components/dashboard/BenefitsPieChart";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { DollarSign, Gift, Users, Building2, TrendingUp, TrendingDown, Target, Clock } from "lucide-react";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Dashboard Executivo</h1>
          <p className="text-muted-foreground mt-1">Visão geral da gestão de benefícios corporativos</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="animate-fade-in-up"><StatsCard title="Gasto Total Mensal" value="R$2.76M" change="-3.2%" changeType="positive" icon={DollarSign} description="vs. mês anterior" /></div>
          <div className="animate-fade-in-up animation-delay-100"><StatsCard title="Benefícios Ativos" value="18" change="+2" changeType="positive" icon={Gift} description="novas categorias" /></div>
          <div className="animate-fade-in-up animation-delay-200"><StatsCard title="Colaboradores" value="4.832" change="+127" changeType="positive" icon={Users} description="este mês" /></div>
          <div className="animate-fade-in-up animation-delay-300"><StatsCard title="Empresas" value="12" change="+1" changeType="positive" icon={Building2} description="nova integração" /></div>
        </div>

        {/* Second Row KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="animate-fade-in-up animation-delay-100"><StatsCard title="Custo por Colaborador" value="R$571" change="-4.1%" changeType="positive" icon={TrendingDown} description="otimizado" /></div>
          <div className="animate-fade-in-up animation-delay-200"><StatsCard title="Taxa de Adesão" value="94.7%" change="+2.3%" changeType="positive" icon={Target} description="média geral" /></div>
          <div className="animate-fade-in-up animation-delay-300"><StatsCard title="Engajamento" value="87%" change="+5%" changeType="positive" icon={TrendingUp} description="colaboradores ativos" /></div>
          <div className="animate-fade-in-up animation-delay-400"><StatsCard title="SLA Integrações" value="99.8%" change="0%" changeType="neutral" icon={Clock} description="uptime mensal" /></div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-fade-in-up animation-delay-200"><BenefitsBarChart /></div>
          <div className="animate-fade-in-up animation-delay-300"><BenefitsPieChart /></div>
        </div>

        {/* Activity Feed */}
        <div className="animate-fade-in-up animation-delay-400"><ActivityFeed /></div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
