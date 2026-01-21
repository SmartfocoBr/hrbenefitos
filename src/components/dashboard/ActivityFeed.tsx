import { UserPlus, FileText, AlertTriangle, CheckCircle, RefreshCw, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "onboarding" | "policy" | "alert" | "success" | "sync" | "benefit";
  title: string;
  description: string;
  time: string;
  user?: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "onboarding",
    title: "Novo colaborador cadastrado",
    description: "Maria Silva foi adicionada à empresa TechCorp",
    time: "2 min",
    user: "RH Admin",
  },
  {
    id: "2",
    type: "sync",
    title: "Sincronização ERP concluída",
    description: "TOTVS Protheus - 1.247 registros atualizados",
    time: "15 min",
  },
  {
    id: "3",
    type: "benefit",
    title: "Benefício ativado",
    description: "Vale Refeição liberado para 23 colaboradores",
    time: "32 min",
    user: "Sistema",
  },
  {
    id: "4",
    type: "alert",
    title: "Atenção: Vencimento próximo",
    description: "12 colaboradores com cartões expirando em 7 dias",
    time: "1h",
  },
  {
    id: "5",
    type: "success",
    title: "Conciliação finalizada",
    description: "Fatura VR do mês de Janeiro aprovada",
    time: "2h",
    user: "Financeiro",
  },
  {
    id: "6",
    type: "policy",
    title: "Política atualizada",
    description: "Regra de elegibilidade alterada para PLR",
    time: "3h",
    user: "Admin",
  },
];

const iconMap = {
  onboarding: UserPlus,
  policy: FileText,
  alert: AlertTriangle,
  success: CheckCircle,
  sync: RefreshCw,
  benefit: Gift,
};

const colorMap = {
  onboarding: "text-info bg-info/10",
  policy: "text-accent bg-accent/10",
  alert: "text-warning bg-warning/10",
  success: "text-success bg-success/10",
  sync: "text-muted-foreground bg-muted",
  benefit: "text-accent bg-accent/10",
};

const ActivityFeed = () => {
  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Atividades Recentes</h3>
          <p className="text-sm text-muted-foreground">Últimas ações do sistema</p>
        </div>
        <button className="text-sm text-accent hover:text-accent/80 font-medium transition-colors">
          Ver todas
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          const colorClass = colorMap[activity.type];

          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in-up",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn("p-2 rounded-lg flex-shrink-0", colorClass)}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.time} atrás</span>
                  {activity.user && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-xs text-muted-foreground">{activity.user}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
