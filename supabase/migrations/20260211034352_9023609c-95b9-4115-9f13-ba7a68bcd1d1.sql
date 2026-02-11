
-- 1. wallets: canonical wallet per employee+tenant
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL DEFAULT 'benefits-wallet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, employee_id, wallet_type)
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to wallets" ON public.wallets FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Company admins can manage wallets" ON public.wallets FOR ALL USING (is_company_admin(tenant_id)) WITH CHECK (is_company_admin(tenant_id));
CREATE POLICY "Employees can view own wallet" ON public.wallets FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. wallet_balances: per-currency balance with validity windows
CREATE TABLE public.wallet_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'BRL',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  available_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  reserved_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_balances_wallet_id ON public.wallet_balances(wallet_id);

ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to wallet_balances" ON public.wallet_balances FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Company admins can manage wallet_balances" ON public.wallet_balances FOR ALL USING (wallet_id IN (SELECT w.id FROM public.wallets w WHERE is_company_admin(w.tenant_id))) WITH CHECK (wallet_id IN (SELECT w.id FROM public.wallets w WHERE is_company_admin(w.tenant_id)));
CREATE POLICY "Employees can view own balances" ON public.wallet_balances FOR SELECT USING (wallet_id IN (SELECT w.id FROM public.wallets w JOIN public.employees e ON e.id = w.employee_id WHERE e.user_id = auth.uid()));

CREATE TRIGGER update_wallet_balances_updated_at BEFORE UPDATE ON public.wallet_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. wallet_ledger (transactions): full ledger for the new wallets schema
CREATE TABLE public.wallet_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('allocation','adjustment','settlement')),
  provider_tx_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_wallet_ledger_wallet_id ON public.wallet_ledger(wallet_id);

ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to wallet_ledger" ON public.wallet_ledger FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Company admins can manage wallet_ledger" ON public.wallet_ledger FOR ALL USING (wallet_id IN (SELECT w.id FROM public.wallets w WHERE is_company_admin(w.tenant_id))) WITH CHECK (wallet_id IN (SELECT w.id FROM public.wallets w WHERE is_company_admin(w.tenant_id)));
CREATE POLICY "Employees can view own ledger" ON public.wallet_ledger FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
CREATE POLICY "Deny client deletes to wallet_ledger" ON public.wallet_ledger FOR DELETE USING (false);
CREATE POLICY "Deny client updates to wallet_ledger" ON public.wallet_ledger FOR UPDATE USING (false);

-- 4. ledger_allocations: allocation breakdown per transaction
CREATE TABLE public.ledger_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.wallet_ledger(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES public.policies(id) ON DELETE SET NULL,
  allocation_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ledger_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to ledger_allocations" ON public.ledger_allocations FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Company admins can manage ledger_allocations" ON public.ledger_allocations FOR ALL USING (transaction_id IN (SELECT wl.id FROM public.wallet_ledger wl JOIN public.wallets w ON w.id = wl.wallet_id WHERE is_company_admin(w.tenant_id))) WITH CHECK (transaction_id IN (SELECT wl.id FROM public.wallet_ledger wl JOIN public.wallets w ON w.id = wl.wallet_id WHERE is_company_admin(w.tenant_id)));
CREATE POLICY "Employees can view own allocations" ON public.ledger_allocations FOR SELECT USING (transaction_id IN (SELECT wl.id FROM public.wallet_ledger wl WHERE wl.employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())));

-- 5. allocation_limits: policy-driven spending limits
CREATE TABLE public.allocation_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  cost_center TEXT,
  role TEXT,
  max_amount NUMERIC NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly','yearly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.allocation_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to allocation_limits" ON public.allocation_limits FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Company admins can manage allocation_limits" ON public.allocation_limits FOR ALL USING (policy_id IN (SELECT p.id FROM public.policies p WHERE is_company_admin(p.tenant_id))) WITH CHECK (policy_id IN (SELECT p.id FROM public.policies p WHERE is_company_admin(p.tenant_id)));
CREATE POLICY "Tenant members can view allocation_limits" ON public.allocation_limits FOR SELECT USING (policy_id IN (SELECT p.id FROM public.policies p WHERE p.tenant_id IN (SELECT ur.company_id FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL)));
