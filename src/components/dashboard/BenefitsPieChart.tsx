import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "Alimentação", value: 35, color: "hsl(188 94% 43%)" },
  { name: "Saúde", value: 28, color: "hsl(222 47% 25%)" },
  { name: "Transporte", value: 18, color: "hsl(142 76% 36%)" },
  { name: "Bem-estar", value: 12, color: "hsl(38 92% 50%)" },
  { name: "Outros", value: 7, color: "hsl(280 65% 60%)" },
];

const BenefitsPieChart = () => {
  return (
    <div className="card-elevated p-6 h-[400px]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Distribuição por Categoria</h3>
        <p className="text-sm text-muted-foreground">% do orçamento total de benefícios</p>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}%`, "Participação"]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BenefitsPieChart;
