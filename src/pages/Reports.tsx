import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, FileSpreadsheet, Calendar, BarChart3, TrendingUp, Building2, Gift } from "lucide-react";
import { toast } from "sonner";
import ReportSummaryCards from "@/components/reports/ReportSummaryCards";
import TrendChart from "@/components/reports/TrendChart";
import ExpenseAreaChart from "@/components/reports/ExpenseAreaChart";
import BenefitsReportTable from "@/components/reports/BenefitsReportTable";
import CompanyReportTable from "@/components/reports/CompanyReportTable";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";
import { 
  reportSummary, 
  monthlyExpenses, 
  categoryTrends, 
  benefitReports, 
  companyReports,
  reportPeriods 
} from "@/lib/reportsData";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("semester");
  const [activeTab, setActiveTab] = useState("overview");

  const handleExportPDF = () => {
    const periodLabel = reportPeriods.find(p => p.value === selectedPeriod)?.label || "Período";
    exportToPDF(reportSummary, benefitReports, companyReports, monthlyExpenses, periodLabel);
    toast.success("Relatório PDF exportado com sucesso!");
  };

  const handleExportExcel = () => {
    exportToExcel(reportSummary, benefitReports, companyReports, monthlyExpenses);
    toast.success("Relatório Excel exportado com sucesso!");
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground mt-1">Análises gerenciais e tendências de benefícios</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {reportPeriods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleExportExcel} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            
            <Button onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="animate-fade-in-up">
          <ReportSummaryCards data={reportSummary} />
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2 data-[state=active]:bg-background">
              <TrendingUp className="h-4 w-4" />
              Tendências
            </TabsTrigger>
            <TabsTrigger value="benefits" className="gap-2 data-[state=active]:bg-background">
              <Gift className="h-4 w-4" />
              Benefícios
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-2 data-[state=active]:bg-background">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendChart data={categoryTrends} />
              <ExpenseAreaChart data={monthlyExpenses.slice(-6)} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-elevated p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 Benefícios por Adesão</h3>
                <div className="space-y-4">
                  {benefitReports
                    .sort((a, b) => b.adhesionRate - a.adhesionRate)
                    .slice(0, 5)
                    .map((benefit, index) => (
                      <div key={benefit.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">{benefit.name}</span>
                            <span className="text-sm font-semibold text-primary">{benefit.adhesionRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${benefit.adhesionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="card-elevated p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Maiores Crescimentos</h3>
                <div className="space-y-4">
                  {benefitReports
                    .filter(b => b.trend === "up")
                    .sort((a, b) => b.trendValue - a.trendValue)
                    .slice(0, 5)
                    .map((benefit, index) => (
                      <div key={benefit.id} className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium text-foreground">{benefit.name}</p>
                            <p className="text-sm text-muted-foreground">{benefit.category}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          +{benefit.trendValue.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6 animate-fade-in">
            <TrendChart data={categoryTrends} />
            <ExpenseAreaChart data={monthlyExpenses} />
          </TabsContent>

          {/* Benefits Tab */}
          <TabsContent value="benefits" className="animate-fade-in">
            <BenefitsReportTable data={benefitReports} />
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="animate-fade-in">
            <CompanyReportTable data={companyReports} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
