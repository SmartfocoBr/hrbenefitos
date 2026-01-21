import { useEffect, useState, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useBenefits } from "@/hooks/useBenefits";

const AnimatedRealtimePieChart = () => {
  const { stats, categoryConfig, isLoading } = useBenefits();
  const [animationKey, setAnimationKey] = useState(0);
  const prevDataRef = useRef<any[]>([]);

  // Transform data for pie chart
  const chartData = Object.entries(stats.byCategory)
    .filter(([_, count]) => count > 0)
    .map(([key, count]) => ({
      name: categoryConfig[key]?.label || key,
      value: count,
      color: categoryConfig[key]?.color || "hsl(var(--primary))",
    }));

  // Calculate percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = chartData.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0",
  }));

  // Trigger animation when data changes
  useEffect(() => {
    const dataString = JSON.stringify(dataWithPercentage);
    const prevDataString = JSON.stringify(prevDataRef.current);

    if (dataString !== prevDataString) {
      setAnimationKey((prev) => prev + 1);
      prevDataRef.current = dataWithPercentage;
    }
  }, [dataWithPercentage]);

  if (isLoading) {
    return (
      <div className="card-elevated p-6 h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando distribuição...</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card-elevated p-6 h-[400px] flex flex-col items-center justify-center">
        <p className="text-muted-foreground">Nenhum benefício cadastrado</p>
        <p className="text-sm text-muted-foreground mt-1">
          Os dados aparecerão quando benefícios forem adicionados
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 h-[400px] transition-all duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Distribuição por Categoria</h3>
          <p className="text-sm text-muted-foreground">
            {total} benefícios em {chartData.length} categorias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-muted-foreground">Tempo real</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <PieChart key={animationKey}>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            animationDuration={800}
            animationEasing="ease-out"
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="transparent"
                className="transition-all duration-500 hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value} (${props.payload.percentage}%)`,
              name,
            ]}
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
            formatter={(value: string) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnimatedRealtimePieChart;
