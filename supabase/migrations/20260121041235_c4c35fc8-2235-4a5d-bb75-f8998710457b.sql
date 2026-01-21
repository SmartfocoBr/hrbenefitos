-- ================================================
-- BENEFITOS: Sistema de Gestão de Benefícios Corporativos
-- Database Schema with Multi-Tenant RLS
-- ================================================

-- 1. Create enum types
CREATE TYPE public.company_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE public.employee_status AS ENUM ('active', 'inactive', 'on_leave', 'terminated');
CREATE TYPE public.contract_type AS ENUM ('clt', 'pj', 'intern', 'temp');
CREATE TYPE public.benefit_category AS ENUM ('alimentacao', 'saude', 'transporte', 'bemestar', 'financeiro', 'outros');
CREATE TYPE public.transaction_type AS ENUM ('credit', 'debit', 'transfer', 'adjustment');
CREATE TYPE public.app_role AS ENUM ('super_admin', 'company_admin', 'hr_manager', 'employee');

-- 2. User Roles Table (for RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  company_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, company_id)
);

-- 3. Companies Table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  segment TEXT,
  status company_status NOT NULL DEFAULT 'pending',
  monthly_budget DECIMAL(15,2) DEFAULT 0,
  monthly_spent DECIMAL(15,2) DEFAULT 0,
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Cost Centers Table
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  budget DECIMAL(15,2) DEFAULT 0,
  spent DECIMAL(15,2) DEFAULT 0,
  manager_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

-- 5. Employees Table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  contract_type contract_type NOT NULL DEFAULT 'clt',
  hire_date DATE,
  salary DECIMAL(15,2),
  work_hours INTEGER DEFAULT 44,
  status employee_status NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Benefits Table (master list)
CREATE TABLE public.benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category benefit_category NOT NULL,
  icon TEXT,
  provider TEXT,
  is_taxable BOOLEAN DEFAULT false,
  tax_percentage DECIMAL(5,2) DEFAULT 0,
  legal_basis TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Company Benefit Policies Table
CREATE TABLE public.company_benefit_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES public.benefits(id) ON DELETE CASCADE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  monthly_limit DECIMAL(15,2),
  eligibility_rules JSONB DEFAULT '{}',
  contract_types contract_type[] DEFAULT ARRAY['clt'::contract_type],
  min_tenure_days INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, benefit_id)
);

-- 8. Employee Wallets Table
CREATE TABLE public.employee_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_balance DECIMAL(15,2) DEFAULT 0,
  available_balance DECIMAL(15,2) DEFAULT 0,
  reserved_balance DECIMAL(15,2) DEFAULT 0,
  last_credit_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Wallet Category Allocations
CREATE TABLE public.wallet_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.employee_wallets(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES public.benefits(id) ON DELETE CASCADE NOT NULL,
  allocated_amount DECIMAL(15,2) DEFAULT 0,
  used_amount DECIMAL(15,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wallet_id, benefit_id)
);

-- 10. Wallet Transactions Table
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.employee_wallets(id) ON DELETE CASCADE NOT NULL,
  benefit_id UUID REFERENCES public.benefits(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Employee Dependents Table
CREATE TABLE public.employee_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  birth_date DATE,
  cpf TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- SECURITY DEFINER FUNCTIONS
-- ================================================

-- Get user's company_id from user_roles
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND company_id IS NOT NULL
  LIMIT 1
$$;

-- Check if user is admin for a specific company
CREATE OR REPLACE FUNCTION public.is_company_admin(check_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND company_id = check_company_id
    AND role IN ('super_admin', 'company_admin', 'hr_manager')
  )
$$;

-- Check if user is the employee owner
CREATE OR REPLACE FUNCTION public.is_employee_owner(check_employee_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = check_employee_id
    AND user_id = auth.uid()
  )
$$;

-- Get company_id for an employee
CREATE OR REPLACE FUNCTION public.get_employee_company_id(check_employee_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.employees WHERE id = check_employee_id
$$;

-- Get employee_id for a wallet
CREATE OR REPLACE FUNCTION public.get_wallet_employee_id(check_wallet_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT employee_id FROM public.employee_wallets WHERE id = check_wallet_id
$$;

-- Check if user has any role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- ================================================
-- ENABLE RLS ON ALL TABLES
-- ================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_benefit_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_dependents ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES
-- ================================================

-- USER_ROLES policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- COMPANIES policies
CREATE POLICY "Company admins can view their company"
  ON public.companies FOR SELECT
  USING (public.is_company_admin(id));

CREATE POLICY "Company admins can update their company"
  ON public.companies FOR UPDATE
  USING (public.is_company_admin(id));

-- COST_CENTERS policies
CREATE POLICY "Company admins can manage cost centers"
  ON public.cost_centers FOR ALL
  USING (public.is_company_admin(company_id));

-- EMPLOYEES policies
CREATE POLICY "Company admins can view company employees"
  ON public.employees FOR SELECT
  USING (public.is_company_admin(company_id) OR public.is_employee_owner(id));

CREATE POLICY "Company admins can insert employees"
  ON public.employees FOR INSERT
  WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY "Company admins can update employees"
  ON public.employees FOR UPDATE
  USING (public.is_company_admin(company_id));

CREATE POLICY "Company admins can delete employees"
  ON public.employees FOR DELETE
  USING (public.is_company_admin(company_id));

-- BENEFITS policies (public read)
CREATE POLICY "Anyone can view active benefits"
  ON public.benefits FOR SELECT
  USING (is_active = true);

-- COMPANY_BENEFIT_POLICIES policies
CREATE POLICY "Company admins can manage benefit policies"
  ON public.company_benefit_policies FOR ALL
  USING (public.is_company_admin(company_id));

CREATE POLICY "Employees can view their company policies"
  ON public.company_benefit_policies FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.employees WHERE user_id = auth.uid()
    )
  );

-- EMPLOYEE_WALLETS policies
CREATE POLICY "Users can view wallets they have access to"
  ON public.employee_wallets FOR SELECT
  USING (
    public.is_company_admin(public.get_employee_company_id(employee_id))
    OR public.is_employee_owner(employee_id)
  );

CREATE POLICY "Company admins can manage wallets"
  ON public.employee_wallets FOR ALL
  USING (public.is_company_admin(public.get_employee_company_id(employee_id)));

-- WALLET_ALLOCATIONS policies
CREATE POLICY "Users can view their wallet allocations"
  ON public.wallet_allocations FOR SELECT
  USING (
    wallet_id IN (
      SELECT ew.id FROM public.employee_wallets ew
      JOIN public.employees e ON e.id = ew.employee_id
      WHERE public.is_company_admin(e.company_id) OR e.user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can update their own allocations"
  ON public.wallet_allocations FOR UPDATE
  USING (
    wallet_id IN (
      SELECT ew.id FROM public.employee_wallets ew
      JOIN public.employees e ON e.id = ew.employee_id
      WHERE e.user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage all allocations"
  ON public.wallet_allocations FOR ALL
  USING (
    wallet_id IN (
      SELECT ew.id FROM public.employee_wallets ew
      JOIN public.employees e ON e.id = ew.employee_id
      WHERE public.is_company_admin(e.company_id)
    )
  );

-- WALLET_TRANSACTIONS policies
CREATE POLICY "Users can view transactions they have access to"
  ON public.wallet_transactions FOR SELECT
  USING (
    wallet_id IN (
      SELECT ew.id FROM public.employee_wallets ew
      JOIN public.employees e ON e.id = ew.employee_id
      WHERE public.is_company_admin(e.company_id) OR e.user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can insert transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (
    wallet_id IN (
      SELECT ew.id FROM public.employee_wallets ew
      JOIN public.employees e ON e.id = ew.employee_id
      WHERE public.is_company_admin(e.company_id)
    )
  );

-- EMPLOYEE_DEPENDENTS policies
CREATE POLICY "Users can view dependents they have access to"
  ON public.employee_dependents FOR SELECT
  USING (
    public.is_company_admin(public.get_employee_company_id(employee_id))
    OR public.is_employee_owner(employee_id)
  );

CREATE POLICY "Company admins can manage dependents"
  ON public.employee_dependents FOR ALL
  USING (public.is_company_admin(public.get_employee_company_id(employee_id)));

-- ================================================
-- TRIGGERS FOR UPDATED_AT
-- ================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_centers_updated_at
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_benefits_updated_at
  BEFORE UPDATE ON public.benefits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_benefit_policies_updated_at
  BEFORE UPDATE ON public.company_benefit_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_wallets_updated_at
  BEFORE UPDATE ON public.employee_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallet_allocations_updated_at
  BEFORE UPDATE ON public.wallet_allocations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_dependents_updated_at
  BEFORE UPDATE ON public.employee_dependents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX idx_cost_centers_company_id ON public.cost_centers(company_id);
CREATE INDEX idx_employees_company_id ON public.employees(company_id);
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_cost_center_id ON public.employees(cost_center_id);
CREATE INDEX idx_company_benefit_policies_company_id ON public.company_benefit_policies(company_id);
CREATE INDEX idx_company_benefit_policies_benefit_id ON public.company_benefit_policies(benefit_id);
CREATE INDEX idx_employee_wallets_employee_id ON public.employee_wallets(employee_id);
CREATE INDEX idx_wallet_allocations_wallet_id ON public.wallet_allocations(wallet_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX idx_employee_dependents_employee_id ON public.employee_dependents(employee_id);