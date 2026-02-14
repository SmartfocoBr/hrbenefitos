import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SystemLogFilters {
  service?: string;
  level?: string;
  search?: string;
  tenantId?: string;
  limit?: number;
}

export function useSystemLogs(filters: SystemLogFilters = {}) {
  return useQuery({
    queryKey: ["system-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 200);

      if (filters.tenantId) query = query.eq("tenant_id", filters.tenantId);
      if (filters.service) query = query.eq("service", filters.service);
      if (filters.level) query = query.eq("level", filters.level);
      if (filters.search) query = query.ilike("message", `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
}
