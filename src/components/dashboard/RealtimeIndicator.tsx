import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

interface RealtimeIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export function RealtimeIndicator({ isConnected, className }: RealtimeIndicatorProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-normal transition-colors",
        isConnected
          ? "bg-green-500/10 text-green-600 border-green-500/20"
          : "bg-amber-500/10 text-amber-600 border-amber-500/20",
        className
      )}
    >
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <Wifi className="h-3 w-3" />
          Realtime
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Conectando...
        </>
      )}
    </Badge>
  );
}
