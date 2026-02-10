import { useState } from "react";
import { useRoles } from "@/hooks/useRoles";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Plus, Pencil, Loader2, Users } from "lucide-react";

const roleSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(50),
  permissions: z.string().min(2, "Defina ao menos uma permissão"),
});

const RbacAdmin = () => {
  const { roles, rolesLoading, createRole, updateRole } = useRoles();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<{ id: string; name: string; permissions: string[] } | null>(null);
  const [formName, setFormName] = useState("");
  const [formPermissions, setFormPermissions] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string; permissions?: string }>({});

  const openCreate = () => {
    setEditingRole(null);
    setFormName("");
    setFormPermissions("");
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (role: { id: string; name: string; permissions: string[] }) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormPermissions(JSON.stringify(role.permissions, null, 2));
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const result = roleSchema.safeParse({ name: formName, permissions: formPermissions });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        errs[e.path[0] as string] = e.message;
      });
      setFormErrors(errs);
      return;
    }

    let permsArray: string[];
    try {
      permsArray = JSON.parse(formPermissions);
      if (!Array.isArray(permsArray)) throw new Error();
    } catch {
      setFormErrors({ permissions: "JSON inválido. Use formato: [\"perm1\", \"perm2\"]" });
      return;
    }

    try {
      if (editingRole) {
        await updateRole.mutateAsync({ id: editingRole.id, name: formName, permissions: permsArray });
        toast({ title: "Role atualizada!" });
      } else {
        await createRole.mutateAsync({ name: formName, permissions: permsArray });
        toast({ title: "Role criada!" });
      }
      setDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ variant: "destructive", title: "Erro", description: message });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-accent" />
              Gerenciamento de Roles (RBAC)
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie roles e permissões do sistema</p>
          </div>
          <Button onClick={openCreate} className="btn-premium gap-2">
            <Plus className="h-4 w-4" /> Nova Role
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Roles ({roles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Escopo</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <Badge variant={role.tenant_id ? "default" : "secondary"}>
                          {role.tenant_id ? "Tenant" : "Global"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(role.permissions || []).slice(0, 3).map((p, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {String(p)}
                            </Badge>
                          ))}
                          {(role.permissions || []).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(role)}
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
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRole ? "Editar Role" : "Nova Role"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="ex: finance_viewer" />
                {formErrors.name && <p className="text-sm text-destructive">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Permissões (JSON array)</Label>
                <Textarea
                  value={formPermissions}
                  onChange={(e) => setFormPermissions(e.target.value)}
                  placeholder='["company:read", "report:read"]'
                  rows={5}
                  className="font-mono text-sm"
                />
                {formErrors.permissions && <p className="text-sm text-destructive">{formErrors.permissions}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createRole.isPending || updateRole.isPending} className="btn-premium">
                {(createRole.isPending || updateRole.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default RbacAdmin;
