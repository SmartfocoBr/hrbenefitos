
-- Enable pgcrypto extension for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- 1. PROFILES TABLE (public.users mirror)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,  -- matches auth.users.id, NOT auto-generated
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. EXTEND companies TABLE (tenants concept)
-- =============================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);

-- =============================================
-- 3. EXTEND user_roles TABLE (tenant_users concept)
-- =============================================
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- =============================================
-- 4. ROLES TABLE (dynamic RBAC)
-- =============================================
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,  -- NULL = global role
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_roles_tenant_id ON public.roles(tenant_id);
CREATE INDEX idx_roles_permissions ON public.roles USING GIN(permissions);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all roles"
  ON public.roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Company admins can view their tenant roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (tenant_id IS NULL OR is_company_admin(tenant_id));

CREATE POLICY "Company admins can manage their tenant roles"
  ON public.roles FOR ALL
  TO authenticated
  USING (tenant_id IS NOT NULL AND is_company_admin(tenant_id));

CREATE POLICY "Deny anonymous access to roles"
  ON public.roles AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 5. ROLE_ASSIGNMENTS TABLE
-- =============================================
CREATE TABLE public.role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('user', 'team')),
  subject_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  scope JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_role_assignments_role_id ON public.role_assignments(role_id);
CREATE INDEX idx_role_assignments_subject ON public.role_assignments(subject_type, subject_id);

ALTER TABLE public.role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all role assignments"
  ON public.role_assignments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Company admins can view assignments for their roles"
  ON public.role_assignments FOR SELECT
  TO authenticated
  USING (role_id IN (
    SELECT r.id FROM public.roles r
    WHERE r.tenant_id IS NOT NULL AND is_company_admin(r.tenant_id)
  ));

CREATE POLICY "Deny anonymous access to role_assignments"
  ON public.role_assignments AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- =============================================
-- 6. SSO_PROVIDERS TABLE
-- =============================================
CREATE TABLE public.sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('saml', 'oidc', 'oauth')),
  metadata JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sso_providers_tenant_id ON public.sso_providers(tenant_id);

ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage their SSO providers"
  ON public.sso_providers FOR ALL
  TO authenticated
  USING (is_company_admin(tenant_id));

CREATE POLICY "Deny anonymous access to sso_providers"
  ON public.sso_providers AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE TRIGGER update_sso_providers_updated_at
  BEFORE UPDATE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 7. MFA_SETTINGS TABLE
-- =============================================
CREATE TABLE public.mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  totp_secret TEXT,  -- should be encrypted via edge function
  is_enabled BOOLEAN DEFAULT false,
  backup_codes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mfa_settings_user_id ON public.mfa_settings(user_id);

ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own MFA settings"
  ON public.mfa_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own MFA settings"
  ON public.mfa_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Deny anonymous access to mfa_settings"
  ON public.mfa_settings AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE TRIGGER update_mfa_settings_updated_at
  BEFORE UPDATE ON public.mfa_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 8. AUTH_AUDIT_LOGS TABLE
-- =============================================
CREATE TABLE public.auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  tenant_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_audit_logs_created_at ON public.auth_audit_logs(created_at DESC);
CREATE INDEX idx_auth_audit_logs_actor ON public.auth_audit_logs(actor_id);
CREATE INDEX idx_auth_audit_logs_tenant ON public.auth_audit_logs(tenant_id);
CREATE INDEX idx_auth_audit_logs_action ON public.auth_audit_logs(action);

ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs: only super_admins and company admins can read
CREATE POLICY "Super admins can view all audit logs"
  ON public.auth_audit_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Company admins can view their tenant audit logs"
  ON public.auth_audit_logs FOR SELECT
  TO authenticated
  USING (tenant_id IS NOT NULL AND is_company_admin(tenant_id));

-- Insert via service role or edge functions only
CREATE POLICY "Deny direct insert from clients"
  ON public.auth_audit_logs AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny updates and deletes on audit logs"
  ON public.auth_audit_logs AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Deny delete on audit logs"
  ON public.auth_audit_logs AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "Deny anonymous access to auth_audit_logs"
  ON public.auth_audit_logs AS RESTRICTIVE
  FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- =============================================
-- 9. Seed default global roles
-- =============================================
INSERT INTO public.roles (tenant_id, name, permissions) VALUES
  (NULL, 'super_admin', '["*"]'::jsonb),
  (NULL, 'company_admin', '["company:read","company:write","employee:read","employee:write","benefit:read","benefit:write","report:read"]'::jsonb),
  (NULL, 'hr_manager', '["employee:read","employee:write","benefit:read","benefit:write","report:read"]'::jsonb),
  (NULL, 'employee', '["self:read","self:write","benefit:read"]'::jsonb);
