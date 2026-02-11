import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, History, Play, FileCode2, ShieldCheck } from "lucide-react";
import { usePolicies, usePolicyVersions, Policy } from "@/hooks/usePolicies";
import PolicySimulationModal from "@/components/catalog/PolicySimulationModal";

const POLICY_TYPES = [
  { value: "eligibility", label: "Elegibilidade" },
  { value: "allocation", label: "Alocação" },
  { value: "fiscal", label: "Fiscal" },
  { value: "custom", label: "Personalizada" },
];

const PolicyEditorPage = () => {
  const { data: policies = [], isLoading, create, update, remove } = usePolicies();
  const [selected, setSelected] = useState<Policy | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Policy> | null>(null);
  const [rulesJson, setRulesJson] = useState("[]");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const [simPolicyId, setSimPolicyId] = useState<string | null>(null);

  const { data: versions = [] } = usePolicyVersions(selected?.id ?? null);

  const openCreate = () => {
    setEditItem({ name: "", description: "", policy_type: "eligibility", rules: [] });
    setRulesJson("[]");
    setJsonError(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Policy) => {
    setEditItem(p);
    setRulesJson(JSON.stringify(p.rules, null, 2));
    setJsonError(null);
    setDialogOpen(true);
  };

  const handleRulesChange = (val: string) => {
    setRulesJson(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch {
      setJsonError("JSON inválido");
    }
  };

  const handleSave = () => {
    if (!editItem?.name) return;
    let parsedRules: unknown[];
    try {
      parsedRules = JSON.parse(rulesJson);
    } catch {
      setJsonError("JSON inválido");
      return;
    }
    const payload = { ...editItem, rules: parsedRules };
    if (editItem.id) {
      update.mutate(payload as Policy, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const revertToVersion = (v: { rules: unknown[]; version_number: number }) => {
    if (!selected) return;
    update.mutate({ id: selected.id, rules: v.rules } as any);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editor de Políticas</h1>
            <p className="text-muted-foreground text-sm">Defina regras de elegibilidade, alocação e fiscais</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Política</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Policy list */}
          <div className="lg:col-span-1 space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : policies.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-8">
                  <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma política</p>
                </CardContent>
              </Card>
            ) : (
              policies.map((p) => (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selected?.id === p.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelected(p)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm">{p.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">v{p.version}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {POLICY_TYPES.find((t) => t.value === p.policy_type)?.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selected.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setSimPolicyId(selected.id); setSimOpen(true); }}>
                        <Play className="h-3.5 w-3.5 mr-1" />Simular
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />Editar
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => { remove.mutate(selected.id); setSelected(null); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="rules">
                    <TabsList>
                      <TabsTrigger value="rules"><FileCode2 className="h-3.5 w-3.5 mr-1" />Regras</TabsTrigger>
                      <TabsTrigger value="history"><History className="h-3.5 w-3.5 mr-1" />Versões</TabsTrigger>
                    </TabsList>
                    <TabsContent value="rules" className="mt-4">
                      <p className="text-sm text-muted-foreground mb-3">{selected.description}</p>
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-xs font-mono overflow-auto max-h-[400px] whitespace-pre-wrap">
                          {JSON.stringify(selected.rules, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="history" className="mt-4">
                      <ScrollArea className="h-[400px]">
                        {versions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhuma versão anterior</p>
                        ) : (
                          <div className="space-y-3">
                            {versions.map((v) => (
                              <Card key={v.id}>
                                <CardContent className="py-3 px-4 flex items-center justify-between">
                                  <div>
                                    <span className="font-medium text-sm">Versão {v.version_number}</span>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(v.created_at).toLocaleString("pt-BR")}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => revertToVersion(v)}
                                  >
                                    Reverter
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center py-16">
                  <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Selecione uma política para ver detalhes</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editItem?.id ? "Editar Política" : "Nova Política"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={editItem?.name ?? ""} onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={editItem?.policy_type ?? "eligibility"} onValueChange={(v) => setEditItem((p) => ({ ...p, policy_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POLICY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea value={editItem?.description ?? ""} onChange={(e) => setEditItem((p) => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Regras (JSON DSL)</Label>
                <Textarea
                  value={rulesJson}
                  onChange={(e) => handleRulesChange(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                  placeholder='[{"condition": {"field": "tenure_days", "op": ">=", "value": 90}, "description": "Mínimo 90 dias"}]'
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

        {/* Simulation Modal */}
        <PolicySimulationModal
          open={simOpen}
          onOpenChange={setSimOpen}
          policyId={simPolicyId}
        />
      </div>
    </DashboardLayout>
  );
};

export default PolicyEditorPage;
