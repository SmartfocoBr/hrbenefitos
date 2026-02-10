
-- 1. Benefits catalog (tenant-scoped, extends existing benefits table concept)
CREATE TABLE public.benefit_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  benefit_type TEXT NOT NULL DEFAULT 'other',
  provider_id UUID REFERENCES public.connectors(id) ON DELETE SET NULL,
  params JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_benefit_catalog_tenant_code ON public.benefit_catalog (tenant_id, code);

ALTER TABLE public.benefit_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to benefit_catalog" ON public.benefit_catalog
  AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Company admins can manage benefit_catalog" ON public.benefit_catalog
  FOR ALL TO authenticated USING (is_company_admin(tenant_id)) WITH CHECK (is_company_admin(tenant_id));

CREATE POLICY "Tenant members can view benefit_catalog" ON public.benefit_catalog
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT ur.company_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL)
  );

CREATE TRIGGER update_benefit_catalog_updated_at
  BEFORE UPDATE ON public.benefit_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('eligibility', 'allocation', 'fiscal', 'custom')),
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policies_tenant ON public.policies (tenant_id);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to policies" ON public.policies
  AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Company admins can manage policies" ON public.policies
  FOR ALL TO authenticated USING (is_company_admin(tenant_id)) WITH CHECK (is_company_admin(tenant_id));

CREATE POLICY "Tenant members can view policies" ON public.policies
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT ur.company_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL)
  );

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Policy rules (normalized)
CREATE TABLE public.policy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  rule_order INT NOT NULL DEFAULT 0,
  rule_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policy_rules_policy ON public.policy_rules (policy_id, rule_order);

ALTER TABLE public.policy_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to policy_rules" ON public.policy_rules
  AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Admins can manage policy_rules" ON public.policy_rules
  FOR ALL TO authenticated USING (
    policy_id IN (SELECT p.id FROM policies p WHERE is_company_admin(p.tenant_id))
  ) WITH CHECK (
    policy_id IN (SELECT p.id FROM policies p WHERE is_company_admin(p.tenant_id))
  );

CREATE POLICY "Tenant members can view policy_rules" ON public.policy_rules
  FOR SELECT TO authenticated USING (
    policy_id IN (SELECT p.id FROM policies p WHERE p.tenant_id IN (
      SELECT ur.company_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL
    ))
  );

-- 4. Policy associations
CREATE TABLE public.policy_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_id UUID NOT NULL REFERENCES public.benefit_catalog(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policy_assoc_benefit ON public.policy_associations (benefit_id);
CREATE INDEX idx_policy_assoc_policy ON public.policy_associations (policy_id);

ALTER TABLE public.policy_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to policy_associations" ON public.policy_associations
  AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Admins can manage policy_associations" ON public.policy_associations
  FOR ALL TO authenticated USING (
    benefit_id IN (SELECT bc.id FROM benefit_catalog bc WHERE is_company_admin(bc.tenant_id))
  ) WITH CHECK (
    benefit_id IN (SELECT bc.id FROM benefit_catalog bc WHERE is_company_admin(bc.tenant_id))
  );

CREATE POLICY "Tenant members can view policy_associations" ON public.policy_associations
  FOR SELECT TO authenticated USING (
    benefit_id IN (SELECT bc.id FROM benefit_catalog bc WHERE bc.tenant_id IN (
      SELECT ur.company_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL
    ))
  );

-- 5. Fiscal rules
CREATE TABLE public.fiscal_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  benefit_id UUID REFERENCES public.benefit_catalog(id) ON DELETE SET NULL,
  contract_type TEXT,
  tax_treatment JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fiscal_rules_tenant ON public.fiscal_rules (tenant_id);

ALTER TABLE public.fiscal_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to fiscal_rules" ON public.fiscal_rules
  AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Company admins can manage fiscal_rules" ON public.fiscal_rules
  FOR ALL TO authenticated USING (is_company_admin(tenant_id)) WITH CHECK (is_company_admin(tenant_id));

CREATE POLICY "Tenant members can view fiscal_rules" ON public.fiscal_rules
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT ur.company_id FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL)
  );

CREATE TRIGGER update_fiscal_rules_updated_at
  BEFORE UPDATE ON public.fiscal_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Policy simulations
CREATE TABLE public.policy_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  policy_id UUID REFERENCES public.policies(id) ON DELETE SET NULL,
  input_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policy_simulations_tenant ON public.policy_simulations (tenant_id);

ALTER TABLE public.policy_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to policy_simulations" ON public.policy_simulations
  AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Company admins can manage policy_simulations" ON public.policy_simulations
  FOR ALL TO authenticated USING (is_company_admin(tenant_id)) WITH CHECK (is_company_admin(tenant_id));
