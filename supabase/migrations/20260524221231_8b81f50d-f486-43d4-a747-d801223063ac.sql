
-- 1) has_role must respect is_active
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND COALESCE(is_active, true) = true
  )
$$;

-- 2) Convert PERMISSIVE anon-deny policies to RESTRICTIVE scoped to anon role
DO $$
DECLARE
  t text;
  pname text;
  tables text[] := ARRAY[
    'allocation_limits','dlq','ledger_allocations','reconciliations','reprocess_jobs',
    'supplier_balances','supplier_error_map','supplier_instructions','supplier_providers',
    'system_logs','wallet_balances','wallet_ledger','wallets'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pname IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t
        AND (policyname ILIKE '%deny%anon%' OR policyname ILIKE '%anonymous%')
        AND permissive='PERMISSIVE'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pname, t);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY "Deny anonymous access to %I" ON public.%I AS RESTRICTIVE TO anon USING (false) WITH CHECK (false)',
      t, t
    );
  END LOOP;
END $$;
