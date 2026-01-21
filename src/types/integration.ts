import { LucideIcon } from "lucide-react";

export type IntegrationStatus = "online" | "offline" | "degraded" | "syncing" | "pending";
export type IntegrationType = "erp" | "provider" | "payroll" | "other";

export interface Integration {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  type: IntegrationType;
  status: IntegrationStatus;
  lastSync: string | null;
  nextSync: string | null;
  syncFrequency: string;
  recordsProcessed: number;
  errorCount: number;
  uptime: number;
  version: string;
  apiEndpoint?: string;
  features: string[];
  color: string;
}

export interface SyncLog {
  id: string;
  integrationId: string;
  timestamp: string;
  status: "success" | "error" | "warning";
  message: string;
  recordsProcessed: number;
  duration: number;
}
