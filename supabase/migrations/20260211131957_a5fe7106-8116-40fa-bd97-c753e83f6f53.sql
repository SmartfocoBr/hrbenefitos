
-- Task 26: Tighten wallet RLS policies

-- 1. wallet_ledger: deny client inserts (only service_role / edge functions)
CREATE POLICY "Deny client inserts to wallet_ledger"
  ON public.wallet_ledger
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 2. wallet_balances: deny client inserts
CREATE POLICY "Deny client inserts to wallet_balances"
  ON public.wallet_balances
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 3. wallet_balances: deny client updates
CREATE POLICY "Deny client updates to wallet_balances"
  ON public.wallet_balances
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (false);

-- 4. wallet_balances: deny client deletes
CREATE POLICY "Deny client deletes to wallet_balances"
  ON public.wallet_balances
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (false);

-- 5. ledger_allocations: deny client inserts
CREATE POLICY "Deny client inserts to ledger_allocations"
  ON public.ledger_allocations
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- 6. ledger_allocations: deny client updates
CREATE POLICY "Deny client updates to ledger_allocations"
  ON public.ledger_allocations
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (false);

-- 7. ledger_allocations: deny client deletes
CREATE POLICY "Deny client deletes to ledger_allocations"
  ON public.ledger_allocations
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (false);
