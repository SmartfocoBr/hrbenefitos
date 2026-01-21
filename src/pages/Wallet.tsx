import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet as WalletIcon,
  Calculator,
  Scale,
  Settings,
  Download,
  Upload,
  Sparkles
} from "lucide-react";
import { WalletSimulator } from "@/components/wallet/WalletSimulator";
import { TaxRulesPanel } from "@/components/wallet/TaxRulesPanel";
import { WalletOverview } from "@/components/wallet/WalletOverview";
import { SimulationAllocation } from "@/types/wallet";
import { toast } from "@/hooks/use-toast";

export default function Wallet() {
  const [activeTab, setActiveTab] = useState("overview");

  const handleSaveSimulation = (allocations: SimulationAllocation[]) => {
    console.log("Saving allocations:", allocations);
    toast({
      title: "Distribuição Salva",
      description: "Sua distribuição de benefícios foi salva com sucesso.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Carteira Flexível</h1>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Beta
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Distribua seus créditos entre categorias de benefícios e otimize a tributação
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configurar Política
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <WalletIcon className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="simulator" className="gap-2">
              <Calculator className="h-4 w-4" />
              Simulador
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Scale className="h-4 w-4" />
              Regras Fiscais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <WalletOverview />
          </TabsContent>

          <TabsContent value="simulator" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <WalletSimulator 
                totalCredits={1500} 
                onSave={handleSaveSimulation}
              />
            </div>
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <div className="max-w-3xl mx-auto">
              <TaxRulesPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
