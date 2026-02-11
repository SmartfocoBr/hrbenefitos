
-- 1. policy_versions table
CREATE TABLE public.policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_policy_versions_policy ON public.policy_versions (policy_id, version_number DESC);

ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny anon access to policy_versions" ON public.policy_versions
  AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Admins can view policy_versions" ON public.policy_versions
  FOR SELECT TO authenticated USING (
    policy_id IN (SELECT p.id FROM policies p WHERE is_company_admin(p.tenant_id))
  );

-- Block client writes (only trigger inserts)
CREATE POLICY "Deny client writes to policy_versions" ON public.policy_versions
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Deny client updates to policy_versions" ON public.policy_versions
  AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);

CREATE POLICY "Deny client deletes to policy_versions" ON public.policy_versions
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

-- 2. Trigger function: snapshot version + notify
CREATE OR REPLACE FUNCTION public.trg_policy_version_and_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Auto-increment version on the policy row
  IF TG_OP = 'UPDATE' THEN
    NEW.version := OLD.version + 1;
  END IF;

  -- Snapshot into policy_versions
  INSERT INTO public.policy_versions (policy_id, version_number, rules, created_by)
  VALUES (NEW.id, NEW.version, NEW.rules, NEW.created_by);

  -- Lightweight NOTIFY for async recalculation
  PERFORM pg_notify(
    'policy_changed',
    jsonb_build_object(
      'policy_id', NEW.id,
      'tenant_id', NEW.tenant_id,
      'version', NEW.version,
      'policy_type', NEW.policy_type
    )::text
  );

  RETURN NEW;
END;
$$;

-- 3. Attach trigger BEFORE INSERT/UPDATE
CREATE TRIGGER trg_policy_versioning
  BEFORE INSERT OR UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_policy_version_and_notify();
