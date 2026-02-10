import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConnectorRegistryTable from "@/components/integrations/ConnectorRegistryTable";
import ConnectorHealthDashboard from "@/components/integrations/ConnectorHealthDashboard";
import ExecutionHistoryTable from "@/components/integrations/ExecutionHistoryTable";
import DLQTable from "@/components/integrations/DLQTable";
import { Link2, Activity, History, AlertTriangle } from "lucide-react";

const Integrations = () => {
  const [tab, setTab] = useState("registry");

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Integration Hub</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie conectores, monitore saúde e acompanhe execuções
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="animate-fade-in-up">
          <TabsList className="grid w-full grid-cols-4 max-w-xl">
            <TabsTrigger value="registry" className="gap-1.5">
              <Link2 className="h-4 w-4" /> Conectores
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-1.5">
              <Activity className="h-4 w-4" /> Saúde
            </TabsTrigger>
            <TabsTrigger value="executions" className="gap-1.5">
              <History className="h-4 w-4" /> Execuções
            </TabsTrigger>
            <TabsTrigger value="dlq" className="gap-1.5">
              <AlertTriangle className="h-4 w-4" /> DLQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registry" className="mt-6">
            <ConnectorRegistryTable />
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            <ConnectorHealthDashboard />
          </TabsContent>

          <TabsContent value="executions" className="mt-6">
            <ExecutionHistoryTable />
          </TabsContent>

          <TabsContent value="dlq" className="mt-6">
            <DLQTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Integrations;
