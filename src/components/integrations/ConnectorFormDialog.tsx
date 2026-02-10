import { useState } from "react";
import { useConnectors, useCreateConnector, useUpdateConnector } from "@/hooks/useConnectors";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ConnectorFormDialogProps {
  open: boolean;
  onClose: () => void;
  connector?: {
    id: string;
    name: string;
    connector_type: string;
    config: Record<string, unknown> | null;
    is_enabled: boolean | null;
    tenant_id: string;
  } | null;
}

const CONNECTOR_TYPES = [
  { value: "erp_totvs", label: "ERP - TOTVS Protheus" },
  { value: "erp_sap", label: "ERP - SAP" },
  { value: "erp_oracle", label: "ERP - Oracle" },
  { value: "provider_vr", label: "Provider - VR" },
  { value: "provider_alelo", label: "Provider - Alelo" },
  { value: "provider_flash", label: "Provider - Flash" },
  { value: "webhook", label: "Webhook" },
  { value: "custom_api", label: "Custom API" },
];

const ConnectorFormDialog = ({ open, onClose, connector }: ConnectorFormDialogProps) => {
  const isEdit = !!connector;
  const createMutation = useCreateConnector();
  const updateMutation = useUpdateConnector();

  const [name, setName] = useState(connector?.name ?? "");
  const [type, setType] = useState(connector?.connector_type ?? "");
  const [endpoint, setEndpoint] = useState((connector?.config as any)?.endpoint ?? "");
  const [healthEndpoint, setHealthEndpoint] = useState((connector?.config as any)?.health_endpoint ?? "");
  const [method, setMethod] = useState((connector?.config as any)?.method ?? "POST");
  const [configJson, setConfigJson] = useState(
    connector?.config ? JSON.stringify(connector.config, null, 2) : "{}"
  );
  const [enabled, setEnabled] = useState(connector?.is_enabled ?? true);

  const handleSubmit = () => {
    let parsedConfig: Record<string, unknown> = {};
    try {
      parsedConfig = JSON.parse(configJson);
    } catch {
      parsedConfig = {};
    }

    const config = {
      ...parsedConfig,
      endpoint,
      health_endpoint: healthEndpoint || undefined,
      method,
    };

    if (isEdit && connector) {
      updateMutation.mutate({ id: connector.id, name, connector_type: type, config, is_enabled: enabled }, {
        onSuccess: () => onClose(),
      });
    } else {
      createMutation.mutate({ name, connector_type: type, tenant_id: connector?.tenant_id ?? "", config }, {
        onSuccess: () => onClose(),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Conector" : "Novo Conector"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do conector" />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {CONNECTOR_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Endpoint</Label>
            <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://api.example.com/sync" />
          </div>

          <div className="space-y-2">
            <Label>Health Endpoint (opcional)</Label>
            <Input value={healthEndpoint} onChange={(e) => setHealthEndpoint(e.target.value)} placeholder="https://api.example.com/health" />
          </div>

          <div className="space-y-2">
            <Label>Método HTTP</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Configuração Extra (JSON)</Label>
            <Textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={4}
              className="font-mono text-sm"
              placeholder='{"headers": {}, "mapping": {}}'
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label>Habilitado</Label>
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ Credenciais (API keys, tokens) são gerenciadas de forma segura via backend e não podem ser inseridas aqui.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !name || !type}>
            {isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectorFormDialog;
