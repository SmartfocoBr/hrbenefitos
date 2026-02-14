import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSupplierProviders(tenantId?: string) {
  return useQuery({
    queryKey: ["supplier-providers", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("supplier_providers")
        .select("*")
        .order("name");

      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}
