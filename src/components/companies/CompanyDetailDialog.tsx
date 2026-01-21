import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Company } from "@/types/company";
import { 
  statusConfig, 
  segmentConfig,
  costCentersData, 
  companyPoliciesData
} from "@/lib/companiesData";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  Users, 
  Gift,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Database,
  FileText,
  Settings,
  BarChart3,
  Plus,
  Edit,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface CompanyDetailDialogProps {
  company: Company | null;
  open: boolean;
  onClose: () => void;
}

const COLORS = ["#06b6d4", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899"];

const CompanyDetailDialog = ({ company, open, onClose }: CompanyDetailDialogProps) => {
  if (!company) return null;

  const status = statusConfig[company.status];
  const segment = segmentConfig[company.segment] || { color: "#6b7280" };
  const costCenters = costCentersData.filter(cc => cc.companyId === company.id);
  const policies = companyPoliciesData.filter(p => p.companyId === company.id);
  const budgetUsage = (company.monthlySpent / company.monthlyBudget) * 100;

  const costCenterChartData = costCenters.slice(0, 6).map(cc => ({
    name: cc.code,
    gasto: cc.spent / 1000,
    orcamento: cc.budget / 1000,
  }));

  const departmentPieData = costCenters.slice(0, 5).map((cc, index) => ({
    name: cc.name,
    value: cc.spent,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl"
              style={{ backgroundColor: `${segment.color}15`, color: segment.color }}
            >
              {company.tradeName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl">{company.tradeName}</DialogTitle>
                <Badge variant="outline" className={cn("text-xs", status.bgClass)}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {company.name} • CNPJ: {company.cnpj}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{company.employeeCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Colaboradores</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Building2 className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{company.costCenterCount}</p>
            <p className="text-xs text-muted-foreground">Centros de Custo</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Gift className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{company.activeBenefits}</p>
            <p className="text-xs text-muted-foreground">Benefícios</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">R${(company.monthlySpent / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">Gasto mensal</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className={cn(
              "text-2xl font-bold",
              budgetUsage > 95 ? "text-destructive" : budgetUsage > 85 ? "text-warning" : "text-success"
            )}>
              {budgetUsage.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Utilização</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="costcenters" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Centros de Custo
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Políticas
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Informações
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Bar Chart - Cost by Center */}
              <div className="card-elevated p-4">
                <h4 className="font-semibold text-foreground mb-4">Gastos por Centro de Custo (R$K)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={costCenterChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={70} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="gasto" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart - Distribution */}
              <div className="card-elevated p-4">
                <h4 className="font-semibold text-foreground mb-4">Distribuição por Departamento</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={departmentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {departmentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`R$${(value / 1000).toFixed(0)}K`, "Valor"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {departmentPieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget Overview */}
            <div className="card-elevated p-4">
              <h4 className="font-semibold text-foreground mb-4">Visão Geral do Orçamento</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground font-medium">Orçamento Total</span>
                    <span className="text-foreground">R${company.monthlyBudget.toLocaleString()}</span>
                  </div>
                  <Progress value={100} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground font-medium">Utilizado</span>
                    <span className={cn(
                      budgetUsage > 95 ? "text-destructive" : budgetUsage > 85 ? "text-warning" : "text-success"
                    )}>
                      R${company.monthlySpent.toLocaleString()} ({budgetUsage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress 
                    value={budgetUsage} 
                    className={cn(
                      "h-3",
                      budgetUsage > 95 ? "[&>div]:bg-destructive" : budgetUsage > 85 ? "[&>div]:bg-warning" : ""
                    )} 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground font-medium">Disponível</span>
                    <span className="text-success">R${(company.monthlyBudget - company.monthlySpent).toLocaleString()}</span>
                  </div>
                  <Progress value={100 - budgetUsage} className="h-3 [&>div]:bg-success" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Cost Centers Tab */}
          <TabsContent value="costcenters" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Centros de Custo</h4>
              <Button size="sm" className="btn-premium gap-2">
                <Plus className="h-4 w-4" />
                Novo Centro de Custo
              </Button>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Código</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Gestor</th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">Colaboradores</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Orçamento</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Gasto</th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">%</th>
                  </tr>
                </thead>
                <tbody>
                  {costCenters.map((cc) => {
                    const usage = (cc.spent / cc.budget) * 100;
                    return (
                      <tr key={cc.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-sm text-accent">{cc.code}</td>
                        <td className="p-3 font-medium text-foreground">{cc.name}</td>
                        <td className="p-3 text-muted-foreground">{cc.manager}</td>
                        <td className="p-3 text-center text-foreground">{cc.employeeCount}</td>
                        <td className="p-3 text-right text-foreground">R${cc.budget.toLocaleString()}</td>
                        <td className="p-3 text-right text-foreground">R${cc.spent.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              usage > 95 ? "bg-destructive/10 text-destructive" : 
                              usage > 85 ? "bg-warning/10 text-warning" : 
                              "bg-success/10 text-success"
                            )}
                          >
                            {usage.toFixed(0)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Políticas de Benefícios</h4>
              <Button size="sm" className="btn-premium gap-2">
                <Plus className="h-4 w-4" />
                Nova Política
              </Button>
            </div>

            <div className="space-y-3">
              {policies.map((policy) => (
                <div 
                  key={policy.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Gift className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium text-foreground">{policy.benefitName}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {policy.eligibilityRules.map((rule, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {rule}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {policy.monthlyLimit && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Limite</p>
                        <p className="font-medium text-foreground">R${policy.monthlyLimit}</p>
                      </div>
                    )}
                    {policy.employeeContribution !== undefined && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Coparticipação</p>
                        <p className="font-medium text-foreground">{policy.employeeContribution}%</p>
                      </div>
                    )}
                    <Switch checked={policy.enabled} />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Dados Cadastrais</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Razão Social</p>
                      <p className="font-medium text-foreground">{company.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">CNPJ</p>
                      <p className="font-medium text-foreground">{company.cnpj}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Endereço</p>
                      <p className="font-medium text-foreground">{company.address}</p>
                      <p className="text-sm text-muted-foreground">{company.city} - {company.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cadastrado em</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(company.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Contato e Integrações</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="font-medium text-foreground">{company.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{company.email}</p>
                    </div>
                  </div>
                  {company.website && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Website</p>
                        <p className="font-medium text-foreground">{company.website}</p>
                      </div>
                    </div>
                  )}
                  {company.erpIntegration && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">ERP Integrado</p>
                        <p className="font-medium text-foreground">{company.erpIntegration}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button className="btn-premium">Salvar Alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyDetailDialog;
