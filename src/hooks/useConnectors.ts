import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useConnectors() {
  return useQuery({
    queryKey: ["connectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connectors")
        .select("*, connector_health(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateConnector() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: {
      name: string;
      connector_type: string;
      tenant_id: string;
      config?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("connectors")
        .insert({ ...values, config: values.config as any })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectors"] });
      toast({ title: "Conector criado com sucesso" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao criar conector", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateConnector() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; name?: string; connector_type?: string; config?: Record<string, unknown>; is_enabled?: boolean }) => {
      const { data, error } = await supabase
        .from("connectors")
        .update({ ...values, config: values.config as any })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectors"] });
      toast({ title: "Conector atualizado" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    },
  });
}
