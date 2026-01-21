import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MonthlyExpense } from "@/types/report";
import { formatCurrency } from "@/lib/reportsData";

interface ExpenseAreaChartProps {
  data: MonthlyExpense[];
}

const ExpenseAreaChart = ({ data }: ExpenseAreaChartProps) => {
  return (
    <div className="card-elevated p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Evolução de Gastos Mensais</h3>
        <p className="text-sm text-muted-foreground">Distribuição acumulada por categoria ao longo do tempo</p>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAlimentacao" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(188 94% 43%)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(188 94% 43%)" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorSaude" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(222 47% 25%)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(222 47% 25%)" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorTransporte" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorBemestar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorOutros" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(280 65% 60%)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(280 65% 60%)" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                alimentacao: "Alimentação",
                saude: "Saúde",
                transporte: "Transporte",
                bemestar: "Bem-estar",
                outros: "Outros",
              };
              return [formatCurrency(value), labels[name] || name];
            }}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
          />
          <Legend 
            formatter={(value) => {
              const labels: Record<string, string> = {
                alimentacao: "Alimentação",
                saude: "Saúde",
                transporte: "Transporte",
                bemestar: "Bem-estar",
                outros: "Outros",
              };
              return <span className="text-sm text-foreground">{labels[value] || value}</span>;
            }}
          />
          <Area type="monotone" dataKey="alimentacao" stackId="1" stroke="hsl(188 94% 43%)" fill="url(#colorAlimentacao)" />
          <Area type="monotone" dataKey="saude" stackId="1" stroke="hsl(222 47% 25%)" fill="url(#colorSaude)" />
          <Area type="monotone" dataKey="transporte" stackId="1" stroke="hsl(142 76% 36%)" fill="url(#colorTransporte)" />
          <Area type="monotone" dataKey="bemestar" stackId="1" stroke="hsl(38 92% 50%)" fill="url(#colorBemestar)" />
          <Area type="monotone" dataKey="outros" stackId="1" stroke="hsl(280 65% 60%)" fill="url(#colorOutros)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseAreaChart;
