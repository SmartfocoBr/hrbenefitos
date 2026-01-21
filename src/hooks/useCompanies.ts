import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  segment: string | null;
  status: "active" | "inactive" | "pending";
  monthly_budget: number;
  monthly_spent: number;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CostCenter {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  budget: number;
  spent: number;
  manager_name: string | null;
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("companies")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;
      setCompanies(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching companies:", err);
      setError("Erro ao carregar empresas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCostCenters = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("cost_centers")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;
      setCostCenters(data || []);
    } catch (err) {
      console.error("Error fetching cost centers:", err);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchCostCenters();

    // Realtime subscription
    const channel: RealtimeChannel = supabase
      .channel("companies-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "companies" },
        () => {
          fetchCompanies();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cost_centers" },
        () => {
          fetchCostCenters();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCompanies, fetchCostCenters]);

  const stats = {
    total: companies.length,
    active: companies.filter((c) => c.status === "active").length,
    inactive: companies.filter((c) => c.status === "inactive").length,
    pending: companies.filter((c) => c.status === "pending").length,
    totalBudget: companies.reduce((sum, c) => sum + Number(c.monthly_budget || 0), 0),
    totalSpent: companies.reduce((sum, c) => sum + Number(c.monthly_spent || 0), 0),
    totalEmployees: 0, // Will be calculated when employees are fetched
  };

  return {
    companies,
    costCenters,
    stats,
    isLoading,
    error,
    refetch: fetchCompanies,
  };
}
