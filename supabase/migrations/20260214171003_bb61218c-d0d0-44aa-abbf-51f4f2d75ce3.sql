
-- 1. system_logs: immutable, hash-signed log entries
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  actor_id UUID,
  service TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hash TEXT
);

CREATE INDEX idx_system_logs_created_at ON public.system_logs (created_at DESC);
CREATE INDEX idx_system_logs_tenant_service ON public.system_logs (tenant_id, service);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Deny anon
CREATE POLICY "Deny anon access to system_logs" ON public.system_logs FOR ALL USING (false) WITH CHECK (false);
-- Tenant admins can read their logs
CREATE POLICY "Tenant admins can view system_logs" ON public.system_logs FOR SELECT USING (
  (tenant_id IS NOT NULL AND is_company_admin(tenant_id)) OR has_role(auth.uid(), 'super_admin'::app_role)
);
-- Deny client writes (service role only)
CREATE POLICY "Deny client inserts to system_logs" ON public.system_logs FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny client updates to system_logs" ON public.system_logs FOR UPDATE USING (false);
CREATE POLICY "Deny client deletes to system_logs" ON public.system_logs FOR DELETE USING (false);

-- Auto-compute hash on insert
CREATE OR REPLACE FUNCTION public.trg_system_log_hash()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  NEW.hash := encode(
    digest(
      NEW.service || NEW.level || NEW.message || COALESCE(NEW.context::text, '') || NEW.created_at::text,
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_system_log_hash
BEFORE INSERT ON public.system_logs
FOR EACH ROW EXECUTE FUNCTION public.trg_system_log_hash();

-- 2. dlq: global dead-letter queue
CREATE TABLE public.dlq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.companies(id),
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error JSONB DEFAULT '{}'::jsonb,
  failure_count INTEGER NOT NULL DEFAULT 0,
  next_retry TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dlq_next_retry ON public.dlq (next_retry) WHERE next_retry IS NOT NULL;
CREATE INDEX idx_dlq_tenant_source ON public.dlq (tenant_id, source);

ALTER TABLE public.dlq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to dlq" ON public.dlq FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Tenant admins can manage dlq" ON public.dlq FOR ALL USING (is_company_admin(tenant_id));
CREATE POLICY "Super admins can manage all dlq" ON public.dlq FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 3. reprocess_jobs: tracks reprocessing attempts
CREATE TABLE public.reprocess_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dlq_id UUID NOT NULL REFERENCES public.dlq(id) ON DELETE CASCADE,
  initiated_by UUID,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_reprocess_jobs_dlq ON public.reprocess_jobs (dlq_id);
CREATE INDEX idx_reprocess_jobs_status ON public.reprocess_jobs (status) WHERE status IN ('queued', 'running');

ALTER TABLE public.reprocess_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to reprocess_jobs" ON public.reprocess_jobs FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "Tenant admins can manage reprocess_jobs" ON public.reprocess_jobs FOR ALL USING (
  dlq_id IN (SELECT d.id FROM public.dlq d WHERE is_company_admin(d.tenant_id))
);
CREATE POLICY "Super admins can manage all reprocess_jobs" ON public.reprocess_jobs FOR ALL USING (
  has_role(auth.uid(), 'super_admin'::app_role)
);
