import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGlobalDLQ(tenantId?: string, source?: string) {
  return useQuery({
    queryKey: ["global-dlq", tenantId, source],
    queryFn: async () => {
      let query = supabase
        .from("dlq")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (source) query = query.eq("source", source);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useDLQActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const callDLQAction = async (
    action: string,
    body: Record<string, unknown>
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dlq-operations?action=${action}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || "Action failed");
    }
    return resp.json();
  };

  const reprocess = useMutation({
    mutationFn: ({ dlq_id, payload_overrides }: { dlq_id: string; payload_overrides?: Record<string, unknown> }) =>
      callDLQAction("reprocess", { dlq_id, payload_overrides }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-dlq"] });
      queryClient.invalidateQueries({ queryKey: ["reprocess-jobs"] });
      toast({ title: "Item reenfileirado com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao reprocessar", description: err.message, variant: "destructive" });
    },
  });

  const skip = useMutation({
    mutationFn: (dlq_id: string) => callDLQAction("skip", { dlq_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-dlq"] });
      toast({ title: "Item marcado como ignorado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deleteDLQ = useMutation({
    mutationFn: (dlq_id: string) => callDLQAction("delete", { dlq_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-dlq"] });
      toast({ title: "Item removido da DLQ" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return { reprocess, skip, deleteDLQ };
}
