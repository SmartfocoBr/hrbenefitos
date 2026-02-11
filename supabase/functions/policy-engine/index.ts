import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple LRU cache for policies
const policyCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

function getCached(key: string): unknown | null {
  const entry = policyCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.data;
  policyCache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  if (policyCache.size > 200) {
    const oldest = policyCache.keys().next().value;
    if (oldest) policyCache.delete(oldest);
  }
  policyCache.set(key, { data, ts: Date.now() });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await anonClient.auth.getClaims(token);
  if (error || !data?.claims) return null;
  return data.claims.sub as string;
}

async function checkTenantAccess(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  tenantId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("company_id", tenantId)
    .in("role", ["super_admin", "company_admin", "hr_manager"]);
  return !!data && data.length > 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await authenticate(req);
    if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    const body = req.method === "POST" ? await req.json() : {};

    // --- EVALUATE ---
    if (path === "evaluate" && req.method === "POST") {
      const { policy_id, employee_id, context = {} } = body;
      if (!policy_id || !employee_id) {
        return jsonResponse({ error: "policy_id and employee_id required" }, 400);
      }

      // Get tenant from employee
      const { data: emp } = await supabase
        .from("employees")
        .select("company_id")
        .eq("id", employee_id)
        .single();

      if (!emp) return jsonResponse({ error: "Employee not found" }, 404);
      if (!(await checkTenantAccess(supabase, userId, emp.company_id))) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      // Call DB function
      const { data: result, error: evalErr } = await supabase.rpc(
        "evaluate_policy",
        { p_policy_id: policy_id, p_employee_id: employee_id, p_context: context }
      );

      if (evalErr) return jsonResponse({ error: evalErr.message }, 500);
      return jsonResponse(result);
    }

    // --- SIMULATE ---
    if (path === "simulate" && req.method === "POST") {
      const { policy_id, employee_id, context = {} } = body;
      if (!policy_id || !employee_id) {
        return jsonResponse({ error: "policy_id and employee_id required" }, 400);
      }

      const { data: emp } = await supabase
        .from("employees")
        .select("company_id")
        .eq("id", employee_id)
        .single();

      if (!emp) return jsonResponse({ error: "Employee not found" }, 404);
      if (!(await checkTenantAccess(supabase, userId, emp.company_id))) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      const { data: result, error: simErr } = await supabase.rpc(
        "simulate_policy",
        { p_policy_id: policy_id, p_employee_id: employee_id, p_context: context }
      );

      if (simErr) return jsonResponse({ error: simErr.message }, 500);
      return jsonResponse(result);
    }

    // --- BATCH RECALC ---
    if (path === "batch-recalc" && req.method === "POST") {
      const { policy_id, tenant_id } = body;
      if (!policy_id || !tenant_id) {
        return jsonResponse({ error: "policy_id and tenant_id required" }, 400);
      }

      if (!(await checkTenantAccess(supabase, userId, tenant_id))) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      // Fetch affected employees
      const { data: employees, error: empErr } = await supabase
        .from("employees")
        .select("id")
        .eq("company_id", tenant_id)
        .in("status", ["active", "on_leave"]);

      if (empErr) return jsonResponse({ error: empErr.message }, 500);
      if (!employees || employees.length === 0) {
        return jsonResponse({ message: "No active employees", evaluated: 0 });
      }

      // Evaluate in chunks
      const CHUNK = 50;
      let evaluated = 0;
      let errors = 0;
      const sampleErrors: string[] = [];

      for (let i = 0; i < employees.length; i += CHUNK) {
        const chunk = employees.slice(i, i + CHUNK);
        const promises = chunk.map(async (emp) => {
          const { error: evalErr } = await supabase.rpc("simulate_policy", {
            p_policy_id: policy_id,
            p_employee_id: emp.id,
            p_context: { batch: true },
          });
          if (evalErr) {
            errors++;
            if (sampleErrors.length < 5) sampleErrors.push(`${emp.id}: ${evalErr.message}`);
          } else {
            evaluated++;
          }
        });
        await Promise.all(promises);
      }

      return jsonResponse({
        policy_id,
        tenant_id,
        total_employees: employees.length,
        evaluated,
        errors,
        sample_errors: sampleErrors,
      });
    }

    return jsonResponse({ error: "Not found. Use /evaluate, /simulate, or /batch-recalc" }, 404);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
