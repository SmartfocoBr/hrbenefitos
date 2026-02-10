import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConnectorHealth(connectorId?: string) {
  return useQuery({
    queryKey: ["connector-health", connectorId],
    queryFn: async () => {
      let query = supabase
        .from("connector_health")
        .select("*, connectors(name, connector_type)")
        .order("last_check", { ascending: false });

      if (connectorId) {
        query = query.eq("connector_id", connectorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
}
