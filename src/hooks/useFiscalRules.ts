import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";

export interface FiscalRule {
  id: string;
  tenant_id: string;
  benefit_id: string | null;
  contract_type: string | null;
  tax_treatment: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useFiscalRules() {
  const { activeTenant } = useTenant();
  const queryClient = useQueryClient();
  const tenantId = activeTenant?.id;

  const query = useQuery({
    queryKey: ["fiscal_rules", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fiscal_rules" as any)
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as FiscalRule[];
    },
    enabled: !!tenantId,
  });

  const create = useMutation({
    mutationFn: async (rule: Partial<FiscalRule>) => {
      const { data, error } = await supabase
        .from("fiscal_rules" as any)
        .insert({ ...rule, tenant_id: tenantId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal_rules", tenantId] });
      toast.success("Regra fiscal criada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FiscalRule> & { id: string }) => {
      const { data, error } = await supabase
        .from("fiscal_rules" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal_rules", tenantId] });
      toast.success("Regra fiscal atualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fiscal_rules" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal_rules", tenantId] });
      toast.success("Regra fiscal removida");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { ...query, create, update, remove };
}
