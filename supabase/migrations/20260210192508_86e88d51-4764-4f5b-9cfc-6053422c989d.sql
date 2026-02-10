
-- =============================================
-- Task 2: Refine RLS Policies
-- =============================================

-- 1. PROFILES: Allow super_admins to view/update all profiles
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 2. COMPANIES (tenants): Allow tenant members (employees) to view their company
CREATE POLICY "Employees can view their company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT ur.company_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL
    )
  );

-- Super admins can view all companies
CREATE POLICY "Super admins can view all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can insert companies
CREATE POLICY "Super admins can insert companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can update any company
CREATE POLICY "Super admins can update all companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can delete companies
CREATE POLICY "Super admins can delete companies"
  ON public.companies FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 3. USER_ROLES (tenant_users): Allow admins to manage roles
CREATE POLICY "Super admins can manage all user roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Company admins can view their tenant user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    company_id IS NOT NULL AND is_company_admin(company_id)
  );

CREATE POLICY "Company admins can insert user roles for their tenant"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IS NOT NULL AND is_company_admin(company_id)
  );

CREATE POLICY "Company admins can update user roles for their tenant"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (
    company_id IS NOT NULL AND is_company_admin(company_id)
  );

CREATE POLICY "Company admins can delete user roles for their tenant"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    company_id IS NOT NULL AND is_company_admin(company_id)
  );

-- 4. ROLE_ASSIGNMENTS: Allow tenant admins to manage assignments for their roles
CREATE POLICY "Company admins can manage assignments for their roles"
  ON public.role_assignments FOR ALL
  TO authenticated
  USING (role_id IN (
    SELECT r.id FROM public.roles r
    WHERE r.tenant_id IS NOT NULL AND is_company_admin(r.tenant_id)
  ));

-- 5. SSO_PROVIDERS: Allow tenant members to view (read-only) SSO config
CREATE POLICY "Tenant members can view SSO providers"
  ON public.sso_providers FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT ur.company_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.company_id IS NOT NULL
    )
  );
