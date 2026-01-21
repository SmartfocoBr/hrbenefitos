export type CompanyStatus = "active" | "inactive" | "pending";

export interface CostCenter {
  id: string;
  companyId: string;
  code: string;
  name: string;
  manager: string;
  employeeCount: number;
  budget: number;
  spent: number;
}

export interface CompanyPolicy {
  id: string;
  companyId: string;
  benefitId: string;
  benefitName: string;
  enabled: boolean;
  eligibilityRules: string[];
  monthlyLimit?: number;
  employeeContribution?: number;
}

export interface Company {
  id: string;
  name: string;
  tradeName: string;
  cnpj: string;
  status: CompanyStatus;
  segment: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website?: string;
  employeeCount: number;
  costCenterCount: number;
  activeBenefits: number;
  monthlyBudget: number;
  monthlySpent: number;
  erpIntegration?: string;
  createdAt: string;
  logo?: string;
}
