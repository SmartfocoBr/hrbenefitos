-- Fix 1: Restrict benefits table to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active benefits" ON public.benefits;

CREATE POLICY "Authenticated users can view active benefits"
ON public.benefits
FOR SELECT
TO authenticated
USING (is_active = true);

-- Fix 2: Add INSERT policy for companies table (super_admin only)
CREATE POLICY "Super admins can insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));