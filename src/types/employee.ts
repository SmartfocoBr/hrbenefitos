import { LucideIcon } from "lucide-react";

export type EmployeeStatus = "active" | "inactive" | "onleave" | "terminated";
export type ContractType = "clt" | "pj" | "intern" | "temporary";

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  position: string;
  department: string;
  costCenter: string;
  hireDate: string;
  birthDate: string;
  cpf: string;
  status: EmployeeStatus;
  contractType: ContractType;
  workload: number;
  salary: number;
  manager?: string;
  location: string;
  phone: string;
  activeBenefits: number;
  totalBenefitsCost: number;
  dependentsCount: number;
}

export interface Dependent {
  id: string;
  employeeId: string;
  name: string;
  relationship: "spouse" | "child" | "parent" | "other";
  birthDate: string;
  cpf: string;
  benefits: string[];
}

export interface BenefitHistory {
  id: string;
  employeeId: string;
  benefitName: string;
  action: "enrolled" | "cancelled" | "updated" | "suspended";
  date: string;
  details: string;
  user: string;
}

export interface EligibilityRule {
  id: string;
  benefitId: string;
  benefitName: string;
  eligible: boolean;
  reason?: string;
  enrolledDate?: string;
}
