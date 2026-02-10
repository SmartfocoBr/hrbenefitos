
-- =============================================
-- Task 8: Connector Storage Buckets
-- =============================================

-- 1. Create private buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('connectors-payloads', 'connectors-payloads', false, 10485760, ARRAY['application/json', 'application/gzip']),
  ('connectors-logs', 'connectors-logs', false, 10485760, ARRAY['application/json', 'application/gzip', 'text/plain']);

-- 2. RLS policies for connectors-payloads
-- Deny direct anonymous access
CREATE POLICY "Deny anon access to connectors-payloads"
  ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon
  USING (bucket_id = 'connectors-payloads' AND false)
  WITH CHECK (bucket_id = 'connectors-payloads' AND false);

-- Company admins can read payloads scoped to their tenant folder
CREATE POLICY "Company admins can read connectors-payloads"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'connectors-payloads'
    AND (storage.foldername(name))[1] IN (
      SELECT ur.company_id::text FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'company_admin', 'hr_manager')
      AND ur.company_id IS NOT NULL
    )
  );

-- No direct client INSERT/UPDATE/DELETE (service_role only via edge functions)
CREATE POLICY "Deny client writes to connectors-payloads"
  ON storage.objects AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'connectors-payloads' AND false);

CREATE POLICY "Deny client updates to connectors-payloads"
  ON storage.objects AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (bucket_id = 'connectors-payloads' AND false);

CREATE POLICY "Deny client deletes to connectors-payloads"
  ON storage.objects AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (bucket_id = 'connectors-payloads' AND false);

-- 3. RLS policies for connectors-logs
CREATE POLICY "Deny anon access to connectors-logs"
  ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon
  USING (bucket_id = 'connectors-logs' AND false)
  WITH CHECK (bucket_id = 'connectors-logs' AND false);

CREATE POLICY "Company admins can read connectors-logs"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'connectors-logs'
    AND (storage.foldername(name))[1] IN (
      SELECT ur.company_id::text FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'company_admin', 'hr_manager')
      AND ur.company_id IS NOT NULL
    )
  );

CREATE POLICY "Deny client writes to connectors-logs"
  ON storage.objects AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'connectors-logs' AND false);

CREATE POLICY "Deny client updates to connectors-logs"
  ON storage.objects AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (bucket_id = 'connectors-logs' AND false);

CREATE POLICY "Deny client deletes to connectors-logs"
  ON storage.objects AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (bucket_id = 'connectors-logs' AND false);
