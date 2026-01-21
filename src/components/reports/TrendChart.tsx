import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CategoryTrend } from "@/types/report";
import { formatCurrency } from "@/lib/reportsData";

interface TrendChartProps {
  data: CategoryTrend[];
}

const TrendChart = ({ data }: TrendChartProps) => {
  // Transform data for recharts
  const chartData = data[0]?.data.map((_, index) => {
    const point: Record<string, any> = { month: data[0].data[index].month };
    data.forEach(category => {
      point[category.category] = category.data[index]?.value || 0;
    });
    return point;
  }) || [];

  return (
    <div className="card-elevated p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Tendência de Gastos por Categoria</h3>
        <p className="text-sm text-muted-foreground">Evolução mensal dos gastos por categoria de benefício</p>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            formatter={(value: number) => [formatCurrency(value), ""]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
          />
          <Legend 
            formatter={(value) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
          {data.map((category) => (
            <Line
              key={category.category}
              type="monotone"
              dataKey={category.category}
              stroke={category.color}
              strokeWidth={2}
              dot={{ fill: category.color, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
