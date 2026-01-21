import { BenefitReport, CategoryTrend, CompanyReport, MonthlyExpense, ReportSummary } from "@/types/report";

export const reportSummary: ReportSummary = {
  totalBudget: 3200000,
  totalSpent: 2760000,
  totalEmployees: 4832,
  averagePerEmployee: 571,
  utilizationRate: 86.25,
  complianceRate: 98.7,
};

export const monthlyExpenses: MonthlyExpense[] = [
  { month: "Jan", alimentacao: 420000, saude: 380000, transporte: 180000, bemestar: 95000, outros: 65000, total: 1140000 },
  { month: "Fev", alimentacao: 435000, saude: 385000, transporte: 175000, bemestar: 98000, outros: 67000, total: 1160000 },
  { month: "Mar", alimentacao: 445000, saude: 390000, transporte: 182000, bemestar: 102000, outros: 71000, total: 1190000 },
  { month: "Abr", alimentacao: 450000, saude: 395000, transporte: 178000, bemestar: 105000, outros: 72000, total: 1200000 },
  { month: "Mai", alimentacao: 455000, saude: 400000, transporte: 185000, bemestar: 108000, outros: 72000, total: 1220000 },
  { month: "Jun", alimentacao: 460000, saude: 405000, transporte: 188000, bemestar: 112000, outros: 75000, total: 1240000 },
  { month: "Jul", alimentacao: 468000, saude: 412000, transporte: 190000, bemestar: 115000, outros: 75000, total: 1260000 },
  { month: "Ago", alimentacao: 475000, saude: 418000, transporte: 192000, bemestar: 118000, outros: 77000, total: 1280000 },
  { month: "Set", alimentacao: 480000, saude: 422000, transporte: 195000, bemestar: 120000, outros: 78000, total: 1295000 },
  { month: "Out", alimentacao: 485000, saude: 428000, transporte: 198000, bemestar: 122000, outros: 79000, total: 1312000 },
  { month: "Nov", alimentacao: 490000, saude: 432000, transporte: 200000, bemestar: 125000, outros: 80000, total: 1327000 },
  { month: "Dez", alimentacao: 495000, saude: 438000, transporte: 205000, bemestar: 128000, outros: 82000, total: 1348000 },
];

export const categoryTrends: CategoryTrend[] = [
  {
    category: "Alimentação",
    color: "hsl(188 94% 43%)",
    data: [
      { month: "Jan", value: 420000, previousValue: 400000, change: 5 },
      { month: "Fev", value: 435000, previousValue: 415000, change: 4.8 },
      { month: "Mar", value: 445000, previousValue: 425000, change: 4.7 },
      { month: "Abr", value: 450000, previousValue: 430000, change: 4.6 },
      { month: "Mai", value: 455000, previousValue: 435000, change: 4.6 },
      { month: "Jun", value: 460000, previousValue: 440000, change: 4.5 },
    ],
  },
  {
    category: "Saúde",
    color: "hsl(222 47% 25%)",
    data: [
      { month: "Jan", value: 380000, previousValue: 360000, change: 5.5 },
      { month: "Fev", value: 385000, previousValue: 365000, change: 5.5 },
      { month: "Mar", value: 390000, previousValue: 370000, change: 5.4 },
      { month: "Abr", value: 395000, previousValue: 375000, change: 5.3 },
      { month: "Mai", value: 400000, previousValue: 380000, change: 5.3 },
      { month: "Jun", value: 405000, previousValue: 385000, change: 5.2 },
    ],
  },
  {
    category: "Transporte",
    color: "hsl(142 76% 36%)",
    data: [
      { month: "Jan", value: 180000, previousValue: 175000, change: 2.8 },
      { month: "Fev", value: 175000, previousValue: 172000, change: 1.7 },
      { month: "Mar", value: 182000, previousValue: 178000, change: 2.2 },
      { month: "Abr", value: 178000, previousValue: 175000, change: 1.7 },
      { month: "Mai", value: 185000, previousValue: 180000, change: 2.8 },
      { month: "Jun", value: 188000, previousValue: 182000, change: 3.3 },
    ],
  },
  {
    category: "Bem-estar",
    color: "hsl(38 92% 50%)",
    data: [
      { month: "Jan", value: 95000, previousValue: 85000, change: 11.8 },
      { month: "Fev", value: 98000, previousValue: 88000, change: 11.4 },
      { month: "Mar", value: 102000, previousValue: 92000, change: 10.9 },
      { month: "Abr", value: 105000, previousValue: 95000, change: 10.5 },
      { month: "Mai", value: 108000, previousValue: 98000, change: 10.2 },
      { month: "Jun", value: 112000, previousValue: 102000, change: 9.8 },
    ],
  },
];

export const benefitReports: BenefitReport[] = [
  { id: "1", name: "Vale Refeição", category: "Alimentação", enrolled: 4520, eligible: 4832, adhesionRate: 93.5, monthlyCost: 350000, trend: "up", trendValue: 3.2 },
  { id: "2", name: "Vale Alimentação", category: "Alimentação", enrolled: 4450, eligible: 4832, adhesionRate: 92.1, monthlyCost: 145000, trend: "up", trendValue: 2.1 },
  { id: "3", name: "Plano de Saúde", category: "Saúde", enrolled: 4680, eligible: 4832, adhesionRate: 96.8, monthlyCost: 420000, trend: "stable", trendValue: 0.5 },
  { id: "4", name: "Plano Odontológico", category: "Saúde", enrolled: 3890, eligible: 4832, adhesionRate: 80.5, monthlyCost: 85000, trend: "up", trendValue: 4.5 },
  { id: "5", name: "Vale Transporte", category: "Transporte", enrolled: 2890, eligible: 4832, adhesionRate: 59.8, monthlyCost: 145000, trend: "down", trendValue: -2.3 },
  { id: "6", name: "Auxílio Combustível", category: "Transporte", enrolled: 1240, eligible: 2000, adhesionRate: 62.0, monthlyCost: 62000, trend: "up", trendValue: 5.8 },
  { id: "7", name: "Gympass", category: "Bem-estar", enrolled: 2150, eligible: 4832, adhesionRate: 44.5, monthlyCost: 45000, trend: "up", trendValue: 12.5 },
  { id: "8", name: "Auxílio Creche", category: "Bem-estar", enrolled: 420, eligible: 680, adhesionRate: 61.7, monthlyCost: 35000, trend: "stable", trendValue: 0.8 },
  { id: "9", name: "Seguro de Vida", category: "Outros", enrolled: 4750, eligible: 4832, adhesionRate: 98.3, monthlyCost: 65000, trend: "stable", trendValue: 0.2 },
  { id: "10", name: "Previdência Privada", category: "Outros", enrolled: 1850, eligible: 4832, adhesionRate: 38.3, monthlyCost: 125000, trend: "up", trendValue: 8.2 },
];

export const companyReports: CompanyReport[] = [
  { id: "1", name: "TechCorp Brasil", employees: 1250, budget: 850000, spent: 782000, utilization: 92.0, topBenefits: ["Plano de Saúde", "Vale Refeição", "Gympass"] },
  { id: "2", name: "Varejo Express", employees: 2100, budget: 1200000, spent: 1045000, utilization: 87.1, topBenefits: ["Vale Alimentação", "Vale Transporte", "Plano Odontológico"] },
  { id: "3", name: "FinanceBank S.A.", employees: 890, budget: 720000, spent: 695000, utilization: 96.5, topBenefits: ["Plano de Saúde", "Previdência Privada", "Seguro de Vida"] },
  { id: "4", name: "LogiTrans Ltda", employees: 592, budget: 430000, spent: 375000, utilization: 87.2, topBenefits: ["Vale Refeição", "Auxílio Combustível", "Plano de Saúde"] },
];

export const reportPeriods = [
  { value: "month", label: "Último Mês" },
  { value: "quarter", label: "Último Trimestre" },
  { value: "semester", label: "Último Semestre" },
  { value: "year", label: "Último Ano" },
  { value: "custom", label: "Personalizado" },
];

export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `R$${(value / 1000).toFixed(0)}K`;
  }
  return `R$${value.toFixed(0)}`;
};
