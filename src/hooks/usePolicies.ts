import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";

export interface Policy {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  policy_type: string;
  rules: unknown[];
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyVersion {
  id: string;
  policy_id: string;
  version_number: number;
  rules: unknown[];
  created_by: string | null;
  created_at: string;
}

export function usePolicies() {
  const { activeTenant } = useTenant();
  const queryClient = useQueryClient();
  const tenantId = activeTenant?.id;

  const query = useQuery({
    queryKey: ["policies", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policies" as any)
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Policy[];
    },
    enabled: !!tenantId,
  });

  const create = useMutation({
    mutationFn: async (policy: Partial<Policy>) => {
      const { data, error } = await supabase
        .from("policies" as any)
        .insert({ ...policy, tenant_id: tenantId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies", tenantId] });
      toast.success("Política criada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Policy> & { id: string }) => {
      const { data, error } = await supabase
        .from("policies" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies", tenantId] });
      toast.success("Política atualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("policies" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies", tenantId] });
      toast.success("Política removida");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { ...query, create, update, remove };
}

export function usePolicyVersions(policyId: string | null) {
  return useQuery({
    queryKey: ["policy_versions", policyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("policy_versions" as any)
        .select("*")
        .eq("policy_id", policyId!)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as unknown as PolicyVersion[];
    },
    enabled: !!policyId,
  });
}
