import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface DashboardMetrics {
  totalCompanies: number;
  activeCompanies: number;
  totalEmployees: number;
  activeEmployees: number;
  totalBenefits: number;
  activeBenefits: number;
  totalWalletBalance: number;
  totalTransactionsToday: number;
  monthlyBudget: number;
  monthlySpent: number;
  averageCostPerEmployee: number;
  utilizationRate: number;
}

export interface RealtimeActivity {
  id: string;
  type: "employee" | "wallet" | "transaction" | "company";
  action: "INSERT" | "UPDATE" | "DELETE";
  description: string;
  timestamp: Date;
  data?: any;
}

const initialMetrics: DashboardMetrics = {
  totalCompanies: 0,
  activeCompanies: 0,
  totalEmployees: 0,
  activeEmployees: 0,
  totalBenefits: 0,
  activeBenefits: 0,
  totalWalletBalance: 0,
  totalTransactionsToday: 0,
  monthlyBudget: 0,
  monthlySpent: 0,
  averageCostPerEmployee: 0,
  utilizationRate: 0,
};

export function useRealtimeDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      // Fetch companies stats
      const { data: companies, error: companiesError } = await supabase
        .from("companies")
        .select("id, status, monthly_budget, monthly_spent");

      if (companiesError) throw companiesError;

      // Fetch employees stats
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("id, status, salary");

      if (employeesError) throw employeesError;

      // Fetch benefits stats
      const { data: benefits, error: benefitsError } = await supabase
        .from("benefits")
        .select("id, is_active");

      if (benefitsError) throw benefitsError;

      // Fetch wallet stats
      const { data: wallets, error: walletsError } = await supabase
        .from("employee_wallets")
        .select("id, total_balance");

      if (walletsError) throw walletsError;

      // Fetch today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: transactions, error: transactionsError } = await supabase
        .from("wallet_transactions")
        .select("id")
        .gte("created_at", today.toISOString());

      if (transactionsError) throw transactionsError;

      // Calculate metrics
      const totalCompanies = companies?.length || 0;
      const activeCompanies = companies?.filter((c) => c.status === "active").length || 0;
      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter((e) => e.status === "active").length || 0;
      const totalBenefits = benefits?.length || 0;
      const activeBenefits = benefits?.filter((b) => b.is_active).length || 0;
      const totalWalletBalance = wallets?.reduce((sum, w) => sum + (Number(w.total_balance) || 0), 0) || 0;
      const totalTransactionsToday = transactions?.length || 0;
      const monthlyBudget = companies?.reduce((sum, c) => sum + (Number(c.monthly_budget) || 0), 0) || 0;
      const monthlySpent = companies?.reduce((sum, c) => sum + (Number(c.monthly_spent) || 0), 0) || 0;
      const averageCostPerEmployee = activeEmployees > 0 ? monthlySpent / activeEmployees : 0;
      const utilizationRate = monthlyBudget > 0 ? (monthlySpent / monthlyBudget) * 100 : 0;

      setMetrics({
        totalCompanies,
        activeCompanies,
        totalEmployees,
        activeEmployees,
        totalBenefits,
        activeBenefits,
        totalWalletBalance,
        totalTransactionsToday,
        monthlyBudget,
        monthlySpent,
        averageCostPerEmployee,
        utilizationRate,
      });

      setError(null);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError("Erro ao carregar métricas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addActivity = useCallback((activity: Omit<RealtimeActivity, "id" | "timestamp">) => {
    const newActivity: RealtimeActivity = {
      ...activity,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setActivities((prev) => [newActivity, ...prev.slice(0, 49)]); // Keep last 50
  }, []);

  useEffect(() => {
    fetchMetrics();

    // Set up realtime subscriptions
    const channels: RealtimeChannel[] = [];

    // Companies channel
    const companiesChannel = supabase
      .channel("companies-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "companies" },
        (payload) => {
          console.log("Companies change:", payload);
          fetchMetrics();
          addActivity({
            type: "company",
            action: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            description: getActivityDescription("company", payload.eventType, payload.new || payload.old),
            data: payload.new || payload.old,
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        }
      });
    channels.push(companiesChannel);

    // Employees channel
    const employeesChannel = supabase
      .channel("employees-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        (payload) => {
          console.log("Employees change:", payload);
          fetchMetrics();
          addActivity({
            type: "employee",
            action: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            description: getActivityDescription("employee", payload.eventType, payload.new || payload.old),
            data: payload.new || payload.old,
          });
        }
      )
      .subscribe();
    channels.push(employeesChannel);

    // Wallets channel
    const walletsChannel = supabase
      .channel("wallets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employee_wallets" },
        (payload) => {
          console.log("Wallets change:", payload);
          fetchMetrics();
          addActivity({
            type: "wallet",
            action: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            description: getActivityDescription("wallet", payload.eventType, payload.new || payload.old),
            data: payload.new || payload.old,
          });
        }
      )
      .subscribe();
    channels.push(walletsChannel);

    // Transactions channel
    const transactionsChannel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallet_transactions" },
        (payload) => {
          console.log("Transactions change:", payload);
          fetchMetrics();
          addActivity({
            type: "transaction",
            action: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            description: getActivityDescription("transaction", payload.eventType, payload.new || payload.old),
            data: payload.new || payload.old,
          });
        }
      )
      .subscribe();
    channels.push(transactionsChannel);

    // Cleanup
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      setIsConnected(false);
    };
  }, [fetchMetrics, addActivity]);

  return {
    metrics,
    activities,
    isLoading,
    error,
    isConnected,
    refetch: fetchMetrics,
  };
}

function getActivityDescription(
  type: string,
  event: string,
  data: any
): string {
  const actionMap: Record<string, string> = {
    INSERT: "adicionado",
    UPDATE: "atualizado",
    DELETE: "removido",
  };
  const action = actionMap[event] || event;

  switch (type) {
    case "company":
      return `Empresa "${data?.name || "N/A"}" ${action}`;
    case "employee": {
      const name = `${data?.first_name || ""} ${data?.last_name || ""}`.trim() || "N/A";
      return `Colaborador "${name}" ${action}`;
    }
    case "wallet":
      return `Carteira ${action} (Saldo: R$${Number(data?.total_balance || 0).toFixed(2)})`;
    case "transaction":
      return `Transação de R$${Number(data?.amount || 0).toFixed(2)} ${action}`;
    default:
      return `${type} ${action}`;
  }
}
