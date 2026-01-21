import { WalletCategory, EmployeeWallet, TaxRuleConfig, BenefitCategory } from "@/types/wallet";

export const walletCategories: WalletCategory[] = [
  {
    id: "alimentacao",
    name: "Alimentação",
    icon: "Utensils",
    color: "#06b6d4",
    minAllocation: 0,
    maxAllocation: 100,
    taxRule: "exempt",
    taxPercentage: 0,
    description: "Vale Refeição e Vale Alimentação - isentos de tributação conforme PAT"
  },
  {
    id: "saude",
    name: "Saúde",
    icon: "Heart",
    color: "#ef4444",
    minAllocation: 0,
    maxAllocation: 50,
    taxRule: "exempt",
    taxPercentage: 0,
    description: "Plano de Saúde e Odontológico - isentos conforme legislação"
  },
  {
    id: "transporte",
    name: "Transporte",
    icon: "Bus",
    color: "#f59e0b",
    minAllocation: 0,
    maxAllocation: 30,
    taxRule: "exempt",
    taxPercentage: 0,
    description: "Vale Transporte - isento conforme CLT"
  },
  {
    id: "bemestar",
    name: "Bem-estar",
    icon: "Dumbbell",
    color: "#ec4899",
    minAllocation: 0,
    maxAllocation: 40,
    taxRule: "taxable",
    taxPercentage: 27.5,
    description: "Academia e atividades físicas - tributável como salário"
  },
  {
    id: "educacao",
    name: "Educação",
    icon: "GraduationCap",
    color: "#6366f1",
    minAllocation: 0,
    maxAllocation: 50,
    taxRule: "partial",
    taxPercentage: 15,
    description: "Cursos e certificações - parcialmente tributável"
  },
  {
    id: "cultura",
    name: "Cultura",
    icon: "Ticket",
    color: "#8b5cf6",
    minAllocation: 0,
    maxAllocation: 30,
    taxRule: "taxable",
    taxPercentage: 27.5,
    description: "Cinema, teatro, eventos - tributável como salário"
  }
];

export const taxRulesConfig: TaxRuleConfig[] = [
  {
    id: "pat",
    name: "PAT - Programa de Alimentação do Trabalhador",
    rule: "exempt",
    percentage: 0,
    categories: ["alimentacao"],
    description: "Isenção total para benefícios de alimentação",
    legalBasis: "Lei nº 6.321/76 e Decreto nº 5/91"
  },
  {
    id: "health",
    name: "Assistência Médica",
    rule: "exempt",
    percentage: 0,
    categories: ["saude"],
    description: "Isenção para planos de saúde e odontológicos",
    legalBasis: "Art. 458, §2º da CLT"
  },
  {
    id: "transport",
    name: "Vale Transporte",
    rule: "exempt",
    percentage: 0,
    categories: ["transporte"],
    description: "Isenção para deslocamento casa-trabalho",
    legalBasis: "Lei nº 7.418/85"
  },
  {
    id: "education-partial",
    name: "Auxílio Educação",
    rule: "partial",
    percentage: 15,
    categories: ["educacao"],
    description: "Tributação parcial conforme valores",
    legalBasis: "Art. 458, §2º, II da CLT"
  },
  {
    id: "general",
    name: "Benefícios Gerais",
    rule: "taxable",
    percentage: 27.5,
    categories: ["bemestar", "cultura"],
    description: "Tributação como salário",
    legalBasis: "Art. 457 da CLT"
  }
];

export const employeeWallets: EmployeeWallet[] = [
  {
    employeeId: "1",
    employeeName: "Ana Clara Silva",
    totalCredits: 1500,
    usedCredits: 1200,
    allocations: [
      { categoryId: "alimentacao", allocatedAmount: 600, usedAmount: 580, percentage: 40 },
      { categoryId: "saude", allocatedAmount: 450, usedAmount: 450, percentage: 30 },
      { categoryId: "transporte", allocatedAmount: 225, usedAmount: 170, percentage: 15 },
      { categoryId: "bemestar", allocatedAmount: 150, usedAmount: 0, percentage: 10 },
      { categoryId: "educacao", allocatedAmount: 75, usedAmount: 0, percentage: 5 }
    ],
    lastUpdated: "2024-01-15"
  },
  {
    employeeId: "2",
    employeeName: "Bruno Oliveira",
    totalCredits: 2000,
    usedCredits: 1650,
    allocations: [
      { categoryId: "alimentacao", allocatedAmount: 800, usedAmount: 750, percentage: 40 },
      { categoryId: "saude", allocatedAmount: 400, usedAmount: 400, percentage: 20 },
      { categoryId: "bemestar", allocatedAmount: 400, usedAmount: 300, percentage: 20 },
      { categoryId: "educacao", allocatedAmount: 300, usedAmount: 200, percentage: 15 },
      { categoryId: "cultura", allocatedAmount: 100, usedAmount: 0, percentage: 5 }
    ],
    lastUpdated: "2024-01-14"
  },
  {
    employeeId: "3",
    employeeName: "Carla Mendes",
    totalCredits: 1800,
    usedCredits: 1400,
    allocations: [
      { categoryId: "alimentacao", allocatedAmount: 720, usedAmount: 700, percentage: 40 },
      { categoryId: "transporte", allocatedAmount: 360, usedAmount: 350, percentage: 20 },
      { categoryId: "saude", allocatedAmount: 360, usedAmount: 350, percentage: 20 },
      { categoryId: "educacao", allocatedAmount: 270, usedAmount: 0, percentage: 15 },
      { categoryId: "bemestar", allocatedAmount: 90, usedAmount: 0, percentage: 5 }
    ],
    lastUpdated: "2024-01-16"
  }
];

export const getCategoryConfig = (categoryId: BenefitCategory): WalletCategory | undefined => {
  return walletCategories.find(c => c.id === categoryId);
};

export const calculateTax = (amount: number, categoryId: BenefitCategory): number => {
  const category = getCategoryConfig(categoryId);
  if (!category) return 0;
  return (amount * category.taxPercentage) / 100;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
