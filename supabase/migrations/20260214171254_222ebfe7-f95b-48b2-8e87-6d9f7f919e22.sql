
-- Update system_logs SELECT policy
DROP POLICY IF EXISTS "Tenant admins can view system_logs" ON public.system_logs;
CREATE POLICY "Authorized roles can view system_logs" ON public.system_logs FOR SELECT USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'sre'::app_role)
  OR has_role(auth.uid(), 'operations'::app_role)
  OR has_role(auth.uid(), 'auditor'::app_role)
  OR (tenant_id IS NOT NULL AND is_company_admin(tenant_id))
);

-- Update dlq policies
DROP POLICY IF EXISTS "Tenant admins can manage dlq" ON public.dlq;
DROP POLICY IF EXISTS "Super admins can manage all dlq" ON public.dlq;

CREATE POLICY "Authorized roles can view dlq" ON public.dlq FOR SELECT USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'sre'::app_role)
  OR has_role(auth.uid(), 'operations'::app_role)
  OR is_company_admin(tenant_id)
);

CREATE POLICY "Ops roles can update dlq" ON public.dlq FOR UPDATE USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'sre'::app_role)
  OR has_role(auth.uid(), 'operations'::app_role)
  OR is_company_admin(tenant_id)
);

CREATE POLICY "Deny client inserts to dlq" ON public.dlq FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny client deletes to dlq" ON public.dlq FOR DELETE USING (false);

-- Update reprocess_jobs policies
DROP POLICY IF EXISTS "Tenant admins can manage reprocess_jobs" ON public.reprocess_jobs;
DROP POLICY IF EXISTS "Super admins can manage all reprocess_jobs" ON public.reprocess_jobs;

CREATE POLICY "Authorized roles can view reprocess_jobs" ON public.reprocess_jobs FOR SELECT USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'sre'::app_role)
  OR has_role(auth.uid(), 'operations'::app_role)
  OR dlq_id IN (SELECT d.id FROM public.dlq d WHERE is_company_admin(d.tenant_id))
);

CREATE POLICY "Ops roles can update reprocess_jobs" ON public.reprocess_jobs FOR UPDATE USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'sre'::app_role)
  OR has_role(auth.uid(), 'operations'::app_role)
  OR dlq_id IN (SELECT d.id FROM public.dlq d WHERE is_company_admin(d.tenant_id))
);

CREATE POLICY "Deny client inserts to reprocess_jobs" ON public.reprocess_jobs FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny client deletes to reprocess_jobs" ON public.reprocess_jobs FOR DELETE USING (false);
