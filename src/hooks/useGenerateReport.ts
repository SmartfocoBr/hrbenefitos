import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ReportResult {
  report: {
    id: string;
    name: string;
    type: string;
    created_at: string;
  };
  download_url: string | null;
  checksum: string;
}

export function useGenerateReport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastReport, setLastReport] = useState<ReportResult | null>(null);

  const generate = useCallback(async (
    tenantId: string,
    reportType: string,
    params: Record<string, unknown> = {}
  ): Promise<ReportResult | null> => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tenant_id: tenantId, report_type: reportType, params }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate report");
      }

      const result: ReportResult = await resp.json();
      setLastReport(result);

      toast({ title: "Relatório gerado", description: `${result.report.name} pronto para download.` });

      return result;
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao gerar relatório",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getDownloadUrl = useCallback(async (reportId: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-download-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ report_id: reportId }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get download URL");
      }

      const data = await resp.json();
      return data.download_url;
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao obter link de download",
        variant: "destructive",
      });
      return null;
    }
  }, []);

  return {
    isGenerating,
    lastReport,
    generate,
    getDownloadUrl,
  };
}
