import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";

export interface Role {
  id: string;
  tenant_id: string | null;
  name: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface RoleAssignment {
  id: string;
  subject_type: string;
  subject_id: string;
  role_id: string;
  scope: Record<string, unknown> | null;
  created_at: string;
}

export function useRoles() {
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", activeTenantId],
    queryFn: async (): Promise<Role[]> => {
      const query = supabase.from("roles").select("*");

      if (activeTenantId) {
        query.or(`tenant_id.is.null,tenant_id.eq.${activeTenantId}`);
      }

      const { data, error } = await query.order("name");
      if (error) throw error;
      return (data || []).map((r) => ({
        ...r,
        tenant_id: r.tenant_id ?? null,
        permissions: Array.isArray(r.permissions) ? (r.permissions as unknown as string[]) : [],
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["role-assignments", activeTenantId],
    queryFn: async (): Promise<RoleAssignment[]> => {
      const { data, error } = await supabase
        .from("role_assignments")
        .select("*");
      if (error) throw error;
      return (data || []).map((d) => ({
        ...d,
        scope: (d.scope as Record<string, unknown> | null) ?? null,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const createRole = useMutation({
    mutationFn: async (role: { name: string; permissions: string[]; tenant_id?: string | null }) => {
      const { data, error } = await supabase
        .from("roles")
        .insert({
          name: role.name,
          permissions: role.permissions as unknown as import("@/integrations/supabase/types").Json,
          tenant_id: role.tenant_id ?? activeTenantId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; permissions?: string[] }) => {
      const updateData: { name?: string; permissions?: import("@/integrations/supabase/types").Json } = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.permissions) updateData.permissions = updates.permissions as unknown as import("@/integrations/supabase/types").Json;

      const { data, error } = await supabase
        .from("roles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const assignRole = useMutation({
    mutationFn: async (assignment: { subject_type: string; subject_id: string; role_id: string; scope?: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from("role_assignments")
        .insert({
          subject_type: assignment.subject_type,
          subject_id: assignment.subject_id,
          role_id: assignment.role_id,
          scope: assignment.scope as import("@/integrations/supabase/types").Json ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role-assignments"] }),
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("role_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role-assignments"] }),
  });

  return {
    roles,
    assignments,
    rolesLoading,
    assignmentsLoading,
    createRole,
    updateRole,
    assignRole,
    deleteAssignment,
  };
}
