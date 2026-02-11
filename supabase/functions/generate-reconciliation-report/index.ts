import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function computeChecksum(data: string): string {
  // Simple hash for integrity verification
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supplier_id, tenant_id, period_start, period_end, generated_by } = await req.json();

    if (!supplier_id || !tenant_id || !period_start || !period_end) {
      return new Response(
        JSON.stringify({ error: "supplier_id, tenant_id, period_start, period_end required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch completed instructions for the period
    const { data: instructions, error: instrErr } = await supabase
      .from("supplier_instructions")
      .select("id, status, payload, provider_response, provider_tx_id, created_at, processed_at, transaction_id")
      .eq("supplier_id", supplier_id)
      .eq("tenant_id", tenant_id)
      .gte("created_at", period_start)
      .lte("created_at", period_end + "T23:59:59Z")
      .order("created_at", { ascending: true });

    if (instrErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch instructions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch supplier balance
    const { data: balanceData } = await supabase
      .from("supplier_balances")
      .select("reported_balance, last_reported_at")
      .eq("supplier_id", supplier_id)
      .maybeSingle();

    // Aggregate stats
    const total = instructions?.length ?? 0;
    const completed = instructions?.filter((i) => i.status === "completed").length ?? 0;
    const failed = instructions?.filter((i) => i.status === "failed").length ?? 0;
    const pending = instructions?.filter((i) => i.status === "pending" || i.status === "processing").length ?? 0;
    const errors = instructions?.filter((i) => i.status === "error").length ?? 0;

    // Build transaction summary from linked wallet_ledger
    const txIds = (instructions ?? [])
      .map((i) => i.transaction_id)
      .filter(Boolean) as string[];

    let totalAmount = 0;
    if (txIds.length > 0) {
      const { data: ledgerEntries } = await supabase
        .from("wallet_ledger")
        .select("amount")
        .in("id", txIds);

      totalAmount = (ledgerEntries ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0);
    }

    const report = {
      period: { start: period_start, end: period_end },
      supplier_id,
      tenant_id,
      summary: {
        total_instructions: total,
        completed,
        failed,
        pending,
        errors,
        total_transaction_amount: totalAmount,
        supplier_reported_balance: balanceData?.reported_balance ?? null,
        balance_last_reported: balanceData?.last_reported_at ?? null,
        discrepancy: balanceData?.reported_balance != null
          ? totalAmount - (balanceData.reported_balance as number)
          : null,
      },
      instructions: (instructions ?? []).map((i) => ({
        id: i.id,
        status: i.status,
        provider_tx_id: i.provider_tx_id,
        created_at: i.created_at,
        processed_at: i.processed_at,
      })),
      generated_at: new Date().toISOString(),
    };

    // Generate CSV
    const csvLines = [
      "instruction_id,status,provider_tx_id,created_at,processed_at",
      ...(instructions ?? []).map((i) =>
        `${i.id},${i.status},${i.provider_tx_id ?? ""},${i.created_at},${i.processed_at ?? ""}`
      ),
      "",
      `Total Instructions,${total}`,
      `Completed,${completed}`,
      `Failed,${failed}`,
      `Pending,${pending}`,
      `Errors,${errors}`,
      `Total Amount,${totalAmount}`,
      `Supplier Balance,${balanceData?.reported_balance ?? "N/A"}`,
    ];
    const csvContent = csvLines.join("\n");
    const checksum = computeChecksum(csvContent);

    // Upload to exports bucket
    const filePath = `${tenant_id}/reconciliation/${supplier_id}/${period_start}_${period_end}.csv`;
    const { error: uploadErr } = await supabase.storage
      .from("exports")
      .upload(filePath, csvContent, {
        contentType: "text/csv",
        upsert: true,
      });

    const fileUrl = uploadErr ? null : filePath;

    // Insert reconciliation record
    const { data: recon, error: reconErr } = await supabase
      .from("reconciliations")
      .insert({
        tenant_id,
        supplier_id,
        period_start,
        period_end,
        generated_by: generated_by ?? null,
        report,
        file_url: fileUrl,
        checksum,
      })
      .select("id")
      .single();

    if (reconErr) {
      return new Response(
        JSON.stringify({ error: "Failed to create reconciliation record", detail: reconErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        reconciliation_id: recon.id,
        summary: report.summary,
        file_url: fileUrl,
        checksum,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
