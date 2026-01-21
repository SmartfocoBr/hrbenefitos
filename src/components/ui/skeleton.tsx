import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted relative overflow-hidden",
        className
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          translateX: ["−100%", "100%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Card skeleton for stats/metric cards
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 rounded-xl bg-card border border-border", className)}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-8" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full mt-2" />
      </div>
    </div>
  );
}

// Simple metric skeleton
function SkeletonMetric({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 rounded-xl bg-card border border-border", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

// Text line skeleton
function SkeletonText({ 
  lines = 3, 
  className 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

// Avatar skeleton
function SkeletonAvatar({ 
  size = "md", 
  className 
}: { 
  size?: "sm" | "md" | "lg"; 
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  return <Skeleton className={cn("rounded-full", sizes[size], className)} />;
}

// List item skeleton
function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  );
}

// Chart skeleton
function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 rounded-xl bg-card border border-border", className)}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="flex items-end justify-between h-48 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-muted rounded-t-md"
            initial={{ height: "20%" }}
            animate={{ height: `${30 + Math.random() * 50}%` }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Activity feed skeleton
function SkeletonActivityFeed({ 
  items = 5, 
  className 
}: { 
  items?: number; 
  className?: string;
}) {
  return (
    <div className={cn("p-6 rounded-xl bg-card border border-border space-y-4", className)}>
      <Skeleton className="h-6 w-32 mb-4" />
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          className="flex items-start gap-3"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.15,
          }}
        >
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-3 w-16" />
        </motion.div>
      ))}
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonMetric, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonListItem,
  SkeletonChart,
  SkeletonActivityFeed,
};
