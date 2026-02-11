import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { useBenefitCatalog, BenefitCatalogItem } from "@/hooks/useBenefitCatalog";

const BENEFIT_TYPES = [
  { value: "vr", label: "Vale Refeição" },
  { value: "va", label: "Vale Alimentação" },
  { value: "vt", label: "Vale Transporte" },
  { value: "plr", label: "PLR" },
  { value: "saude", label: "Plano de Saúde" },
  { value: "odonto", label: "Plano Odontológico" },
  { value: "seguro", label: "Seguro de Vida" },
  { value: "gym", label: "Gympass / Wellhub" },
  { value: "education", label: "Educação" },
  { value: "other", label: "Outro" },
];

const BenefitCatalogPage = () => {
  const { data: benefits = [], isLoading, create, update, remove } = useBenefitCatalog();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [editItem, setEditItem] = useState<Partial<BenefitCatalogItem> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = benefits.filter((b) => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && b.benefit_type !== typeFilter) return false;
    if (activeFilter === "active" && !b.active) return false;
    if (activeFilter === "inactive" && b.active) return false;
    return true;
  });

  const openCreate = () => {
    setEditItem({ name: "", code: "", benefit_type: "vr", description: "", active: true });
    setDialogOpen(true);
  };

  const openEdit = (item: BenefitCatalogItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editItem?.name || !editItem?.code) return;
    if (editItem.id) {
      update.mutate(editItem as BenefitCatalogItem, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(editItem, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Catálogo de Benefícios</h1>
            <p className="text-muted-foreground text-sm">Gerencie os benefícios disponíveis para sua empresa</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Benefício</Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {BENEFIT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Nenhum benefício encontrado</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>Criar primeiro benefício</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <Card key={b.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{b.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{b.code}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(b.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {b.description && <p className="text-sm text-muted-foreground line-clamp-2">{b.description}</p>}
                  <div className="flex gap-2">
                    <Badge variant="outline">{BENEFIT_TYPES.find((t) => t.value === b.benefit_type)?.label || b.benefit_type}</Badge>
                    <Badge variant={b.active ? "default" : "secondary"}>{b.active ? "Ativo" : "Inativo"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editItem?.id ? "Editar Benefício" : "Novo Benefício"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Código</Label>
                  <Input value={editItem?.code ?? ""} onChange={(e) => setEditItem((p) => ({ ...p, code: e.target.value }))} placeholder="VR-001" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={editItem?.benefit_type ?? "vr"} onValueChange={(v) => setEditItem((p) => ({ ...p, benefit_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BENEFIT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={editItem?.name ?? ""} onChange={(e) => setEditItem((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea value={editItem?.description ?? ""} onChange={(e) => setEditItem((p) => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editItem?.active ?? true} onCheckedChange={(v) => setEditItem((p) => ({ ...p, active: v }))} />
                <Label>Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
                {editItem?.id ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default BenefitCatalogPage;
