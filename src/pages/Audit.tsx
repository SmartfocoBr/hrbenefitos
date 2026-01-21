import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Search,
  Calendar,
  Download,
  Filter,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Settings,
  Database,
  Lock,
  Activity,
  RefreshCw
} from "lucide-react";

// Audit log data
const auditLogs = [
  { 
    id: 1, 
    action: "LOGIN", 
    user: "admin@benefitos.com", 
    resource: "Sistema", 
    details: "Login realizado com sucesso via SSO",
    ip: "192.168.1.100",
    timestamp: "2024-01-15T14:32:00",
    status: "success"
  },
  { 
    id: 2, 
    action: "UPDATE", 
    user: "rh@empresa.com", 
    resource: "Funcionário #1234", 
    details: "Atualização de dados salariais",
    ip: "192.168.1.105",
    timestamp: "2024-01-15T14:28:00",
    status: "success"
  },
  { 
    id: 3, 
    action: "DELETE", 
    user: "admin@benefitos.com", 
    resource: "Benefício VA Extra", 
    details: "Remoção de benefício inativo",
    ip: "192.168.1.100",
    timestamp: "2024-01-15T14:15:00",
    status: "warning"
  },
  { 
    id: 4, 
    action: "CREATE", 
    user: "rh@empresa.com", 
    resource: "Funcionário Novo", 
    details: "Cadastro de novo colaborador CLT",
    ip: "192.168.1.105",
    timestamp: "2024-01-15T13:45:00",
    status: "success"
  },
  { 
    id: 5, 
    action: "LOGIN_FAILED", 
    user: "unknown@test.com", 
    resource: "Sistema", 
    details: "Tentativa de login com credenciais inválidas",
    ip: "45.33.22.11",
    timestamp: "2024-01-15T13:30:00",
    status: "error"
  },
  { 
    id: 6, 
    action: "EXPORT", 
    user: "financeiro@empresa.com", 
    resource: "Relatório Mensal", 
    details: "Exportação de relatório financeiro em PDF",
    ip: "192.168.1.110",
    timestamp: "2024-01-15T12:00:00",
    status: "success"
  },
  { 
    id: 7, 
    action: "CONFIG_CHANGE", 
    user: "admin@benefitos.com", 
    resource: "Política de Senha", 
    details: "Alteração da política de complexidade de senha",
    ip: "192.168.1.100",
    timestamp: "2024-01-15T11:30:00",
    status: "warning"
  },
  { 
    id: 8, 
    action: "PERMISSION_CHANGE", 
    user: "admin@benefitos.com", 
    resource: "Usuário rh@empresa.com", 
    details: "Concessão de permissão de HR Manager",
    ip: "192.168.1.100",
    timestamp: "2024-01-15T10:15:00",
    status: "success"
  },
];

const complianceItems = [
  { 
    id: 1, 
    category: "LGPD", 
    item: "Consentimento de Dados", 
    status: "compliant",
    lastCheck: "2024-01-15",
    nextReview: "2024-04-15",
    description: "Todos os colaboradores com consentimento ativo"
  },
  { 
    id: 2, 
    category: "LGPD", 
    item: "Política de Retenção", 
    status: "compliant",
    lastCheck: "2024-01-10",
    nextReview: "2024-04-10",
    description: "Dados pessoais com período de retenção definido"
  },
  { 
    id: 3, 
    category: "Segurança", 
    item: "Autenticação 2FA", 
    status: "attention",
    lastCheck: "2024-01-12",
    nextReview: "2024-02-12",
    description: "85% dos usuários admin com 2FA ativo"
  },
  { 
    id: 4, 
    category: "Segurança", 
    item: "Backup de Dados", 
    status: "compliant",
    lastCheck: "2024-01-15",
    nextReview: "2024-01-22",
    description: "Backups diários realizados com sucesso"
  },
  { 
    id: 5, 
    category: "Trabalhista", 
    item: "PAT - Programa de Alimentação", 
    status: "compliant",
    lastCheck: "2024-01-05",
    nextReview: "2024-07-05",
    description: "Cadastro no PAT válido até 12/2024"
  },
  { 
    id: 6, 
    category: "Trabalhista", 
    item: "Vale-Transporte", 
    status: "attention",
    lastCheck: "2024-01-08",
    nextReview: "2024-02-08",
    description: "3 colaboradores pendentes de atualização cadastral"
  },
];

const securityEvents = [
  { type: "login_success", count: 1245, trend: "+5%" },
  { type: "login_failed", count: 23, trend: "-12%" },
  { type: "password_reset", count: 15, trend: "+2%" },
  { type: "permission_change", count: 8, trend: "0%" },
  { type: "data_export", count: 42, trend: "+18%" },
  { type: "config_change", count: 6, trend: "-3%" },
];

const Audit = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [activeTab, setActiveTab] = useState("logs");
  const [selectedAction, setSelectedAction] = useState("all");

  const filteredLogs = auditLogs.filter(log => 
    (selectedAction === "all" || log.action === selectedAction) &&
    (log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.details.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case "LOGIN": return <User className="h-4 w-4" />;
      case "LOGIN_FAILED": return <AlertTriangle className="h-4 w-4" />;
      case "UPDATE": return <RefreshCw className="h-4 w-4" />;
      case "CREATE": return <FileText className="h-4 w-4" />;
      case "DELETE": return <AlertTriangle className="h-4 w-4" />;
      case "EXPORT": return <Download className="h-4 w-4" />;
      case "CONFIG_CHANGE": return <Settings className="h-4 w-4" />;
      case "PERMISSION_CHANGE": return <Lock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "text-success";
      case "warning": return "text-warning";
      case "error": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getComplianceStatusBadge = (status: string) => {
    switch (status) {
      case "compliant": return <Badge className="bg-success/10 text-success border-success/20">Conforme</Badge>;
      case "attention": return <Badge className="bg-warning/10 text-warning border-warning/20">Atenção</Badge>;
      case "non_compliant": return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Não Conforme</Badge>;
      default: return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Auditoria</h1>
            <p className="text-muted-foreground mt-1">Logs de atividades e conformidade do sistema</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Security Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {securityEvents.map((event, index) => (
            <Card key={index} className="p-4 card-elevated">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{event.count}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {event.type.replace(/_/g, " ")}
                </p>
                <p className={`text-xs mt-1 ${event.trend.startsWith("+") ? "text-success" : event.trend.startsWith("-") ? "text-destructive" : "text-muted-foreground"}`}>
                  {event.trend}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="logs" className="gap-2 data-[state=active]:bg-background">
              <Activity className="h-4 w-4" />
              Logs de Atividade
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2 data-[state=active]:bg-background">
              <Shield className="h-4 w-4" />
              Conformidade
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-background">
              <Lock className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="p-6 card-elevated">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por usuário, recurso ou ação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tipo de ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGIN_FAILED">Login Falho</SelectItem>
                    <SelectItem value="CREATE">Criação</SelectItem>
                    <SelectItem value="UPDATE">Atualização</SelectItem>
                    <SelectItem value="DELETE">Exclusão</SelectItem>
                    <SelectItem value="EXPORT">Exportação</SelectItem>
                    <SelectItem value="CONFIG_CHANGE">Config</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ação</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Data/Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${getStatusColor(log.status)}`}>
                            {getActionIcon(log.action)}
                            <span className="font-medium text-xs">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{log.user}</TableCell>
                        <TableCell className="text-muted-foreground">{log.resource}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {log.details}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(log.timestamp).toLocaleString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="p-6 card-elevated text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">4</p>
                <p className="text-sm text-muted-foreground">Itens Conformes</p>
              </Card>
              <Card className="p-6 card-elevated text-center">
                <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">2</p>
                <p className="text-sm text-muted-foreground">Requerem Atenção</p>
              </Card>
              <Card className="p-6 card-elevated text-center">
                <Clock className="h-12 w-12 text-info mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">3</p>
                <p className="text-sm text-muted-foreground">Revisões Pendentes</p>
              </Card>
            </div>

            <Card className="p-6 card-elevated">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Checklist de Conformidade</h3>
                <p className="text-sm text-muted-foreground">Status dos requisitos regulatórios e de segurança</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Verificação</TableHead>
                    <TableHead>Próxima Revisão</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>{getComplianceStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.lastCheck).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.nextReview).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[250px]">
                        {item.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 card-elevated">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Políticas de Segurança</h3>
                  <p className="text-sm text-muted-foreground">Configurações atuais do sistema</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium text-foreground">Senha Complexa</p>
                        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, letras e números</p>
                      </div>
                    </div>
                    <Badge className="bg-success/10 text-success">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium text-foreground">Autenticação 2FA</p>
                        <p className="text-xs text-muted-foreground">Obrigatório para administradores</p>
                      </div>
                    </div>
                    <Badge className="bg-success/10 text-success">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium text-foreground">Timeout de Sessão</p>
                        <p className="text-xs text-muted-foreground">30 minutos de inatividade</p>
                      </div>
                    </div>
                    <Badge className="bg-success/10 text-success">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium text-foreground">Criptografia de Dados</p>
                        <p className="text-xs text-muted-foreground">AES-256 em repouso e TLS em trânsito</p>
                      </div>
                    </div>
                    <Badge className="bg-success/10 text-success">Ativo</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6 card-elevated">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Alertas Recentes</h3>
                  <p className="text-sm text-muted-foreground">Eventos de segurança importantes</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Tentativa de login suspeita</p>
                      <p className="text-xs text-muted-foreground mt-1">IP 45.33.22.11 - 3 tentativas falhas</p>
                      <p className="text-xs text-muted-foreground">Há 2 horas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/5 border border-warning/10">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Política de senha alterada</p>
                      <p className="text-xs text-muted-foreground mt-1">Por admin@benefitos.com</p>
                      <p className="text-xs text-muted-foreground">Há 4 horas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/10">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Backup concluído com sucesso</p>
                      <p className="text-xs text-muted-foreground mt-1">Backup automático diário</p>
                      <p className="text-xs text-muted-foreground">Há 6 horas</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Audit;
