import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { SkeletonActivityFeed } from "@/components/ui/skeleton";
import { Building2, Users, Wallet, ArrowRightLeft, Clock } from "lucide-react";
import { RealtimeActivity } from "@/hooks/useRealtimeDashboard";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface RealtimeActivityFeedProps {
  activities: RealtimeActivity[];
  className?: string;
  isLoading?: boolean;
}

const typeConfig = {
  company: { icon: Building2, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  employee: { icon: Users, color: "text-green-500", bgColor: "bg-green-500/10" },
  wallet: { icon: Wallet, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  transaction: { icon: ArrowRightLeft, color: "text-amber-500", bgColor: "bg-amber-500/10" },
};

const actionConfig = {
  INSERT: { label: "Novo", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  UPDATE: { label: "Atualizado", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  DELETE: { label: "Removido", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

export function RealtimeActivityFeed({ activities, className, isLoading }: RealtimeActivityFeedProps) {
  const [, setTick] = useState(0);

  // Update relative times every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <SkeletonActivityFeed items={5} className={className} />;
  }

  if (activities.length === 0) {
    return (
      <motion.div 
        className={cn("card-elevated p-6", className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Atividades em Tempo Real</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <motion.div
            animate={{ 
              rotate: [0, 360],
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            <Clock className="h-12 w-12 mb-3 opacity-30" />
          </motion.div>
          <p className="text-sm">Aguardando atividades...</p>
          <p className="text-xs mt-1">As alterações aparecerão aqui automaticamente</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={cn("card-elevated p-6", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Atividades em Tempo Real</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {activities.length} eventos
        </Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const config = typeConfig[activity.type];
              const actionCfg = actionConfig[activity.action];
              const Icon = config.icon;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25,
                    delay: index * 0.05
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    x: 4,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border border-border/50 transition-colors cursor-pointer",
                    index === 0 && "bg-accent/5 border-accent/20"
                  )}
                >
                  <motion.div 
                    className={cn("p-2 rounded-lg", config.bgColor)}
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn("text-xs", actionCfg.color)}>
                        {actionCfg.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground truncate">{activity.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </ScrollArea>
    </motion.div>
  );
}
