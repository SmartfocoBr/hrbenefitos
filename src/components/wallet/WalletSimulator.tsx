import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Utensils, Heart, Bus, Dumbbell, GraduationCap, Ticket,
  Calculator, RefreshCw, Save, AlertCircle, CheckCircle2, Info
} from "lucide-react";
import { walletCategories, formatCurrency, calculateTax } from "@/lib/walletData";
import { BenefitCategory, SimulationAllocation } from "@/types/wallet";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils, Heart, Bus, Dumbbell, GraduationCap, Ticket
};

interface WalletSimulatorProps {
  totalCredits?: number;
  onSave?: (allocations: SimulationAllocation[]) => void;
}

export function WalletSimulator({ totalCredits = 1500, onSave }: WalletSimulatorProps) {
  const [allocations, setAllocations] = useState<Record<BenefitCategory, number>>(() => {
    const initial: Record<BenefitCategory, number> = {} as Record<BenefitCategory, number>;
    walletCategories.forEach(cat => {
      initial[cat.id] = cat.id === "alimentacao" ? 40 : cat.id === "saude" ? 30 : 10;
    });
    return initial;
  });

  const totalPercentage = useMemo(() => 
    Object.values(allocations).reduce((sum, val) => sum + val, 0),
    [allocations]
  );

  const isValid = totalPercentage === 100;

  const simulation = useMemo(() => {
    const results: SimulationAllocation[] = walletCategories.map(cat => {
      const percentage = allocations[cat.id] || 0;
      const amount = (totalCredits * percentage) / 100;
      const taxAmount = calculateTax(amount, cat.id);
      return {
        categoryId: cat.id,
        amount,
        percentage,
        taxAmount,
        netAmount: amount - taxAmount
      };
    });

    const totalTax = results.reduce((sum, r) => sum + r.taxAmount, 0);
    const netValue = totalCredits - totalTax;

    return {
      allocations: results,
      totalTax,
      netValue,
      effectiveRate: ((totalCredits - netValue) / totalCredits) * 100
    };
  }, [allocations, totalCredits]);

  const handleSliderChange = useCallback((categoryId: BenefitCategory, value: number[]) => {
    setAllocations(prev => ({
      ...prev,
      [categoryId]: value[0]
    }));
  }, []);

  const handleReset = useCallback(() => {
    const reset: Record<BenefitCategory, number> = {} as Record<BenefitCategory, number>;
    walletCategories.forEach(cat => {
      reset[cat.id] = cat.id === "alimentacao" ? 40 : cat.id === "saude" ? 30 : 10;
    });
    setAllocations(reset);
  }, []);

  const handleSave = useCallback(() => {
    if (isValid && onSave) {
      onSave(simulation.allocations);
    }
  }, [isValid, onSave, simulation.allocations]);

  return (
    <div className="space-y-6">
      {/* Header with Total Credits */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Créditos Mensais Disponíveis</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalCredits)}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Alocação Total</p>
                <p className={cn(
                  "text-2xl font-bold",
                  isValid ? "text-green-600" : "text-destructive"
                )}>
                  {totalPercentage}%
                </p>
              </div>
              {isValid ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
          </div>
          {!isValid && (
            <p className="text-sm text-destructive mt-2">
              {totalPercentage < 100 
                ? `Faltam ${100 - totalPercentage}% para completar a alocação`
                : `Excesso de ${totalPercentage - 100}% na alocação`
              }
            </p>
          )}
        </CardContent>
      </Card>

      {/* Category Sliders */}
      <div className="grid gap-4">
        {walletCategories.map(category => {
          const IconComponent = iconMap[category.icon];
          const allocation = simulation.allocations.find(a => a.categoryId === category.id);
          
          return (
            <Card key={category.id} className="overflow-hidden">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {IconComponent && (
                        <IconComponent className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.name}</span>
                        <Badge 
                          variant={category.taxRule === "exempt" ? "default" : category.taxRule === "partial" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {category.taxRule === "exempt" ? "Isento" : category.taxRule === "partial" ? "Parcial" : "Tributável"}
                        </Badge>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{category.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Máximo: {category.maxAllocation}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: category.color }}>
                      {allocations[category.id]}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(allocation?.amount || 0)}
                    </p>
                  </div>
                </div>

                <Slider
                  value={[allocations[category.id]]}
                  onValueChange={(value) => handleSliderChange(category.id, value)}
                  max={category.maxAllocation}
                  step={5}
                  className="mb-2"
                />

                {category.taxRule !== "exempt" && allocation && allocation.taxAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t">
                    <span>Imposto ({category.taxPercentage}%)</span>
                    <span className="text-destructive">-{formatCurrency(allocation.taxAmount)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resumo da Simulação
          </CardTitle>
          <CardDescription>
            Visualize o impacto fiscal da sua distribuição
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor Bruto</p>
              <p className="text-xl font-bold">{formatCurrency(totalCredits)}</p>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Impostos</p>
              <p className="text-xl font-bold text-destructive">
                -{formatCurrency(simulation.totalTax)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor Líquido</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(simulation.netValue)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Taxa Efetiva de Tributação</span>
              <span className={cn(
                "font-medium",
                simulation.effectiveRate > 10 ? "text-amber-600" : "text-green-600"
              )}>
                {simulation.effectiveRate.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={simulation.effectiveRate} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {simulation.effectiveRate <= 5 
                ? "Excelente! Sua distribuição é altamente eficiente fiscalmente."
                : simulation.effectiveRate <= 10
                ? "Boa distribuição. Considere aumentar categorias isentas."
                : "Atenção: Alta carga tributária. Redistribua para categorias isentas."
              }
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!isValid}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Distribuição
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
