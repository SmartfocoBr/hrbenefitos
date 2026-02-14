import { useState } from "react";
import { useSupplierErrorMap } from "@/hooks/useReconciliations";
import { useSupplierProviders } from "@/hooks/useSupplierProviders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Loader2 } from "lucide-react";

const categoryColors: Record<string, string> = {
  transient: "bg-yellow-500/10 text-yellow-700",
  permanent: "bg-red-500/10 text-red-700",
  unknown: "bg-muted text-muted-foreground",
};

interface Props {
  tenantId: string | null;
}

export default function ErrorMapTab({ tenantId }: Props) {
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState("transient");
  const [formAction, setFormAction] = useState("");

  const { data: providers } = useSupplierProviders(tenantId ?? undefined);
  const { data: mappings, isLoading, upsertMapping } = useSupplierErrorMap(
    selectedSupplier || undefined
  );

  const openNew = () => {
    setFormCode("");
    setFormCategory("transient");
    setFormAction("");
    setEditDialog(true);
  };

  const openEdit = (code: string, category: string, action: unknown) => {
    setFormCode(code);
    setFormCategory(category);
    setFormAction(typeof action === "object" ? JSON.stringify(action, null, 2) : String(action ?? ""));
    setEditDialog(true);
  };

  const handleSave = () => {
    if (!selectedSupplier || !formCode) return;
    let parsedAction: Record<string, unknown> = {};
    try {
      parsedAction = JSON.parse(formAction || "{}");
    } catch {
      parsedAction = { description: formAction };
    }
    upsertMapping.mutate(
      {
        supplier_id: selectedSupplier,
        external_code: formCode.trim(),
        category: formCategory,
        recommended_action: parsedAction,
      },
      { onSuccess: () => setEditDialog(false) }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Mapeamento de Erros</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecione fornecedor" />
            </SelectTrigger>
            <SelectContent>
              {providers?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={openNew} disabled={!selectedSupplier}>
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedSupplier ? (
          <p className="text-center text-muted-foreground py-8">Selecione um fornecedor.</p>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !mappings?.length ? (
          <p className="text-center text-muted-foreground py-8">Nenhum mapeamento encontrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código Externo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Ação Recomendada</TableHead>
                <TableHead className="text-right">Editar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">{m.external_code}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={categoryColors[m.category] ?? ""}>
                      {m.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-[300px] truncate">
                    {typeof m.recommended_action === "object"
                      ? JSON.stringify(m.recommended_action)
                      : String(m.recommended_action ?? "")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(m.external_code, m.category, m.recommended_action)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formCode ? "Editar Mapeamento" : "Novo Mapeamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código Externo</Label>
              <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="ERR_001" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transient">Transiente (retry)</SelectItem>
                  <SelectItem value="permanent">Permanente</SelectItem>
                  <SelectItem value="unknown">Desconhecido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ação Recomendada (JSON)</Label>
              <Textarea
                value={formAction}
                onChange={(e) => setFormAction(e.target.value)}
                placeholder='{"action": "retry", "description": "Tentar novamente"}'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsertMapping.isPending || !formCode}>
              {upsertMapping.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
