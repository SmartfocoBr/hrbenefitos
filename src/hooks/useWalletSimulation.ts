import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const allocationItemSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive("Valor deve ser positivo"),
  tax_percentage: z.number().min(0).max(100).optional(),
});

export const simulationInputSchema = z.object({
  wallet_id: z.string().uuid("ID de carteira inválido"),
  allocation_json: z.array(allocationItemSchema).min(1, "Pelo menos uma alocação é necessária"),
  context: z.record(z.unknown()).optional(),
});

export type SimulationInput = z.infer<typeof simulationInputSchema>;

export interface SimulationResult {
  valid: boolean;
  wallet_id: string;
  currency: string;
  available_before: number;
  total_requested: number;
  total_tax: number;
  total_net: number;
  remaining_after: number;
  breakdown: {
    category: string;
    amount: number;
    tax_percentage: number;
    tax_amount: number;
    net_amount: number;
  }[];
  violations: {
    category: string;
    requested: number;
    max_allowed: number;
    message: string;
  }[];
  insufficient_funds: boolean;
  simulated_at: string;
}

export function useWalletSimulation() {
  return useMutation({
    mutationFn: async (input: SimulationInput): Promise<SimulationResult> => {
      const validated = simulationInputSchema.parse(input);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-operations/simulate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            wallet_id: validated.wallet_id,
            allocation_json: validated.allocation_json,
            context: validated.context ?? {},
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      return res.json();
    },
  });
}
