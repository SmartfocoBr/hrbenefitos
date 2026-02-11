import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface WalletData {
  id: string;
  tenant_id: string;
  employee_id: string;
  wallet_type: string;
  balance: {
    id: string;
    amount: number;
    available_amount: number;
    reserved_amount: number;
    currency: string;
    valid_from: string;
    valid_to: string | null;
  } | null;
  ledger: LedgerEntry[];
}

export interface LedgerEntry {
  id: string;
  amount: number;
  type: string;
  status: string;
  provider_tx_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  processed_at: string | null;
}

export function useWallet(walletId?: string) {
  const { session } = useAuth();

  const walletQuery = useQuery({
    queryKey: ["wallet", walletId],
    enabled: !!walletId && !!session,
    queryFn: async () => {
      const { data: wallet, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", walletId!)
        .single();
      if (error) throw error;

      const { data: balances } = await supabase
        .from("wallet_balances")
        .select("*")
        .eq("wallet_id", walletId!)
        .lte("valid_from", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(1);

      const activeBalance = balances?.find(
        (b) => !b.valid_to || b.valid_to >= new Date().toISOString().split("T")[0]
      ) ?? null;

      const { data: ledger } = await supabase
        .from("wallet_ledger")
        .select("*")
        .eq("wallet_id", walletId!)
        .order("created_at", { ascending: false })
        .limit(20);

      return {
        ...wallet,
        balance: activeBalance,
        ledger: (ledger ?? []) as LedgerEntry[],
      } as WalletData;
    },
  });

  return walletQuery;
}

export function useEmployeeWallets() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["employee-wallets"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select(`
          *,
          employees!inner(first_name, last_name, email, department),
          wallet_balances(id, amount, available_amount, reserved_amount, currency, valid_from, valid_to)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
