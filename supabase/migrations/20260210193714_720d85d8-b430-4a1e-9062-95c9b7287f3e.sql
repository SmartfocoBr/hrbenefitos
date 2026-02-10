
-- =============================================
-- Task 6: Integration Hub Database Schemas
-- =============================================

-- 1. CONNECTOR_SECRETS (must exist before connectors FK)
CREATE TABLE public.connector_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encrypted_secrets JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.connector_secrets ENABLE ROW LEVEL SECURITY;

-- Secrets: deny all client access, service_role only
CREATE POLICY "Deny all client access to connector_secrets"
  ON public.connector_secrets AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny anonymous access to connector_secrets"
  ON public.connector_secrets AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE TRIGGER update_connector_secrets_updated_at
  BEFORE UPDATE ON public.connector_secrets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. CONNECTORS
CREATE TABLE public.connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  connector_type TEXT NOT NULL CHECK (connector_type IN ('erp', 'supplier', 'custom')),
  config JSONB DEFAULT '{}'::jsonb,
  secrets_id UUID REFERENCES public.connector_secrets(id) ON DELETE SET NULL,
  is_enabled BOOLEAN DEFAULT true,
  retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff_ms": 1000}'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_connectors_tenant_id ON public.connectors(tenant_id);

ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage connectors"
  ON public.connectors FOR ALL
  TO authenticated
  USING (is_company_admin(tenant_id));

CREATE POLICY "Tenant members can view connectors"
  ON public.connectors FOR SELECT
  TO authenticated
  USING (tenant_id IN (
    SELECT ur.company_id FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL
  ));

CREATE POLICY "Deny anonymous access to connectors"
  ON public.connectors AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE TRIGGER update_connectors_updated_at
  BEFORE UPDATE ON public.connectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. CONNECTOR_EXECUTIONS
CREATE TABLE public.connector_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'success', 'failed')),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  request_payload JSONB,
  response_payload JSONB
);

CREATE INDEX idx_connector_executions_connector_status ON public.connector_executions(connector_id, status);

ALTER TABLE public.connector_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can view executions"
  ON public.connector_executions FOR SELECT
  TO authenticated
  USING (is_company_admin(tenant_id));

CREATE POLICY "Deny anonymous access to connector_executions"
  ON public.connector_executions AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- 4. CONNECTOR_HEALTH
CREATE TABLE public.connector_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  last_check TIMESTAMPTZ,
  status TEXT DEFAULT 'unknown',
  latency_ms INTEGER,
  last_error TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_connector_health_connector_id ON public.connector_health(connector_id);

ALTER TABLE public.connector_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can view connector health"
  ON public.connector_health FOR SELECT
  TO authenticated
  USING (connector_id IN (
    SELECT c.id FROM public.connectors c WHERE is_company_admin(c.tenant_id)
  ));

CREATE POLICY "Deny anonymous access to connector_health"
  ON public.connector_health AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE TRIGGER update_connector_health_updated_at
  BEFORE UPDATE ON public.connector_health
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. CONNECTOR_LOGS
CREATE TABLE public.connector_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.connector_executions(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_connector_logs_execution_id ON public.connector_logs(execution_id);
CREATE INDEX idx_connector_logs_created_at ON public.connector_logs(created_at DESC);

ALTER TABLE public.connector_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can view connector logs"
  ON public.connector_logs FOR SELECT
  TO authenticated
  USING (execution_id IN (
    SELECT ce.id FROM public.connector_executions ce WHERE is_company_admin(ce.tenant_id)
  ));

CREATE POLICY "Deny anonymous access to connector_logs"
  ON public.connector_logs AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- 6. CONNECTOR_DLQ (Dead Letter Queue)
CREATE TABLE public.connector_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.connector_executions(id) ON DELETE SET NULL,
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  error TEXT,
  failure_count INTEGER DEFAULT 0,
  next_retry TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_connector_dlq_next_retry ON public.connector_dlq(next_retry);
CREATE INDEX idx_connector_dlq_connector_id ON public.connector_dlq(connector_id);

ALTER TABLE public.connector_dlq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage DLQ"
  ON public.connector_dlq FOR ALL
  TO authenticated
  USING (connector_id IN (
    SELECT c.id FROM public.connectors c WHERE is_company_admin(c.tenant_id)
  ));

CREATE POLICY "Deny anonymous access to connector_dlq"
  ON public.connector_dlq AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE TRIGGER update_connector_dlq_updated_at
  BEFORE UPDATE ON public.connector_dlq
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Audit triggers for connectors
CREATE TRIGGER audit_connectors
  AFTER INSERT OR UPDATE OR DELETE ON public.connectors
  FOR EACH ROW EXECUTE FUNCTION public.log_auth_event();

CREATE TRIGGER audit_connector_secrets
  AFTER INSERT OR UPDATE OR DELETE ON public.connector_secrets
  FOR EACH ROW EXECUTE FUNCTION public.log_auth_event();
