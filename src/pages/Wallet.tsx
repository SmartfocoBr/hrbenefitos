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
  Sparkles,
  BarChart3,
} from "lucide-react";
import { WalletSimulator } from "@/components/wallet/WalletSimulator";
import { TaxRulesPanel } from "@/components/wallet/TaxRulesPanel";
import { WalletOverview } from "@/components/wallet/WalletOverview";
import { WalletBalanceCard } from "@/components/wallet/WalletBalanceCard";
import { TransactionList } from "@/components/wallet/TransactionList";
import { AllocationFlow } from "@/components/wallet/AllocationFlow";
import { AdminAllocationLimits } from "@/components/wallet/AdminAllocationLimits";
import { useWallet } from "@/hooks/useWallet";
import { SimulationAllocation } from "@/types/wallet";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Wallet() {
  const [activeTab, setActiveTab] = useState("overview");
  const [walletIdInput, setWalletIdInput] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>();

  const { data: walletData, isLoading: walletLoading } = useWallet(selectedWalletId);

  const handleSaveSimulation = (allocations: SimulationAllocation[]) => {
    console.log("Saving allocations:", allocations);
    toast({
      title: "Distribuição Salva",
      description: "Sua distribuição de benefícios foi salva com sucesso.",
    });
  };

  const handleLoadWallet = () => {
    if (walletIdInput.trim()) {
      setSelectedWalletId(walletIdInput.trim());
    }
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
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <WalletIcon className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="my-wallet" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Minha Carteira
            </TabsTrigger>
            <TabsTrigger value="simulator" className="gap-2">
              <Calculator className="h-4 w-4" />
              Simulador
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Scale className="h-4 w-4" />
              Regras Fiscais
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <Settings className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <WalletOverview />
          </TabsContent>

          <TabsContent value="my-wallet" className="mt-6">
            <div className="space-y-6">
              {/* Wallet Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Carregar Carteira</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label>ID da Carteira</Label>
                      <Input
                        placeholder="Cole o UUID da carteira..."
                        value={walletIdInput}
                        onChange={(e) => setWalletIdInput(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleLoadWallet} disabled={!walletIdInput.trim()}>
                      Carregar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {walletData && walletData.balance && (
                <>
                  <WalletBalanceCard
                    amount={walletData.balance.amount}
                    available={walletData.balance.available_amount}
                    reserved={walletData.balance.reserved_amount}
                    currency={walletData.balance.currency}
                    validTo={walletData.balance.valid_to}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AllocationFlow
                      walletId={walletData.id}
                      employeeId={walletData.employee_id}
                      availableAmount={walletData.balance.available_amount}
                    />
                    <TransactionList
                      transactions={walletData.ledger}
                      walletId={walletData.id}
                    />
                  </div>
                </>
              )}

              {selectedWalletId && !walletLoading && !walletData?.balance && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhuma carteira ou saldo ativo encontrado para este ID.
                  </CardContent>
                </Card>
              )}
            </div>
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

          <TabsContent value="admin" className="mt-6">
            <div className="max-w-4xl mx-auto">
              <AdminAllocationLimits />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
