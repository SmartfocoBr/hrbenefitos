import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatCurrency } from "@/lib/walletData";

export function AdminAllocationLimits() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ policy_id: "", max_amount: "", role: "", cost_center: "", period: "monthly" });
  const queryClient = useQueryClient();

  const { data: limits = [], isLoading } = useQuery({
    queryKey: ["allocation-limits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("allocation_limits")
        .select("*, policies(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["policies-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("policies").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createLimit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("allocation_limits").insert({
        policy_id: form.policy_id,
        max_amount: Number(form.max_amount),
        role: form.role || null,
        cost_center: form.cost_center || null,
        period: form.period,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation-limits"] });
      setDialogOpen(false);
      setForm({ policy_id: "", max_amount: "", role: "", cost_center: "", period: "monthly" });
      toast({ title: "Limite criado com sucesso" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteLimit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("allocation_limits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation-limits"] });
      toast({ title: "Limite removido" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Settings className="h-5 w-5" />Limites de Alocação</span>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Limite
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : limits.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">Nenhum limite configurado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Política</TableHead>
                <TableHead>Valor Máximo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Centro de Custo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {limits.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell>{l.policies?.name ?? "-"}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(l.max_amount)}</TableCell>
                  <TableCell><Badge variant="outline">{l.period}</Badge></TableCell>
                  <TableCell>{l.role || "-"}</TableCell>
                  <TableCell>{l.cost_center || "-"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => deleteLimit.mutate(l.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Limite de Alocação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Política</Label>
              <Select value={form.policy_id} onValueChange={(v) => setForm((p) => ({ ...p, policy_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {policies.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor Máximo (R$)</Label>
              <Input type="number" value={form.max_amount} onChange={(e) => setForm((p) => ({ ...p, max_amount: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cargo (opcional)</Label>
                <Input value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} />
              </div>
              <div>
                <Label>Centro de Custo (opcional)</Label>
                <Input value={form.cost_center} onChange={(e) => setForm((p) => ({ ...p, cost_center: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Período</Label>
              <Select value={form.period} onValueChange={(v) => setForm((p) => ({ ...p, period: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createLimit.mutate()} disabled={!form.policy_id || !form.max_amount || createLimit.isPending}>
              {createLimit.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
