-- Add explicit deny policies for anonymous users on all sensitive tables
-- This provides defense-in-depth security by explicitly blocking anonymous access

-- 1. employees table
CREATE POLICY "Deny anonymous access to employees"
ON public.employees
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. companies table
CREATE POLICY "Deny anonymous access to companies"
ON public.companies
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 3. employee_dependents table
CREATE POLICY "Deny anonymous access to employee_dependents"
ON public.employee_dependents
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 4. employee_wallets table
CREATE POLICY "Deny anonymous access to employee_wallets"
ON public.employee_wallets
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 5. wallet_transactions table
CREATE POLICY "Deny anonymous access to wallet_transactions"
ON public.wallet_transactions
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 6. cost_centers table
CREATE POLICY "Deny anonymous access to cost_centers"
ON public.cost_centers
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 7. wallet_allocations table
CREATE POLICY "Deny anonymous access to wallet_allocations"
ON public.wallet_allocations
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 8. company_benefit_policies table
CREATE POLICY "Deny anonymous access to company_benefit_policies"
ON public.company_benefit_policies
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 9. user_roles table
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);