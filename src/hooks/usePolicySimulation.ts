import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SimulationResult {
  eligible: boolean;
  reasons: string[];
  computed_limits: Record<string, number>;
  metadata: {
    policy_id: string;
    policy_name: string;
    policy_version: number;
    employee_id: string;
    evaluated_at: string;
  };
}

export function usePolicySimulation() {
  const evaluate = useMutation({
    mutationFn: async ({
      policy_id,
      employee_id,
      context = {},
    }: {
      policy_id: string;
      employee_id: string;
      context?: Record<string, unknown>;
    }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/policy-engine/evaluate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ policy_id, employee_id, context }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Evaluation failed");
      }
      return (await res.json()) as SimulationResult;
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const simulate = useMutation({
    mutationFn: async ({
      policy_id,
      employee_id,
      context = {},
    }: {
      policy_id: string;
      employee_id: string;
      context?: Record<string, unknown>;
    }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/policy-engine/simulate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ policy_id, employee_id, context }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Simulation failed");
      }
      return (await res.json()) as SimulationResult;
    },
    onSuccess: () => toast.success("Simulação concluída e salva"),
    onError: (err: Error) => toast.error(err.message),
  });

  return { evaluate, simulate };
}
