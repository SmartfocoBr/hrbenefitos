
-- =============================================
-- Task 3: Auth Audit Trigger Function
-- =============================================

-- Index on hash for export verification
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_hash ON public.auth_audit_logs(hash);

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.log_auth_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor_id UUID;
  _tenant_id UUID;
  _resource_id UUID;
  _action TEXT;
  _payload JSONB;
  _hash TEXT;
  _now TIMESTAMPTZ := now();
  _jwt JSONB;
BEGIN
  -- Extract actor from JWT claims
  BEGIN
    _jwt := current_setting('request.jwt.claims', true)::jsonb;
    _actor_id := (_jwt ->> 'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    _actor_id := NULL;
  END;

  -- Determine action
  _action := TG_OP;  -- INSERT, UPDATE, DELETE

  -- Build payload and extract resource_id/tenant_id
  IF TG_OP = 'DELETE' THEN
    _payload := jsonb_build_object('old', to_jsonb(OLD));
    _resource_id := OLD.id;
    -- Try to get tenant_id from various column names
    IF to_jsonb(OLD) ? 'tenant_id' THEN
      _tenant_id := (to_jsonb(OLD) ->> 'tenant_id')::uuid;
    ELSIF to_jsonb(OLD) ? 'company_id' THEN
      _tenant_id := (to_jsonb(OLD) ->> 'company_id')::uuid;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    _payload := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    _resource_id := NEW.id;
    IF to_jsonb(NEW) ? 'tenant_id' THEN
      _tenant_id := (to_jsonb(NEW) ->> 'tenant_id')::uuid;
    ELSIF to_jsonb(NEW) ? 'company_id' THEN
      _tenant_id := (to_jsonb(NEW) ->> 'company_id')::uuid;
    END IF;
  ELSE -- INSERT
    _payload := jsonb_build_object('new', to_jsonb(NEW));
    _resource_id := NEW.id;
    IF to_jsonb(NEW) ? 'tenant_id' THEN
      _tenant_id := (to_jsonb(NEW) ->> 'tenant_id')::uuid;
    ELSIF to_jsonb(NEW) ? 'company_id' THEN
      _tenant_id := (to_jsonb(NEW) ->> 'company_id')::uuid;
    END IF;
  END IF;

  -- Compute SHA256 hash
  _hash := encode(digest(_payload::text || _now::text, 'sha256'), 'hex');

  -- Insert audit log
  INSERT INTO public.auth_audit_logs (actor_id, tenant_id, action, resource_type, resource_id, payload, hash, created_at)
  VALUES (_actor_id, _tenant_id, _action, TG_TABLE_NAME, _resource_id, _payload, _hash, _now);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Apply triggers to auth-related tables
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_auth_event();

CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.log_auth_event();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_auth_event();

CREATE TRIGGER audit_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.log_auth_event();

CREATE TRIGGER audit_role_assignments
  AFTER INSERT OR UPDATE OR DELETE ON public.role_assignments
  FOR EACH ROW EXECUTE FUNCTION public.log_auth_event();

CREATE TRIGGER audit_sso_providers
  AFTER INSERT OR UPDATE OR DELETE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.log_auth_event();

CREATE TRIGGER audit_mfa_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.mfa_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_auth_event();
