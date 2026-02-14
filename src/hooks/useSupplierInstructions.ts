import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useSupplierInstructions(tenantId?: string, supplierId?: string) {
  const queryClient = useQueryClient();

  const instructionsQuery = useQuery({
    queryKey: ["supplier-instructions", tenantId, supplierId],
    queryFn: async () => {
      let query = supabase
        .from("supplier_instructions")
        .select("*, supplier_providers(name, provider_type)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (supplierId) query = query.eq("supplier_id", supplierId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const sendInstruction = useMutation({
    mutationFn: async (instructionId: string) => {
      const { data, error } = await supabase.functions.invoke("send-instruction", {
        body: { instruction_id: instructionId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Instrução enviada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["supplier-instructions"] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao enviar instrução: ${err.message}`);
    },
  });

  const createInstruction = useMutation({
    mutationFn: async (params: { supplier_id: string; tenant_id: string; transaction_id?: string; payload?: Record<string, unknown> }) => {
      const { data, error } = await supabase.rpc("create_supplier_instruction", {
        p_supplier_id: params.supplier_id,
        p_tenant_id: params.tenant_id,
        p_transaction_id: params.transaction_id ?? null,
        p_payload: (params.payload ?? {}) as any,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Instrução criada");
      queryClient.invalidateQueries({ queryKey: ["supplier-instructions"] });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao criar instrução: ${err.message}`);
    },
  });

  return { ...instructionsQuery, sendInstruction, createInstruction };
}
