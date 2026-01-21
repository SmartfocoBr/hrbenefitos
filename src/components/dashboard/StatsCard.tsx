import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
}

const StatsCard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-accent",
  description,
}: StatsCardProps) => {
  return (
    <motion.div
      className="stats-card group"
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
        </div>
        <motion.div 
          className={cn("p-3 rounded-xl bg-muted/50 group-hover:bg-accent/10 transition-colors", iconColor)}
          whileHover={{ rotate: 12, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        {change && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "text-sm font-medium px-2 py-0.5 rounded-md",
              changeType === "positive" && "text-success bg-success/10",
              changeType === "negative" && "text-destructive bg-destructive/10",
              changeType === "neutral" && "text-muted-foreground bg-muted"
            )}
          >
            {change}
          </motion.span>
        )}
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
