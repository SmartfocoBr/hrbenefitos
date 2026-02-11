import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";

export interface BenefitCatalogItem {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  benefit_type: string;
  provider_id: string | null;
  params: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBenefitCatalog() {
  const { activeTenant } = useTenant();
  const queryClient = useQueryClient();
  const tenantId = activeTenant?.id;

  const query = useQuery({
    queryKey: ["benefit_catalog", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefit_catalog" as any)
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("name");
      if (error) throw error;
      return data as unknown as BenefitCatalogItem[];
    },
    enabled: !!tenantId,
  });

  const create = useMutation({
    mutationFn: async (item: Partial<BenefitCatalogItem>) => {
      const { data, error } = await supabase
        .from("benefit_catalog" as any)
        .insert({ ...item, tenant_id: tenantId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefit_catalog", tenantId] });
      toast.success("Benefício criado com sucesso");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BenefitCatalogItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("benefit_catalog" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefit_catalog", tenantId] });
      toast.success("Benefício atualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("benefit_catalog" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefit_catalog", tenantId] });
      toast.success("Benefício removido");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { ...query, create, update, remove };
}
