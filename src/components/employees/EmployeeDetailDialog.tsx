import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Employee } from "@/types/employee";
import { 
  statusConfig, 
  contractConfig, 
  dependentsData, 
  benefitHistoryData, 
  eligibilityRulesData,
  relationshipConfig
} from "@/lib/employeesData";
import { cn } from "@/lib/utils";
import { 
  User, 
  Mail, 
  Phone,
  MapPin, 
  Building2, 
  Calendar,
  Briefcase,
  Clock,
  Gift,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Shield,
  Heart,
  Baby
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmployeeDetailDialogProps {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
}

const EmployeeDetailDialog = ({ employee, open, onClose }: EmployeeDetailDialogProps) => {
  if (!employee) return null;

  const status = statusConfig[employee.status];
  const contract = contractConfig[employee.contractType];
  const dependents = dependentsData.filter(d => d.employeeId === employee.id);
  const history = benefitHistoryData.filter(h => h.employeeId === employee.id);
  const tenure = differenceInYears(new Date(), new Date(employee.hireDate));
  const age = differenceInYears(new Date(), new Date(employee.birthDate));

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case "spouse": return Heart;
      case "child": return Baby;
      default: return User;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-2xl">
              {getInitials(employee.name)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl">{employee.name}</DialogTitle>
                <Badge variant="outline" className={cn("text-xs", status.bgClass)}>
                  {status.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {contract.label}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {employee.position} • {employee.department}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Gift className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{employee.activeBenefits}</p>
            <p className="text-xs text-muted-foreground">Benefícios ativos</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{employee.dependentsCount}</p>
            <p className="text-xs text-muted-foreground">Dependentes</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{tenure}</p>
            <p className="text-xs text-muted-foreground">Anos de empresa</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Shield className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">R${employee.totalBenefitsCost.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Custo mensal</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="benefits" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Benefícios
            </TabsTrigger>
            <TabsTrigger value="dependents" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Dependentes
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Informações Pessoais</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="font-medium text-foreground">{employee.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Localização</p>
                      <p className="font-medium text-foreground">{employee.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(employee.birthDate), "dd/MM/yyyy", { locale: ptBR })} ({age} anos)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Informações Profissionais</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Departamento</p>
                      <p className="font-medium text-foreground">{employee.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Centro de Custo</p>
                      <p className="font-medium text-foreground">{employee.costCenter}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Admissão</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(employee.hireDate), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Carga Horária</p>
                      <p className="font-medium text-foreground">{employee.workload}h/semana</p>
                    </div>
                  </div>
                  {employee.manager && (
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gestor</p>
                        <p className="font-medium text-foreground">{employee.manager}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Benefits/Eligibility Tab */}
          <TabsContent value="benefits" className="mt-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Elegibilidade e Adesão</h4>
              <Button size="sm" className="btn-premium gap-2">
                <Plus className="h-4 w-4" />
                Inscrever em Benefício
              </Button>
            </div>

            <div className="space-y-3">
              {eligibilityRulesData.map((rule) => (
                <div 
                  key={rule.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    {rule.eligible ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{rule.benefitName}</p>
                      <p className="text-sm text-muted-foreground">
                        {rule.enrolledDate 
                          ? `Inscrito desde ${format(new Date(rule.enrolledDate), "dd/MM/yyyy", { locale: ptBR })}`
                          : rule.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {rule.enrolledDate && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Inscrito
                      </Badge>
                    )}
                    <Switch checked={!!rule.enrolledDate} disabled={!rule.eligible} />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Dependents Tab */}
          <TabsContent value="dependents" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Dependentes Cadastrados</h4>
              <Button size="sm" className="btn-premium gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Dependente
              </Button>
            </div>

            {dependents.length > 0 ? (
              <div className="space-y-4">
                {dependents.map((dependent) => {
                  const Icon = getRelationshipIcon(dependent.relationship);
                  const age = differenceInYears(new Date(), new Date(dependent.birthDate));
                  
                  return (
                    <div 
                      key={dependent.id}
                      className="p-4 bg-muted/30 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <Icon className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{dependent.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {relationshipConfig[dependent.relationship]} • {age} anos
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        {dependent.benefits.map((benefit) => (
                          <Badge key={benefit} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dependente cadastrado</p>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-foreground">Histórico de Benefícios</h4>
              <Button variant="outline" size="sm">Exportar</Button>
            </div>

            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className="flex gap-4 p-4 bg-muted/30 rounded-lg"
                  >
                    <div className={cn(
                      "p-2 rounded-lg h-fit",
                      item.action === "enrolled" && "bg-success/10 text-success",
                      item.action === "cancelled" && "bg-destructive/10 text-destructive",
                      item.action === "updated" && "bg-info/10 text-info",
                      item.action === "suspended" && "bg-warning/10 text-warning"
                    )}>
                      {item.action === "enrolled" && <CheckCircle className="h-4 w-4" />}
                      {item.action === "cancelled" && <XCircle className="h-4 w-4" />}
                      {item.action === "updated" && <Edit className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{item.benefitName}</p>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.details}</p>
                      <p className="text-xs text-muted-foreground mt-2">por {item.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum histórico disponível</p>
              </div>
            )}
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

export default EmployeeDetailDialog;
