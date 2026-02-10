
-- =============================================
-- Task 14: Refine Import RLS Policies
-- =============================================

-- 1. employee_events: restrict client writes (service_role only via edge functions)
DROP POLICY IF EXISTS "Company admins can manage employee_events" ON public.employee_events;

CREATE POLICY "Company admins can view employee_events"
  ON public.employee_events FOR SELECT TO authenticated
  USING (is_company_admin(tenant_id));

CREATE POLICY "Deny client writes to employee_events"
  ON public.employee_events AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates to employee_events"
  ON public.employee_events AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Deny client deletes to employee_events"
  ON public.employee_events AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);

-- 2. import_mappings: refine - SELECT/INSERT for admins, DELETE only super_admin/company_admin
DROP POLICY IF EXISTS "Company admins can manage import_mappings" ON public.import_mappings;

CREATE POLICY "Company admins can view import_mappings"
  ON public.import_mappings FOR SELECT TO authenticated
  USING (is_company_admin(tenant_id));

CREATE POLICY "Company admins can create import_mappings"
  ON public.import_mappings FOR INSERT TO authenticated
  WITH CHECK (is_company_admin(tenant_id));

CREATE POLICY "Company admins can update import_mappings"
  ON public.import_mappings FOR UPDATE TO authenticated
  USING (is_company_admin(tenant_id));

CREATE POLICY "Only admins can delete import_mappings"
  ON public.import_mappings FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR (
      tenant_id IN (
        SELECT ur.company_id FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role = 'company_admin'
        AND ur.company_id IS NOT NULL
      )
    )
  );

-- 3. import_jobs: keep admin SELECT/INSERT, deny client DELETE
DROP POLICY IF EXISTS "Company admins can manage import_jobs" ON public.import_jobs;

CREATE POLICY "Company admins can view import_jobs"
  ON public.import_jobs FOR SELECT TO authenticated
  USING (is_company_admin(tenant_id));

CREATE POLICY "Company admins can create import_jobs"
  ON public.import_jobs FOR INSERT TO authenticated
  WITH CHECK (is_company_admin(tenant_id));

CREATE POLICY "Deny client updates to import_jobs"
  ON public.import_jobs AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Deny client deletes to import_jobs"
  ON public.import_jobs AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);

-- 4. import_reports: already SELECT-only, add explicit deny for writes
CREATE POLICY "Deny client writes to import_reports"
  ON public.import_reports AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates to import_reports"
  ON public.import_reports AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Deny client deletes to import_reports"
  ON public.import_reports AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);
