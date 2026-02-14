import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useReconciliations(tenantId?: string) {
  const queryClient = useQueryClient();

  const reconciliationsQuery = useQuery({
    queryKey: ["reconciliations", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reconciliations")
        .select("*, supplier_providers(name)")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const generateReport = useMutation({
    mutationFn: async (params: { supplier_id: string; tenant_id: string; period_start: string; period_end: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-reconciliation-report", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Relatório de conciliação gerado");
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao gerar relatório: ${err.message}`);
    },
  });

  return { ...reconciliationsQuery, generateReport };
}

export function useSupplierBalances(tenantId?: string) {
  return useQuery({
    queryKey: ["supplier-balances", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_balances")
        .select("*, supplier_providers(name, provider_type)")
        .order("last_reported_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useSupplierErrorMap(supplierId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["supplier-error-map", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_error_map")
        .select("*")
        .eq("supplier_id", supplierId!)
        .order("external_code");
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });

  const upsertMapping = useMutation({
    mutationFn: async (mapping: { supplier_id: string; external_code: string; category: string; recommended_action?: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("supplier_error_map")
        .upsert(mapping as any, { onConflict: "supplier_id,external_code" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mapeamento salvo");
      queryClient.invalidateQueries({ queryKey: ["supplier-error-map"] });
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  return { ...query, upsertMapping };
}
