import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface Employee {
  id: string;
  user_id: string | null;
  company_id: string;
  cost_center_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  contract_type: "clt" | "pj" | "intern" | "temp";
  hire_date: string | null;
  salary: number | null;
  work_hours: number;
  status: "active" | "inactive" | "on_leave" | "terminated";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeDependent {
  id: string;
  employee_id: string;
  name: string;
  relationship: string;
  birth_date: string | null;
  cpf: string | null;
  is_active: boolean;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dependents, setDependents] = useState<EmployeeDependent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("employees")
        .select("*")
        .order("first_name");

      if (fetchError) throw fetchError;
      setEmployees(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Erro ao carregar colaboradores");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDependents = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("employee_dependents")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;
      setDependents(data || []);
    } catch (err) {
      console.error("Error fetching dependents:", err);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchDependents();

    // Realtime subscription
    const channel: RealtimeChannel = supabase
      .channel("employees-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        () => {
          fetchEmployees();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_dependents" },
        () => {
          fetchDependents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEmployees, fetchDependents]);

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    inactive: employees.filter((e) => e.status === "inactive").length,
    onLeave: employees.filter((e) => e.status === "on_leave").length,
    terminated: employees.filter((e) => e.status === "terminated").length,
    clt: employees.filter((e) => e.contract_type === "clt").length,
    pj: employees.filter((e) => e.contract_type === "pj").length,
    intern: employees.filter((e) => e.contract_type === "intern").length,
    totalSalary: employees.reduce((sum, e) => sum + Number(e.salary || 0), 0),
    totalDependents: dependents.filter((d) => d.is_active).length,
  };

  return {
    employees,
    dependents,
    stats,
    isLoading,
    error,
    refetch: fetchEmployees,
  };
}
