import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Wallet, FileBarChart, AlertTriangle } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import InstructionsTab from "@/components/supplier/InstructionsTab";
import BalancesTab from "@/components/supplier/BalancesTab";
import ReconciliationTab from "@/components/supplier/ReconciliationTab";
import ErrorMapTab from "@/components/supplier/ErrorMapTab";

const SupplierOperations = () => {
  const { activeTenantId } = useTenant();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Operações com Fornecedores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie instruções, saldos e conciliações com fornecedores de benefícios.
          </p>
        </div>

        <Tabs defaultValue="instructions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="instructions" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Instruções
            </TabsTrigger>
            <TabsTrigger value="balances" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Saldos
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              Conciliação
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Mapeamento de Erros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instructions">
            <InstructionsTab tenantId={activeTenantId} />
          </TabsContent>
          <TabsContent value="balances">
            <BalancesTab tenantId={activeTenantId} />
          </TabsContent>
          <TabsContent value="reconciliation">
            <ReconciliationTab tenantId={activeTenantId} />
          </TabsContent>
          <TabsContent value="errors">
            <ErrorMapTab tenantId={activeTenantId} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SupplierOperations;
