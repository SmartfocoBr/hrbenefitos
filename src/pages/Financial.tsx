import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Receipt,
  PieChart,
  Calendar,
  Download,
  Filter,
  Building2,
  Users
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from "recharts";

// Financial data
const monthlyData = [
  { month: "Jan", receita: 850000, despesas: 720000, lucro: 130000 },
  { month: "Fev", receita: 920000, despesas: 780000, lucro: 140000 },
  { month: "Mar", receita: 880000, despesas: 750000, lucro: 130000 },
  { month: "Abr", receita: 950000, despesas: 810000, lucro: 140000 },
  { month: "Mai", receita: 1020000, despesas: 860000, lucro: 160000 },
  { month: "Jun", receita: 1100000, despesas: 920000, lucro: 180000 },
];

const categoryExpenses = [
  { category: "Alimentação", value: 380000, percentage: 35, color: "hsl(175 60% 45%)" },
  { category: "Saúde", value: 280000, percentage: 26, color: "hsl(220 60% 50%)" },
  { category: "Transporte", value: 180000, percentage: 17, color: "hsl(40 70% 50%)" },
  { category: "Bem-estar", value: 140000, percentage: 13, color: "hsl(280 50% 55%)" },
  { category: "Outros", value: 100000, percentage: 9, color: "hsl(0 50% 50%)" },
];

const recentTransactions = [
  { id: 1, description: "Pagamento VA - Lote Maio", date: "2024-01-15", value: -285000, type: "expense", status: "completed" },
  { id: 2, description: "Recarga Saúde - Q2", date: "2024-01-14", value: -156000, type: "expense", status: "completed" },
  { id: 3, description: "Ajuste Orçamentário", date: "2024-01-13", value: 50000, type: "income", status: "completed" },
  { id: 4, description: "Pagamento VT - Lote Maio", date: "2024-01-12", value: -89000, type: "expense", status: "pending" },
  { id: 5, description: "Estorno - Duplicidade", date: "2024-01-11", value: 12500, type: "refund", status: "completed" },
  { id: 6, description: "Pagamento Gympass", date: "2024-01-10", value: -45000, type: "expense", status: "completed" },
];

const invoices = [
  { id: "NF-2024-001", company: "TechCorp Brasil", date: "2024-01-15", value: 156000, status: "paid" },
  { id: "NF-2024-002", company: "Inova Soluções", date: "2024-01-14", value: 89000, status: "pending" },
  { id: "NF-2024-003", company: "StartUp Labs", date: "2024-01-13", value: 45000, status: "paid" },
  { id: "NF-2024-004", company: "Digital Services", date: "2024-01-12", value: 234000, status: "overdue" },
  { id: "NF-2024-005", company: "Corporate Plus", date: "2024-01-11", value: 178000, status: "paid" },
];

const formatCurrency = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(2)}M`;
  } else if (absValue >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return `R$ ${value.toLocaleString("pt-BR")}`;
};

const Financial = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");

  const totalReceita = monthlyData.reduce((acc, curr) => acc + curr.receita, 0);
  const totalDespesas = monthlyData.reduce((acc, curr) => acc + curr.despesas, 0);
  const totalLucro = totalReceita - totalDespesas;
  const margemLucro = ((totalLucro / totalReceita) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground mt-1">Gestão financeira e controle orçamentário</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 card-elevated">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-3xl font-bold text-foreground mt-2">{formatCurrency(totalReceita)}</p>
                <div className="flex items-center gap-1 mt-2 text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+12.5%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-6 card-elevated">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas Totais</p>
                <p className="text-3xl font-bold text-foreground mt-2">{formatCurrency(totalDespesas)}</p>
                <div className="flex items-center gap-1 mt-2 text-warning">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+8.3%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-warning/10">
                <CreditCard className="h-6 w-6 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="p-6 card-elevated">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                <p className="text-3xl font-bold text-foreground mt-2">{formatCurrency(totalLucro)}</p>
                <div className="flex items-center gap-1 mt-2 text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+18.2%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-accent/10">
                <Wallet className="h-6 w-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6 card-elevated">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                <p className="text-3xl font-bold text-foreground mt-2">{margemLucro}%</p>
                <div className="flex items-center gap-1 mt-2 text-success">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-sm font-medium">+2.1pp</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-info/10">
                <PieChart className="h-6 w-6 text-info" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
              <PieChart className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2 data-[state=active]:bg-background">
              <Receipt className="h-4 w-4" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2 data-[state=active]:bg-background">
              <CreditCard className="h-4 w-4" />
              Faturas
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="p-6 card-elevated">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Receita vs Despesas</h3>
                  <p className="text-sm text-muted-foreground">Evolução mensal do fluxo financeiro</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160 50% 40%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(160 50% 40%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(40 70% 50%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(40 70% 50%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), ""]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area type="monotone" dataKey="receita" stroke="hsl(160 50% 40%)" fill="url(#colorReceita)" strokeWidth={2} name="Receita" />
                    <Area type="monotone" dataKey="despesas" stroke="hsl(40 70% 50%)" fill="url(#colorDespesas)" strokeWidth={2} name="Despesas" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Category Distribution */}
              <Card className="p-6 card-elevated">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Despesas por Categoria</h3>
                  <p className="text-sm text-muted-foreground">Distribuição do orçamento por tipo de benefício</p>
                </div>
                <div className="space-y-4">
                  {categoryExpenses.map((cat) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{cat.category}</span>
                        <span className="text-muted-foreground">{formatCurrency(cat.value)} ({cat.percentage}%)</span>
                      </div>
                      <Progress value={cat.percentage} className="h-2" style={{ "--progress-color": cat.color } as any} />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Profit Chart */}
            <Card className="p-6 card-elevated">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Lucro Mensal</h3>
                <p className="text-sm text-muted-foreground">Evolução do resultado operacional</p>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Lucro"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="lucro" fill="hsl(175 60% 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card className="p-6 card-elevated">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Transações Recentes</h3>
                  <p className="text-sm text-muted-foreground">Movimentações financeiras do período</p>
                </div>
                <Button variant="outline" size="sm">Ver todas</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.status === "completed" ? "default" : "secondary"}>
                          {tx.status === "completed" ? "Concluído" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${tx.value >= 0 ? "text-success" : "text-foreground"}`}>
                        {tx.value >= 0 ? "+" : ""}{formatCurrency(tx.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card className="p-6 card-elevated">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Faturas</h3>
                  <p className="text-sm text-muted-foreground">Notas fiscais e cobranças</p>
                </div>
                <Button className="gap-2">
                  <Receipt className="h-4 w-4" />
                  Nova Fatura
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.id}</TableCell>
                      <TableCell className="font-medium">{inv.company}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={inv.status === "paid" ? "default" : inv.status === "pending" ? "secondary" : "destructive"}
                        >
                          {inv.status === "paid" ? "Pago" : inv.status === "pending" ? "Pendente" : "Atrasado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(inv.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Financial;
