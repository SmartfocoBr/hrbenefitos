import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useConnectorDLQ(connectorId?: string) {
  return useQuery({
    queryKey: ["connector-dlq", connectorId],
    queryFn: async () => {
      let query = supabase
        .from("connector_dlq")
        .select("*, connectors(name, connector_type)")
        .order("created_at", { ascending: false })
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

export function useReprocessDLQ() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ dlq_id, payload_overrides }: { dlq_id: string; payload_overrides?: Record<string, unknown> }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dlq-reprocess`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ dlq_id, payload_overrides }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Reprocess failed");
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connector-dlq"] });
      queryClient.invalidateQueries({ queryKey: ["connector-executions"] });
      toast({ title: "Item reenfileirado com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao reprocessar", description: err.message, variant: "destructive" });
    },
  });
}
