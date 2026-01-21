import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Wallet, Users, TrendingUp, PieChart, 
  ArrowUpRight, ArrowDownRight, Eye
} from "lucide-react";
import { employeeWallets, walletCategories, formatCurrency } from "@/lib/walletData";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

interface WalletOverviewProps {
  onSelectEmployee?: (employeeId: string) => void;
}

export function WalletOverview({ onSelectEmployee }: WalletOverviewProps) {
  const stats = useMemo(() => {
    const totalCredits = employeeWallets.reduce((sum, w) => sum + w.totalCredits, 0);
    const totalUsed = employeeWallets.reduce((sum, w) => sum + w.usedCredits, 0);
    const utilizationRate = (totalUsed / totalCredits) * 100;

    const categoryTotals: Record<string, number> = {};
    employeeWallets.forEach(wallet => {
      wallet.allocations.forEach(alloc => {
        categoryTotals[alloc.categoryId] = (categoryTotals[alloc.categoryId] || 0) + alloc.allocatedAmount;
      });
    });

    return {
      totalCredits,
      totalUsed,
      utilizationRate,
      employeeCount: employeeWallets.length,
      categoryTotals
    };
  }, []);

  const pieData = useMemo(() => {
    return walletCategories.map(cat => ({
      name: cat.name,
      value: stats.categoryTotals[cat.id] || 0,
      color: cat.color
    })).filter(d => d.value > 0);
  }, [stats.categoryTotals]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Créditos Totais</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalCredits)}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilização Média</p>
                <p className="text-2xl font-bold">{stats.utilizationRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress value={stats.utilizationRate} className="h-2 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Colaboradores Ativos</p>
                <p className="text-2xl font-bold">{stats.employeeCount}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Com carteira flexível ativa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Não Utilizado</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalCredits - stats.totalUsed)}</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-full">
                <PieChart className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
              <ArrowDownRight className="h-3 w-3" />
              <span>-5% vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Employee Wallets List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Carteiras dos Colaboradores
              </span>
              <Button variant="outline" size="sm">Ver Todas</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employeeWallets.map(wallet => {
                const utilization = (wallet.usedCredits / wallet.totalCredits) * 100;
                return (
                  <div 
                    key={wallet.employeeId}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => onSelectEmployee?.(wallet.employeeId)}
                  >
                    <Avatar>
                      <AvatarFallback>
                        {wallet.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{wallet.employeeName}</p>
                      <div className="flex items-center gap-2">
                        <Progress value={utilization} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {utilization.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(wallet.totalCredits)}</p>
                      <p className="text-xs text-muted-foreground">
                        Usado: {formatCurrency(wallet.usedCredits)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
