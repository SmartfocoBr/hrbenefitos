
-- Refine policy_simulations: allow hr_manager to insert and creators to view their own
DROP POLICY IF EXISTS "Company admins can manage policy_simulations" ON public.policy_simulations;

-- Admins can do everything
CREATE POLICY "Company admins can manage policy_simulations" ON public.policy_simulations
  FOR ALL TO authenticated
  USING (is_company_admin(tenant_id))
  WITH CHECK (is_company_admin(tenant_id));

-- HR managers and admins can insert simulations
CREATE POLICY "HR can insert policy_simulations" ON public.policy_simulations
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'company_admin', 'hr_manager')
        AND ur.company_id IS NOT NULL
    )
  );

-- Tenant members can view simulations in their company
CREATE POLICY "Tenant members can view policy_simulations" ON public.policy_simulations
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT ur.company_id FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'company_admin', 'hr_manager')
        AND ur.company_id IS NOT NULL
    )
  );
