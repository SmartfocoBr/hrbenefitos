import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useConnectorExecutions(connectorId?: string) {
  return useQuery({
    queryKey: ["connector-executions", connectorId],
    queryFn: async () => {
      let query = supabase
        .from("connector_executions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);

      if (connectorId) {
        query = query.eq("connector_id", connectorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
