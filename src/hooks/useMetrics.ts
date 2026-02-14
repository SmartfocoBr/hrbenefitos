import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface MetricResult {
  value: number;
  payload: Record<string, unknown>;
}

interface MetricsResponse {
  metrics: Record<string, MetricResult>;
  refreshed_at: string;
}

export function useMetrics(tenantId: string | null) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["metrics", tenantId],
    queryFn: async (): Promise<MetricsResponse> => {
      if (!tenantId) throw new Error("No tenant");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refresh-metrics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tenant_id: tenantId }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to fetch metrics");
      }

      return resp.json();
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 min
  });

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return {
    metrics: data?.metrics ?? null,
    refreshedAt: data?.refreshed_at ?? null,
    isLoading,
    isRefreshing,
    error: error instanceof Error ? error.message : null,
    refresh,
  };
}
