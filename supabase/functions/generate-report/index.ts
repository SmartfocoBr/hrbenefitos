import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function toCsvRow(values: unknown[]): string {
  return values
    .map((v) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const svc = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { tenant_id, report_type, params = {} } = body as {
      tenant_id: string;
      report_type: string;
      params?: Record<string, unknown>;
    };

    if (!tenant_id || !report_type) {
      return new Response(JSON.stringify({ error: "tenant_id and report_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RBAC
    const { data: roleCheck } = await svc
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", tenant_id)
      .in("role", ["super_admin", "company_admin", "hr_manager"])
      .limit(1)
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate CSV content based on report type
    let csvContent = "";
    let reportName = "";

    switch (report_type) {
      case "employees": {
        reportName = "relatorio_colaboradores";
        const { data: employees } = await svc
          .from("employees")
          .select("first_name, last_name, email, department, position, status, contract_type, hire_date")
          .eq("company_id", tenant_id)
          .order("first_name");

        const headers = ["Nome", "Sobrenome", "Email", "Departamento", "Cargo", "Status", "Contrato", "Admissão"];
        csvContent = toCsvRow(headers) + "\n";
        for (const e of employees ?? []) {
          csvContent += toCsvRow([e.first_name, e.last_name, e.email, e.department, e.position, e.status, e.contract_type, e.hire_date]) + "\n";
        }
        break;
      }

      case "benefits_summary": {
        reportName = "relatorio_beneficios";
        const { data: policies } = await svc
          .from("company_benefit_policies")
          .select("benefit_id, is_enabled, monthly_limit, min_tenure_days, contract_types")
          .eq("company_id", tenant_id);

        const benefitIds = (policies ?? []).map((p) => p.benefit_id);
        const { data: benefits } = benefitIds.length > 0
          ? await svc.from("benefits").select("id, name, category").in("id", benefitIds)
          : { data: [] };

        const bMap = new Map((benefits ?? []).map((b) => [b.id, b]));

        const headers = ["Benefício", "Categoria", "Ativo", "Limite Mensal", "Dias Min. Empresa", "Tipos Contrato"];
        csvContent = toCsvRow(headers) + "\n";
        for (const p of policies ?? []) {
          const b = bMap.get(p.benefit_id);
          csvContent += toCsvRow([
            b?.name ?? p.benefit_id,
            b?.category ?? "",
            p.is_enabled ? "Sim" : "Não",
            p.monthly_limit ?? "",
            p.min_tenure_days ?? "",
            (p.contract_types ?? []).join("; "),
          ]) + "\n";
        }
        break;
      }

      case "wallet_transactions": {
        reportName = "relatorio_transacoes";
        const { data: wallets } = await svc.from("wallets").select("id").eq("tenant_id", tenant_id);
        const walletIds = (wallets ?? []).map((w) => w.id);

        if (walletIds.length > 0) {
          const { data: txns } = await svc
            .from("wallet_ledger")
            .select("id, wallet_id, employee_id, amount, type, status, created_at")
            .in("wallet_id", walletIds)
            .order("created_at", { ascending: false })
            .limit(1000);

          const headers = ["ID", "Wallet", "Colaborador", "Valor", "Tipo", "Status", "Data"];
          csvContent = toCsvRow(headers) + "\n";
          for (const t of txns ?? []) {
            csvContent += toCsvRow([t.id, t.wallet_id, t.employee_id, t.amount, t.type, t.status, t.created_at]) + "\n";
          }
        }
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown report_type: ${report_type}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Upload CSV to exports bucket
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${tenant_id}/${reportName}_${timestamp}.csv`;
    const encoder = new TextEncoder();
    const fileData = encoder.encode(csvContent);

    // Compute simple checksum
    const hashBuffer = await crypto.subtle.digest("SHA-256", fileData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const { error: uploadErr } = await svc.storage
      .from("exports")
      .upload(fileName, fileData, { contentType: "text/csv", upsert: true });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Failed to upload report" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create signed URL (1 hour)
    const { data: signedUrl } = await svc.storage
      .from("exports")
      .createSignedUrl(fileName, 3600);

    // Insert report_exports record
    const { data: exportRecord, error: insertErr } = await svc
      .from("report_exports")
      .insert({
        tenant_id,
        name: `${reportName}_${timestamp}`,
        type: "csv",
        params,
        file_url: fileName,
        checksum,
        created_by: user.id,
      })
      .select("id, name, type, created_at")
      .single();

    if (insertErr) {
      console.error("Insert export error:", insertErr);
    }

    return new Response(
      JSON.stringify({
        report: exportRecord,
        download_url: signedUrl?.signedUrl ?? null,
        checksum,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-report error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
