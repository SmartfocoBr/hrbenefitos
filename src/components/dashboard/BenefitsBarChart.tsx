import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
  { name: "Vale Refeição", value: 850000, color: "hsl(188 94% 43%)" },
  { name: "Plano Saúde", value: 720000, color: "hsl(222 47% 25%)" },
  { name: "Vale Transporte", value: 420000, color: "hsl(142 76% 36%)" },
  { name: "Vale Alimentação", value: 380000, color: "hsl(38 92% 50%)" },
  { name: "Plano Odonto", value: 180000, color: "hsl(280 65% 60%)" },
  { name: "Seguro Vida", value: 120000, color: "hsl(199 89% 48%)" },
  { name: "Wellhub", value: 95000, color: "hsl(0 84% 60%)" },
];

const formatValue = (value: number) => {
  if (value >= 1000000) {
    return `R$${(value / 1000000).toFixed(1)}M`;
  }
  return `R$${(value / 1000).toFixed(0)}K`;
};

const BenefitsBarChart = () => {
  return (
    <div className="card-elevated p-6 h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Gastos por Benefício</h3>
          <p className="text-sm text-muted-foreground">Distribuição mensal de custos</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">R$2.76M</span>
          <span className="text-sm text-success font-medium">-3.2%</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            tickFormatter={formatValue}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            formatter={(value: number) => [`R$${value.toLocaleString("pt-BR")}`, "Valor"]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BenefitsBarChart;
