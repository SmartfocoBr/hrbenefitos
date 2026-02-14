import { useState } from "react";
import { useReconciliations } from "@/hooks/useReconciliations";
import { useSupplierProviders } from "@/hooks/useSupplierProviders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileBarChart, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  tenantId: string | null;
}

export default function ReconciliationTab({ tenantId }: Props) {
  const [supplierId, setSupplierId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const { data: providers } = useSupplierProviders(tenantId ?? undefined);
  const { data: reconciliations, isLoading, generateReport } = useReconciliations(tenantId ?? undefined);

  const handleGenerate = () => {
    if (!tenantId || !supplierId || !periodStart || !periodEnd) return;
    generateReport.mutate({
      supplier_id: supplierId,
      tenant_id: tenantId,
      period_start: periodStart,
      period_end: periodEnd,
    });
  };

  const handleDownload = async (fileUrl: string) => {
    const { data } = await supabase.storage.from("exports").createSignedUrl(fileUrl, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Gerar Relatório de Conciliação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {providers?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Período Início</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Período Fim</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={!supplierId || !periodStart || !periodEnd || generateReport.isPending}
                className="w-full"
              >
                {generateReport.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !reconciliations?.length ? (
            <p className="text-center text-muted-foreground py-8">Nenhum relatório gerado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Instruções</TableHead>
                  <TableHead>Discrepância</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead className="text-right">Arquivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((r) => {
                  const summary = (r.report as any)?.summary;
                  const discrepancy = summary?.discrepancy;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{(r.supplier_providers as any)?.name ?? "—"}</TableCell>
                      <TableCell>
                        {format(new Date(r.period_start), "dd/MM/yy", { locale: ptBR })} –{" "}
                        {format(new Date(r.period_end), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{summary?.total_instructions ?? 0}</TableCell>
                      <TableCell>
                        {discrepancy != null ? (
                          <Badge variant={discrepancy === 0 ? "secondary" : "destructive"}>
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(discrepancy)}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(r.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.file_url ? (
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(r.file_url!)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
