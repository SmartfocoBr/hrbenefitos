import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { useFiscalRules, FiscalRule } from "@/hooks/useFiscalRules";
import { useBenefitCatalog } from "@/hooks/useBenefitCatalog";

const CONTRACT_TYPES = [
  { value: "clt", label: "CLT" },
  { value: "pj", label: "PJ" },
  { value: "intern", label: "Estagiário" },
  { value: "temp", label: "Temporário" },
];

const FiscalRulesPage = () => {
  const { data: rules = [], isLoading, create, update, remove } = useFiscalRules();
  const { data: benefits = [] } = useBenefitCatalog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<FiscalRule> | null>(null);
  const [taxJson, setTaxJson] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const openCreate = () => {
    setEditItem({ benefit_id: null, contract_type: "clt", tax_treatment: {} });
    setTaxJson('{\n  "incidence": "INSS+IR",\n  "exempt": false,\n  "max_exempt_value": 0\n}');
    setJsonError(null);
    setDialogOpen(true);
  };

  const openEdit = (r: FiscalRule) => {
    setEditItem(r);
    setTaxJson(JSON.stringify(r.tax_treatment, null, 2));
    setJsonError(null);
    setDialogOpen(true);
  };

  const handleTaxChange = (val: string) => {
    setTaxJson(val);
    try { JSON.parse(val); setJsonError(null); } catch { setJsonError("JSON inválido"); }
  };

  const handleSave = () => {
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(taxJson); } catch { setJsonError("JSON inválido"); return; }
    const payload = { ...editItem, tax_treatment: parsed };
    if (editItem?.id) {
      update.mutate(payload as FiscalRule, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const getBenefitName = (id: string | null) => benefits.find((b) => b.id === id)?.name ?? "Geral";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Regras Fiscais</h1>
            <p className="text-muted-foreground text-sm">Configure tratamento tributário por benefício e tipo de contrato</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Regra</Button>
        </div>

        <Card>
          {isLoading ? (
            <CardContent className="py-12 text-center text-muted-foreground">Carregando...</CardContent>
          ) : rules.length === 0 ? (
            <CardContent className="flex flex-col items-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Nenhuma regra fiscal configurada</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>Criar primeira regra</Button>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benefício</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Tratamento</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{getBenefitName(r.benefit_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CONTRACT_TYPES.find((c) => c.value === r.contract_type)?.label ?? r.contract_type ?? "Todos"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {JSON.stringify(r.tax_treatment).slice(0, 60)}
                        {JSON.stringify(r.tax_treatment).length > 60 ? "..." : ""}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(r.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editItem?.id ? "Editar Regra Fiscal" : "Nova Regra Fiscal"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Benefício</Label>
                <Select value={editItem?.benefit_id ?? "__none"} onValueChange={(v) => setEditItem((p) => ({ ...p, benefit_id: v === "__none" ? null : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Geral (todos)</SelectItem>
                    {benefits.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de Contrato</Label>
                <Select value={editItem?.contract_type ?? "clt"} onValueChange={(v) => setEditItem((p) => ({ ...p, contract_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tratamento Tributário (JSON)</Label>
                <Textarea
                  value={taxJson}
                  onChange={(e) => handleTaxChange(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
                {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!!jsonError || create.isPending || update.isPending}>
                {editItem?.id ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FiscalRulesPage;
