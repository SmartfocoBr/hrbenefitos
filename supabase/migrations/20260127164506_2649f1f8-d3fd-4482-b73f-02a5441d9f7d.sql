-- Drop the existing super_admin only insert policy
DROP POLICY IF EXISTS "Super admins can insert companies" ON public.companies;

-- Create a new policy that allows company_admin and hr_manager to also insert companies
CREATE POLICY "Admins can insert companies"
ON public.companies
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'company_admin'::app_role) OR
  has_role(auth.uid(), 'hr_manager'::app_role)
);