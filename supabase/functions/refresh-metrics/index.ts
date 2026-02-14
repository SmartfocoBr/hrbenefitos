import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Metric computation functions
async function computeMetric(
  svc: ReturnType<typeof createClient>,
  tenantId: string,
  metricKey: string,
  params: Record<string, unknown>
): Promise<{ value: number; payload: Record<string, unknown> }> {
  switch (metricKey) {
    case "total_employees": {
      const { count } = await svc
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("company_id", tenantId)
        .eq("status", "active");
      return { value: count ?? 0, payload: {} };
    }

    case "total_wallet_balance": {
      const { data } = await svc
        .from("wallet_balances")
        .select("amount, available_amount, reserved_amount, wallet_id")
        .eq("wallet_id.tenant_id" as never, tenantId);

      // Fallback: aggregate via wallets join
      const { data: wallets } = await svc
        .from("wallets")
        .select("id")
        .eq("tenant_id", tenantId);

      if (!wallets || wallets.length === 0) {
        return { value: 0, payload: { total: 0, available: 0, reserved: 0 } };
      }

      const walletIds = wallets.map((w) => w.id);
      const { data: balances } = await svc
        .from("wallet_balances")
        .select("amount, available_amount, reserved_amount")
        .in("wallet_id", walletIds);

      const totals = (balances ?? []).reduce(
        (acc, b) => ({
          total: acc.total + Number(b.amount),
          available: acc.available + Number(b.available_amount),
          reserved: acc.reserved + Number(b.reserved_amount),
        }),
        { total: 0, available: 0, reserved: 0 }
      );

      return { value: totals.total, payload: totals };
    }

    case "benefits_usage": {
      const { data: policies } = await svc
        .from("company_benefit_policies")
        .select("benefit_id, is_enabled, monthly_limit")
        .eq("company_id", tenantId);

      const enabled = (policies ?? []).filter((p) => p.is_enabled).length;
      const totalLimit = (policies ?? []).reduce(
        (sum, p) => sum + (p.is_enabled ? Number(p.monthly_limit ?? 0) : 0),
        0
      );

      return {
        value: enabled,
        payload: { enabled_count: enabled, total_count: (policies ?? []).length, total_monthly_limit: totalLimit },
      };
    }

    case "pending_instructions": {
      const { count } = await svc
        .from("supplier_instructions")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ["pending", "processing"]);

      return { value: count ?? 0, payload: {} };
    }

    case "connector_health_summary": {
      const { data: connectors } = await svc
        .from("connectors")
        .select("id, name, is_enabled")
        .eq("tenant_id", tenantId);

      if (!connectors || connectors.length === 0) {
        return { value: 0, payload: { healthy: 0, unhealthy: 0, unknown: 0 } };
      }

      const connectorIds = connectors.map((c) => c.id);
      const { data: healths } = await svc
        .from("connector_health")
        .select("connector_id, status")
        .in("connector_id", connectorIds);

      const statusMap = new Map((healths ?? []).map((h) => [h.connector_id, h.status]));
      let healthy = 0, unhealthy = 0, unknown = 0;
      for (const c of connectors) {
        const s = statusMap.get(c.id) ?? "unknown";
        if (s === "success") healthy++;
        else if (s === "failed") unhealthy++;
        else unknown++;
      }

      return { value: healthy, payload: { healthy, unhealthy, unknown, total: connectors.length } };
    }

    default:
      return { value: 0, payload: { error: `Unknown metric: ${metricKey}` } };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
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
    const { tenant_id, metric_keys, params = {} } = body as {
      tenant_id: string;
      metric_keys?: string[];
      params?: Record<string, unknown>;
    };

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: "tenant_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RBAC: check user is admin for this tenant
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

    const keys = metric_keys ?? [
      "total_employees",
      "total_wallet_balance",
      "benefits_usage",
      "pending_instructions",
      "connector_health_summary",
    ];

    const now = new Date().toISOString();
    const results: Record<string, { value: number; payload: Record<string, unknown> }> = {};

    for (const key of keys) {
      const result = await computeMetric(svc, tenant_id, key, params);
      results[key] = result;

      // Upsert into metrics_cache
      await svc.from("metrics_cache").upsert(
        {
          tenant_id,
          metric_key: key,
          period: now,
          value: result.value,
          payload: result.payload,
          refreshed_at: now,
        },
        { onConflict: "tenant_id,metric_key,period" }
      );
    }

    return new Response(JSON.stringify({ metrics: results, refreshed_at: now }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("refresh-metrics error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
