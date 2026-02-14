
-- metrics_cache: stores pre-computed KPI values
CREATE TABLE public.metrics_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  period TIMESTAMPTZ NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  payload JSONB DEFAULT '{}'::jsonb,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite index for fast lookups
CREATE UNIQUE INDEX idx_metrics_cache_tenant_key_period 
  ON public.metrics_cache (tenant_id, metric_key, period);

ALTER TABLE public.metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins can read metrics"
  ON public.metrics_cache FOR SELECT
  USING (public.is_company_admin(tenant_id));

-- Block client writes; only edge functions/service role refresh metrics
CREATE POLICY "deny_anon_metrics" ON public.metrics_cache
  AS RESTRICTIVE FOR ALL
  USING (auth.role() = 'authenticated');

-- report_exports: tracks generated report files
CREATE TABLE public.report_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'csv' CHECK (type IN ('csv', 'pdf')),
  params JSONB DEFAULT '{}'::jsonb,
  file_url TEXT,
  checksum TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_exports_tenant ON public.report_exports (tenant_id, created_at DESC);

ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins can read exports"
  ON public.report_exports FOR SELECT
  USING (public.is_company_admin(tenant_id));

CREATE POLICY "Tenant admins can create exports"
  ON public.report_exports FOR INSERT
  WITH CHECK (public.is_company_admin(tenant_id));

CREATE POLICY "deny_anon_exports" ON public.report_exports
  AS RESTRICTIVE FOR ALL
  USING (auth.role() = 'authenticated');

-- dashboard_tiles: user-customizable dashboard layout
CREATE TABLE public.dashboard_tiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dashboard_tiles_owner ON public.dashboard_tiles (owner_id, tenant_id);

ALTER TABLE public.dashboard_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their tiles"
  ON public.dashboard_tiles FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "Tenant admins can view all tiles"
  ON public.dashboard_tiles FOR SELECT
  USING (public.is_company_admin(tenant_id));

CREATE POLICY "deny_anon_tiles" ON public.dashboard_tiles
  AS RESTRICTIVE FOR ALL
  USING (auth.role() = 'authenticated');

-- Trigger for updated_at on dashboard_tiles
CREATE TRIGGER update_dashboard_tiles_updated_at
  BEFORE UPDATE ON public.dashboard_tiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
