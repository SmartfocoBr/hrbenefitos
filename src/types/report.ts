export interface ReportPeriod {
  startDate: string;
  endDate: string;
  label: string;
}

export interface TrendDataPoint {
  month: string;
  value: number;
  previousValue?: number;
  change?: number;
}

export interface CategoryTrend {
  category: string;
  color: string;
  data: TrendDataPoint[];
}

export interface ReportSummary {
  totalBudget: number;
  totalSpent: number;
  totalEmployees: number;
  averagePerEmployee: number;
  utilizationRate: number;
  complianceRate: number;
}

export interface BenefitReport {
  id: string;
  name: string;
  category: string;
  enrolled: number;
  eligible: number;
  adhesionRate: number;
  monthlyCost: number;
  trend: "up" | "down" | "stable";
  trendValue: number;
}

export interface CompanyReport {
  id: string;
  name: string;
  employees: number;
  budget: number;
  spent: number;
  utilization: number;
  topBenefits: string[];
}

export interface MonthlyExpense {
  month: string;
  alimentacao: number;
  saude: number;
  transporte: number;
  bemestar: number;
  outros: number;
  total: number;
}

export interface ReportFilter {
  period: "month" | "quarter" | "semester" | "year" | "custom";
  companies: string[];
  categories: string[];
  status: string[];
}
