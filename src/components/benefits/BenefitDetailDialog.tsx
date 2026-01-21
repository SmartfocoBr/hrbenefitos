import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Benefit } from "./BenefitCard";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Building2, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  FileText,
  Settings,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BenefitDetailDialogProps {
  benefit: Benefit | null;
  open: boolean;
  onClose: () => void;
}

// Mock eligibility rules
const eligibilityRules = [
  { id: "1", name: "Tempo mínimo de empresa", value: "90 dias", enabled: true },
  { id: "2", name: "Tipo de contrato", value: "CLT", enabled: true },
  { id: "3", name: "Carga horária mínima", value: "30h/semana", enabled: false },
  { id: "4", name: "Cargo/Nível", value: "Todos", enabled: true },
  { id: "5", name: "Sindicato", value: "Todos", enabled: true },
];

// Mock enrolled employees
const enrolledEmployees = [
  { id: "1", name: "Maria Silva", department: "Tecnologia", enrolledAt: "2024-01-15", status: "active" },
  { id: "2", name: "João Santos", department: "Comercial", enrolledAt: "2024-01-10", status: "active" },
  { id: "3", name: "Ana Oliveira", department: "RH", enrolledAt: "2024-01-08", status: "active" },
  { id: "4", name: "Carlos Lima", department: "Financeiro", enrolledAt: "2024-01-05", status: "pending" },
  { id: "5", name: "Paula Costa", department: "Marketing", enrolledAt: "2024-01-02", status: "active" },
];

const BenefitDetailDialog = ({ benefit, open, onClose }: BenefitDetailDialogProps) => {
  if (!benefit) return null;

  const Icon = benefit.icon;
  const adhesionRate = benefit.eligibleCount > 0 
    ? Math.round((benefit.enrolledCount / benefit.eligibleCount) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${benefit.color}15` }}
            >
              <Icon className="h-8 w-8" style={{ color: benefit.color }} />
            </div>
            <div>
              <DialogTitle className="text-2xl">{benefit.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {benefit.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{benefit.enrolledCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Inscritos</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{adhesionRate}%</p>
            <p className="text-xs text-muted-foreground">Adesão</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">R${(benefit.monthlyCost / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">Custo mensal</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Building2 className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{benefit.eligibleCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Elegíveis</p>
          </div>
        </div>

        {/* Adhesion Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Taxa de adesão</span>
            <span className="font-medium">{adhesionRate}%</span>
          </div>
          <Progress value={adhesionRate} className="h-2" />
        </div>

        <Tabs defaultValue="eligibility" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="eligibility" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Elegibilidade
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Colaboradores
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Eligibility Tab */}
          <TabsContent value="eligibility" className="mt-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Regras de Elegibilidade</h4>
              <Button variant="outline" size="sm">
                Adicionar Regra
              </Button>
            </div>

            <div className="space-y-3">
              {eligibilityRules.map((rule) => (
                <div 
                  key={rule.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    {rule.enabled ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{rule.name}</p>
                      <p className="text-sm text-muted-foreground">{rule.value}</p>
                    </div>
                  </div>
                  <Switch checked={rule.enabled} />
                </div>
              ))}
            </div>

            <div className="p-4 bg-info/10 border border-info/20 rounded-lg flex items-start gap-3 mt-4">
              <AlertCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Dica de otimização</p>
                <p className="text-sm text-muted-foreground">
                  Considere revisar a regra de carga horária mínima. 127 colaboradores part-time poderiam ser elegíveis.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Colaboradores Inscritos</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Exportar</Button>
                <Button size="sm" className="btn-premium">Inscrever Colaborador</Button>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Departamento</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Data Inscrição</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledEmployees.map((employee) => (
                    <tr key={employee.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium text-foreground">{employee.name}</td>
                      <td className="p-3 text-muted-foreground">{employee.department}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(employee.enrolledAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            employee.status === "active" 
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          )}
                        >
                          {employee.status === "active" ? "Ativo" : "Pendente"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm">Gerenciar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <div className="space-y-4">
              {[
                { date: "2024-01-20", action: "Política atualizada", user: "Admin RH", details: "Tempo mínimo alterado de 60 para 90 dias" },
                { date: "2024-01-15", action: "127 colaboradores inscritos", user: "Sistema", details: "Importação automática via ERP" },
                { date: "2024-01-10", action: "Fornecedor alterado", user: "Financeiro", details: "Migração de Alelo para VR" },
                { date: "2024-01-05", action: "Benefício ativado", user: "Admin RH", details: "Configuração inicial concluída" },
              ].map((item, index) => (
                <div key={index} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{item.action}</p>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{item.details}</p>
                    <p className="text-xs text-muted-foreground mt-2">por {item.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button className="btn-premium">Salvar Alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BenefitDetailDialog;
