import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, FileText, Scale, AlertTriangle, CheckCircle2, 
  Settings, ExternalLink
} from "lucide-react";
import { taxRulesConfig, walletCategories } from "@/lib/walletData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function TaxRulesPanel() {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Regras Fiscais Configuráveis
          </CardTitle>
          <CardDescription>
            Configure as regras de tributação para cada categoria de benefício
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">3</p>
              <p className="text-xs text-muted-foreground">Categorias Isentas</p>
            </div>
            <div className="text-center p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">1</p>
              <p className="text-xs text-muted-foreground">Tributação Parcial</p>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <Shield className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-destructive">2</p>
              <p className="text-xs text-muted-foreground">Totalmente Tributáveis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Base Legal e Configurações
            </span>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Editar Regras
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {taxRulesConfig.map((rule, index) => (
                <div key={rule.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge 
                          variant={
                            rule.rule === "exempt" ? "default" : 
                            rule.rule === "partial" ? "secondary" : 
                            "destructive"
                          }
                        >
                          {rule.rule === "exempt" 
                            ? "Isento" 
                            : rule.rule === "partial" 
                            ? `${rule.percentage}%` 
                            : `${rule.percentage}%`
                          }
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rule.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{rule.legalBasis}</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {rule.categories.map(catId => {
                          const cat = walletCategories.find(c => c.id === catId);
                          return cat ? (
                            <Badge 
                              key={catId} 
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: cat.color, color: cat.color }}
                            >
                              {cat.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  {index < taxRulesConfig.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Category Tax Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Resumo por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {walletCategories.map(category => (
              <div 
                key={category.id}
                className={cn(
                  "p-3 rounded-lg border",
                  category.taxRule === "exempt" 
                    ? "bg-green-500/5 border-green-500/20" 
                    : category.taxRule === "partial"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-destructive/5 border-destructive/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{category.name}</span>
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs",
                      category.taxRule === "exempt" 
                        ? "border-green-500 text-green-600" 
                        : category.taxRule === "partial"
                        ? "border-amber-500 text-amber-600"
                        : "border-destructive text-destructive"
                    )}
                  >
                    {category.taxRule === "exempt" 
                      ? "0%" 
                      : `${category.taxPercentage}%`
                    }
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Máx: {category.maxAllocation}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
