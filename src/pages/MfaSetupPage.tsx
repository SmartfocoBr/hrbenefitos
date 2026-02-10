import DashboardLayout from "@/components/DashboardLayout";
import { MfaSetup } from "@/components/auth/MfaSetup";

const MfaSetupPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Segurança da Conta</h1>
          <p className="text-muted-foreground mt-1">Configure a autenticação de dois fatores</p>
        </div>
        <MfaSetup />
      </div>
    </DashboardLayout>
  );
};

export default MfaSetupPage;
