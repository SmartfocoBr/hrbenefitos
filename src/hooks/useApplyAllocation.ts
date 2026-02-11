import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const applyAllocationSchema = z.object({
  wallet_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  allocation_json: z.array(z.object({
    category: z.string().min(1),
    amount: z.number().positive(),
    tax_percentage: z.number().min(0).max(100).optional(),
  })).min(1),
  policy_id: z.string().uuid().nullable().optional(),
  connector_id: z.string().uuid().nullable().optional(),
});

export type ApplyAllocationInput = z.infer<typeof applyAllocationSchema>;

export interface ApplyAllocationResult {
  transaction_id: string;
  execution_id: string | null;
  status: "pending";
}

export function useApplyAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApplyAllocationInput): Promise<ApplyAllocationResult> => {
      const validated = applyAllocationSchema.parse(input);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-operations/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(validated),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wallet", variables.wallet_id] });
      queryClient.invalidateQueries({ queryKey: ["employee-wallets"] });
    },
  });
}
