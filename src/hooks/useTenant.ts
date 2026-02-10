import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TENANT_STORAGE_KEY = "benefitos_active_tenant";

export interface Tenant {
  id: string;
  name: string;
  slug: string | null;
  role: string;
  is_active: boolean;
}

export function useTenant() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTenantId, setActiveTenantId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TENANT_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["user-tenants", user?.id],
    queryFn: async (): Promise<Tenant[]> => {
      if (!user) return [];

      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("company_id, role, is_active")
        .eq("user_id", user.id)
        .not("company_id", "is", null);

      if (error) throw error;
      if (!roles || roles.length === 0) return [];

      const companyIds = roles.map((r) => r.company_id).filter(Boolean) as string[];
      const { data: companies, error: compError } = await supabase
        .from("companies")
        .select("id, name, slug")
        .in("id", companyIds);

      if (compError) throw compError;

      return (companies || []).map((c) => {
        const role = roles.find((r) => r.company_id === c.id);
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          role: role?.role || "employee",
          is_active: role?.is_active ?? true,
        };
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select first tenant if none selected
  useEffect(() => {
    if (!activeTenantId && tenants.length > 0) {
      setActiveTenantId(tenants[0].id);
      localStorage.setItem(TENANT_STORAGE_KEY, tenants[0].id);
    }
  }, [tenants, activeTenantId]);

  const switchTenant = useCallback(
    (tenantId: string) => {
      setActiveTenantId(tenantId);
      localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
      // Invalidate all tenant-scoped queries
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0] || null;

  return { tenants, activeTenant, activeTenantId, switchTenant, isLoading };
}
