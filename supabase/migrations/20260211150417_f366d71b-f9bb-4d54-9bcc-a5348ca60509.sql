
-- supplier_providers
CREATE TABLE public.supplier_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  api_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to supplier_providers" ON public.supplier_providers FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Company admins can manage supplier_providers" ON public.supplier_providers FOR ALL USING (is_company_admin(tenant_id)) WITH CHECK (is_company_admin(tenant_id));
CREATE POLICY "Tenant members can view supplier_providers" ON public.supplier_providers FOR SELECT USING (
  tenant_id IN (SELECT ur.company_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL)
);

-- supplier_instructions
CREATE TABLE public.supplier_instructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id),
  supplier_id UUID NOT NULL REFERENCES public.supplier_providers(id),
  transaction_id UUID REFERENCES public.wallet_ledger(id),
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_response JSONB DEFAULT '{}'::jsonb,
  provider_tx_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
ALTER TABLE public.supplier_instructions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_supplier_instructions_status_supplier ON public.supplier_instructions(status, supplier_id);

CREATE POLICY "Deny anon access to supplier_instructions" ON public.supplier_instructions FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Company admins can manage supplier_instructions" ON public.supplier_instructions FOR ALL USING (is_company_admin(tenant_id)) WITH CHECK (is_company_admin(tenant_id));
CREATE POLICY "Deny client deletes to supplier_instructions" ON public.supplier_instructions FOR DELETE USING (false);
CREATE POLICY "Deny client inserts to supplier_instructions" ON public.supplier_instructions FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny client updates to supplier_instructions" ON public.supplier_instructions FOR UPDATE USING (false);

-- supplier_balances
CREATE TABLE public.supplier_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.supplier_providers(id),
  reported_balance NUMERIC NOT NULL DEFAULT 0,
  last_reported_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to supplier_balances" ON public.supplier_balances FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Company admins can view supplier_balances" ON public.supplier_balances FOR SELECT USING (
  supplier_id IN (SELECT sp.id FROM supplier_providers sp WHERE is_company_admin(sp.tenant_id))
);
CREATE POLICY "Deny client writes to supplier_balances" ON public.supplier_balances FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny client updates to supplier_balances" ON public.supplier_balances FOR UPDATE USING (false);
CREATE POLICY "Deny client deletes to supplier_balances" ON public.supplier_balances FOR DELETE USING (false);

-- reconciliations
CREATE TABLE public.reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id),
  supplier_id UUID NOT NULL REFERENCES public.supplier_providers(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  generated_by UUID,
  report JSONB DEFAULT '{}'::jsonb,
  file_url TEXT,
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reconciliations_tenant_period ON public.reconciliations(tenant_id, period_start);

CREATE POLICY "Deny anon access to reconciliations" ON public.reconciliations FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Company admins can manage reconciliations" ON public.reconciliations FOR ALL USING (is_company_admin(tenant_id)) WITH CHECK (is_company_admin(tenant_id));
CREATE POLICY "Deny client deletes to reconciliations" ON public.reconciliations FOR DELETE USING (false);
CREATE POLICY "Deny client updates to reconciliations" ON public.reconciliations FOR UPDATE USING (false);

-- supplier_error_map
CREATE TABLE public.supplier_error_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.supplier_providers(id),
  external_code TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'transient',
  recommended_action JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_error_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to supplier_error_map" ON public.supplier_error_map FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Company admins can manage supplier_error_map" ON public.supplier_error_map FOR ALL USING (
  supplier_id IN (SELECT sp.id FROM supplier_providers sp WHERE is_company_admin(sp.tenant_id))
) WITH CHECK (
  supplier_id IN (SELECT sp.id FROM supplier_providers sp WHERE is_company_admin(sp.tenant_id))
);
CREATE POLICY "Tenant members can view supplier_error_map" ON public.supplier_error_map FOR SELECT USING (
  supplier_id IN (SELECT sp.id FROM supplier_providers sp WHERE sp.tenant_id IN (
    SELECT ur.company_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL
  ))
);

-- Realtime for supplier_instructions
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_instructions;
