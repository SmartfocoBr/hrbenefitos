import { useEffect, useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useBenefits } from "@/hooks/useBenefits";

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$${(value / 1000).toFixed(0)}K`;
  }
  return `R$${value.toFixed(0)}`;
};

const AnimatedRealtimeBenefitsChart = () => {
  const { benefits, stats, categoryConfig, isLoading } = useBenefits();
  const [animationKey, setAnimationKey] = useState(0);
  const prevDataRef = useRef<any[]>([]);

  // Transform benefits data to chart format
  const chartData = Object.entries(stats.byCategory).map(([key, count]) => ({
    name: categoryConfig[key]?.label || key,
    value: count,
    color: categoryConfig[key]?.color || "hsl(var(--primary))",
  }));

  // Trigger animation when data changes
  useEffect(() => {
    const dataString = JSON.stringify(chartData);
    const prevDataString = JSON.stringify(prevDataRef.current);
    
    if (dataString !== prevDataString) {
      setAnimationKey((prev) => prev + 1);
      prevDataRef.current = chartData;
    }
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="card-elevated p-6 h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando benefícios...</div>
      </div>
    );
  }

  return (
    <div className="card-elevated p-6 h-[400px] transition-all duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Benefícios por Categoria</h3>
          <p className="text-sm text-muted-foreground">
            {stats.total} benefícios cadastrados • {stats.active} ativos
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
        <BarChart
          key={animationKey}
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            width={75}
          />
          <Tooltip
            formatter={(value: number) => [`${value} benefícios`, "Quantidade"]}
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className="transition-all duration-500"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnimatedRealtimeBenefitsChart;
