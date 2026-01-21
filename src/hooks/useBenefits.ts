import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface Benefit {
  id: string;
  name: string;
  description: string | null;
  category: "alimentacao" | "saude" | "transporte" | "bemestar" | "financeiro" | "outros";
  icon: string | null;
  provider: string | null;
  is_taxable: boolean;
  tax_percentage: number;
  legal_basis: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyBenefitPolicy {
  id: string;
  company_id: string;
  benefit_id: string;
  is_enabled: boolean;
  monthly_limit: number | null;
  eligibility_rules: any;
  contract_types: string[];
  min_tenure_days: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useBenefits() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [policies, setPolicies] = useState<CompanyBenefitPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBenefits = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("benefits")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;
      setBenefits(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching benefits:", err);
      setError("Erro ao carregar benefícios");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("company_benefit_policies")
        .select("*");

      if (fetchError) throw fetchError;
      setPolicies(data || []);
    } catch (err) {
      console.error("Error fetching policies:", err);
    }
  }, []);

  useEffect(() => {
    fetchBenefits();
    fetchPolicies();

    // Realtime subscription
    const channel: RealtimeChannel = supabase
      .channel("benefits-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "benefits" },
        () => {
          fetchBenefits();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_benefit_policies" },
        () => {
          fetchPolicies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBenefits, fetchPolicies]);

  const stats = {
    total: benefits.length,
    active: benefits.filter((b) => b.is_active).length,
    byCategory: {
      alimentacao: benefits.filter((b) => b.category === "alimentacao").length,
      saude: benefits.filter((b) => b.category === "saude").length,
      transporte: benefits.filter((b) => b.category === "transporte").length,
      bemestar: benefits.filter((b) => b.category === "bemestar").length,
      financeiro: benefits.filter((b) => b.category === "financeiro").length,
      outros: benefits.filter((b) => b.category === "outros").length,
    },
    taxable: benefits.filter((b) => b.is_taxable).length,
    nonTaxable: benefits.filter((b) => !b.is_taxable).length,
  };

  const categoryConfig: Record<string, { label: string; color: string }> = {
    alimentacao: { label: "Alimentação", color: "hsl(188 94% 43%)" },
    saude: { label: "Saúde", color: "hsl(222 47% 25%)" },
    transporte: { label: "Transporte", color: "hsl(142 76% 36%)" },
    bemestar: { label: "Bem-estar", color: "hsl(38 92% 50%)" },
    financeiro: { label: "Financeiro", color: "hsl(280 65% 60%)" },
    outros: { label: "Outros", color: "hsl(0 84% 60%)" },
  };

  return {
    benefits,
    policies,
    stats,
    categoryConfig,
    isLoading,
    error,
    refetch: fetchBenefits,
  };
}
