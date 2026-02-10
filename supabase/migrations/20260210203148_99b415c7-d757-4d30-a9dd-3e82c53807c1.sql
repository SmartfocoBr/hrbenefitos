
-- =============================================
-- Task 15: Imports & Exports Storage Buckets
-- =============================================

-- 1. Create private buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('imports', 'imports', false, 52428800, ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('exports', 'exports', false, 52428800, ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json', 'application/pdf']);

-- 2. RLS for imports bucket
CREATE POLICY "Deny anon access to imports"
  ON storage.objects AS RESTRICTIVE FOR ALL TO anon
  USING (bucket_id = 'imports' AND false)
  WITH CHECK (bucket_id = 'imports' AND false);

CREATE POLICY "Company admins can read imports"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] IN (
      SELECT ur.company_id::text FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'company_admin', 'hr_manager')
      AND ur.company_id IS NOT NULL
    )
  );

CREATE POLICY "Deny client writes to imports"
  ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'imports' AND false);

CREATE POLICY "Deny client updates to imports"
  ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (bucket_id = 'imports' AND false);

CREATE POLICY "Deny client deletes to imports"
  ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (bucket_id = 'imports' AND false);

-- 3. RLS for exports bucket
CREATE POLICY "Deny anon access to exports"
  ON storage.objects AS RESTRICTIVE FOR ALL TO anon
  USING (bucket_id = 'exports' AND false)
  WITH CHECK (bucket_id = 'exports' AND false);

CREATE POLICY "Company admins can read exports"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] IN (
      SELECT ur.company_id::text FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'company_admin', 'hr_manager')
      AND ur.company_id IS NOT NULL
    )
  );

CREATE POLICY "Deny client writes to exports"
  ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'exports' AND false);

CREATE POLICY "Deny client updates to exports"
  ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (bucket_id = 'exports' AND false);

CREATE POLICY "Deny client deletes to exports"
  ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
  USING (bucket_id = 'exports' AND false);
