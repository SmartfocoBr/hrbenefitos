export type BenefitCategory = "alimentacao" | "saude" | "transporte" | "bemestar" | "educacao" | "cultura";

export type TaxRule = "exempt" | "taxable" | "partial";

export interface WalletCategory {
  id: BenefitCategory;
  name: string;
  icon: string;
  color: string;
  minAllocation: number;
  maxAllocation: number;
  taxRule: TaxRule;
  taxPercentage: number;
  description: string;
}

export interface EmployeeWallet {
  employeeId: string;
  employeeName: string;
  totalCredits: number;
  usedCredits: number;
  allocations: CategoryAllocation[];
  lastUpdated: string;
}

export interface CategoryAllocation {
  categoryId: BenefitCategory;
  allocatedAmount: number;
  usedAmount: number;
  percentage: number;
}

export interface WalletSimulation {
  totalCredits: number;
  allocations: SimulationAllocation[];
  netValue: number;
  taxDeductions: number;
  effectiveValue: number;
}

export interface SimulationAllocation {
  categoryId: BenefitCategory;
  amount: number;
  percentage: number;
  taxAmount: number;
  netAmount: number;
}

export interface TaxRuleConfig {
  id: string;
  name: string;
  rule: TaxRule;
  percentage: number;
  categories: BenefitCategory[];
  description: string;
  legalBasis: string;
}
