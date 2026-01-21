import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, Loader2 } from "lucide-react";

const policySchema = z.object({
  company_id: z.string().uuid("Selecione uma empresa"),
  benefit_id: z.string().uuid("Selecione um benefício"),
  is_enabled: z.boolean().default(true),
  monthly_limit: z.string().optional(),
  min_tenure_days: z.string().optional(),
  contract_types: z.array(z.string()).min(1, "Selecione ao menos um tipo de contrato"),
});

type PolicyFormValues = z.infer<typeof policySchema>;

interface BenefitPolicyFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companies: { id: string; name: string }[];
}

const contractTypeOptions = [
  { id: "clt", label: "CLT" },
  { id: "pj", label: "PJ" },
  { id: "intern", label: "Estágio" },
  { id: "temp", label: "Temporário" },
];

export function BenefitPolicyFormDialog({ open, onClose, onSuccess, companies }: BenefitPolicyFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [benefits, setBenefits] = useState<{ id: string; name: string; category: string }[]>([]);
  const { toast } = useToast();

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      company_id: "",
      benefit_id: "",
      is_enabled: true,
      monthly_limit: "",
      min_tenure_days: "0",
      contract_types: ["clt"],
    },
  });

  useEffect(() => {
    async function fetchBenefits() {
      const { data } = await supabase
        .from("benefits")
        .select("id, name, category")
        .eq("is_active", true)
        .order("name");
      
      if (data) setBenefits(data);
    }
    if (open) fetchBenefits();
  }, [open]);

  const onSubmit = async (values: PolicyFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("company_benefit_policies").insert([{
        company_id: values.company_id,
        benefit_id: values.benefit_id,
        is_enabled: values.is_enabled,
        monthly_limit: values.monthly_limit ? parseFloat(values.monthly_limit) : null,
        min_tenure_days: values.min_tenure_days ? parseInt(values.min_tenure_days) : 0,
        contract_types: values.contract_types as ("clt" | "pj" | "intern" | "temp")[],
      }]);

      if (error) throw error;

      toast({
        title: "Política cadastrada!",
        description: "A política de benefício foi configurada com sucesso.",
      });

      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message || "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Nova Política de Benefício
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="benefit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benefício *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o benefício" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {benefits.map((benefit) => (
                        <SelectItem key={benefit.id} value={benefit.id}>
                          {benefit.name} ({benefit.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthly_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite Mensal (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="800" {...field} />
                    </FormControl>
                    <FormDescription>Deixe vazio para sem limite</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_tenure_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carência (dias)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="90" {...field} />
                    </FormControl>
                    <FormDescription>Tempo mínimo de empresa</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contract_types"
              render={() => (
                <FormItem>
                  <FormLabel>Tipos de Contrato Elegíveis *</FormLabel>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {contractTypeOptions.map((type) => (
                      <FormField
                        key={type.id}
                        control={form.control}
                        name="contract_types"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(type.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, type.id]);
                                  } else {
                                    field.onChange(field.value?.filter((v) => v !== type.id));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {type.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="font-medium cursor-pointer">Política Ativa</FormLabel>
                    <FormDescription>
                      Se desmarcado, a política não será aplicada aos colaboradores
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-premium" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cadastrar Política
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
