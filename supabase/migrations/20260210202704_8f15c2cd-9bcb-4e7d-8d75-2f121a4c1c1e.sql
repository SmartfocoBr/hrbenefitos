
-- =============================================
-- Task 13: Import Database Schemas
-- =============================================

-- 1. Add external_id to employees for ERP mapping
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS external_id TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_tenant_external
ON public.employees (company_id, external_id) WHERE external_id IS NOT NULL;

-- 2. employee_events table
CREATE TABLE public.employee_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id),
  employee_id UUID NULL REFERENCES public.employees(id),
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_employee_events_tenant_ext UNIQUE (tenant_id, external_event_id)
);

CREATE INDEX idx_employee_events_tenant_type ON public.employee_events (tenant_id, event_type);

ALTER TABLE public.employee_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to employee_events"
  ON public.employee_events AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Company admins can manage employee_events"
  ON public.employee_events FOR ALL TO authenticated
  USING (is_company_admin(tenant_id))
  WITH CHECK (is_company_admin(tenant_id));

-- 3. import_mappings table
CREATE TABLE public.import_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.import_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to import_mappings"
  ON public.import_mappings AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Company admins can manage import_mappings"
  ON public.import_mappings FOR ALL TO authenticated
  USING (is_company_admin(tenant_id))
  WITH CHECK (is_company_admin(tenant_id));

CREATE TRIGGER update_import_mappings_updated_at
  BEFORE UPDATE ON public.import_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. import_jobs table
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id),
  initiated_by UUID NULL,
  source TEXT NOT NULL,
  mapping_id UUID NULL REFERENCES public.import_mappings(id),
  status TEXT NOT NULL DEFAULT 'pending',
  summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_import_jobs_tenant_status ON public.import_jobs (tenant_id, status);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to import_jobs"
  ON public.import_jobs AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Company admins can manage import_jobs"
  ON public.import_jobs FOR ALL TO authenticated
  USING (is_company_admin(tenant_id))
  WITH CHECK (is_company_admin(tenant_id));

-- 5. import_reports table
CREATE TABLE public.import_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_job_id UUID NOT NULL REFERENCES public.import_jobs(id),
  report JSONB DEFAULT '{}'::jsonb,
  checksum TEXT NULL,
  file_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.import_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to import_reports"
  ON public.import_reports AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Company admins can view import_reports"
  ON public.import_reports FOR SELECT TO authenticated
  USING (
    import_job_id IN (
      SELECT ij.id FROM public.import_jobs ij
      WHERE is_company_admin(ij.tenant_id)
    )
  );
