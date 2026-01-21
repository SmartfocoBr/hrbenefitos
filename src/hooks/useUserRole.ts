import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  company_admin: "Administrador",
  hr_manager: "Gestor RH",
  employee: "Colaborador",
};

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLabel, setRoleLabel] = useState<string>("Carregando...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setRole(null);
        setRoleLabel("Colaborador");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRole("employee");
          setRoleLabel("Colaborador");
        } else if (data) {
          setRole(data.role);
          setRoleLabel(ROLE_LABELS[data.role] || data.role);
        } else {
          setRole("employee");
          setRoleLabel("Colaborador");
        }
      } catch (err) {
        console.error("Failed to fetch user role:", err);
        setRole("employee");
        setRoleLabel("Colaborador");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  return { role, roleLabel, isLoading };
}
