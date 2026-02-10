import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHUNK_SIZE = 100;

interface MappingRule {
  source: string;
  target: string;
  type?: "text" | "date" | "number" | "email";
  required?: boolean;
  default?: string;
}

interface RowError {
  row: number;
  field: string;
  value: string;
  error: string;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function normalizeValue(value: string, type: string): { parsed: unknown; error: string | null } {
  const trimmed = (value ?? "").trim();

  switch (type) {
    case "date": {
      if (!trimmed) return { parsed: null, error: null };
      // Try common formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
      let d: Date | null = null;
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        d = new Date(trimmed);
      } else if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(trimmed)) {
        const parts = trimmed.split(/[\/\-]/);
        d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      if (!d || isNaN(d.getTime())) return { parsed: null, error: `Invalid date: ${trimmed}` };
      return { parsed: d.toISOString().split("T")[0], error: null };
    }
    case "number": {
      if (!trimmed) return { parsed: null, error: null };
      const num = Number(trimmed.replace(",", "."));
      if (isNaN(num)) return { parsed: null, error: `Invalid number: ${trimmed}` };
      return { parsed: num, error: null };
    }
    case "email": {
      if (!trimmed) return { parsed: null, error: null };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
        return { parsed: trimmed, error: `Invalid email: ${trimmed}` };
      return { parsed: trimmed.toLowerCase(), error: null };
    }
    default:
      return { parsed: trimmed || null, error: null };
  }
}

function validateAndMapRow(
  row: Record<string, string>,
  mapping: MappingRule[],
  rowIndex: number
): { mapped: Record<string, unknown>; errors: RowError[] } {
  const mapped: Record<string, unknown> = {};
  const errors: RowError[] = [];

  for (const rule of mapping) {
    const rawValue = row[rule.source] ?? rule.default ?? "";

    if (rule.required && !rawValue.trim()) {
      errors.push({ row: rowIndex, field: rule.target, value: "", error: `Required field missing: ${rule.source}` });
      continue;
    }

    const { parsed, error } = normalizeValue(rawValue, rule.type ?? "text");
    if (error) {
      errors.push({ row: rowIndex, field: rule.target, value: rawValue, error });
    }
    mapped[rule.target] = parsed;
  }

  return { mapped, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { file_url, mapping_id, tenant_id, source, dry_run, idempotency_key } = body;

    if (!file_url || !mapping_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: "file_url, mapping_id, and tenant_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // RBAC check
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("company_id", tenant_id)
      .in("role", ["super_admin", "company_admin", "hr_manager"]);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: check existing job
    if (idempotency_key) {
      const { data: existingJob } = await supabase
        .from("import_jobs")
        .select("id, status, summary")
        .eq("tenant_id", tenant_id)
        .eq("summary->>idempotency_key", idempotency_key)
        .maybeSingle();

      if (existingJob) {
        return new Response(
          JSON.stringify({ import_job_id: existingJob.id, status: existingJob.status, summary: existingJob.summary, deduplicated: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch mapping rules
    const { data: mappingRecord, error: mapErr } = await supabase
      .from("import_mappings")
      .select("mapping")
      .eq("id", mapping_id)
      .eq("tenant_id", tenant_id)
      .single();

    if (mapErr || !mappingRecord) {
      return new Response(JSON.stringify({ error: "Mapping not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mappingRules: MappingRule[] = Array.isArray(mappingRecord.mapping)
      ? mappingRecord.mapping
      : (mappingRecord.mapping as Record<string, unknown>).rules
        ? ((mappingRecord.mapping as Record<string, unknown>).rules as MappingRule[])
        : [];

    if (!mappingRules.length) {
      return new Response(JSON.stringify({ error: "Mapping has no rules" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch file
    const fileResp = await fetch(file_url);
    if (!fileResp.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch import file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileText = await fileResp.text();
    const rows = parseCsv(fileText);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "File is empty or has no data rows" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create import job
    const jobSummary: Record<string, unknown> = {
      total_rows: rows.length,
      idempotency_key: idempotency_key ?? null,
      dry_run: !!dry_run,
    };

    const { data: job, error: jobErr } = await supabase
      .from("import_jobs")
      .insert({
        tenant_id,
        initiated_by: userId,
        source: source ?? "csv",
        mapping_id,
        status: "processing",
        summary: jobSummary,
      })
      .select()
      .single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Failed to create import job" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process rows
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const allErrors: RowError[] = [];

    for (let chunkStart = 0; chunkStart < rows.length; chunkStart += CHUNK_SIZE) {
      const chunk = rows.slice(chunkStart, chunkStart + CHUNK_SIZE);
      const employeesToUpsert: Record<string, unknown>[] = [];

      for (let i = 0; i < chunk.length; i++) {
        const rowIndex = chunkStart + i + 2; // +2 for header + 1-indexed
        const { mapped, errors } = validateAndMapRow(chunk[i], mappingRules, rowIndex);
        allErrors.push(...errors);

        if (errors.some((e) => mappingRules.find((r) => r.target === e.field)?.required)) {
          skipped++;
          continue;
        }

        employeesToUpsert.push({
          company_id: tenant_id,
          ...mapped,
        });
      }

      if (!dry_run && employeesToUpsert.length > 0) {
        // Check for existing by external_id
        for (const emp of employeesToUpsert) {
          const extId = emp.external_id as string | null;
          if (extId) {
            const { data: existing } = await supabase
              .from("employees")
              .select("id")
              .eq("company_id", tenant_id)
              .eq("external_id", extId)
              .maybeSingle();

            if (existing) {
              const { error: upErr } = await supabase
                .from("employees")
                .update(emp as any)
                .eq("id", existing.id);
              if (upErr) {
                allErrors.push({ row: 0, field: "update", value: extId, error: upErr.message });
              } else {
                updated++;
              }
            } else {
              const { error: insErr } = await supabase
                .from("employees")
                .insert(emp as any);
              if (insErr) {
                allErrors.push({ row: 0, field: "insert", value: extId ?? "", error: insErr.message });
              } else {
                inserted++;
              }
            }
          } else {
            if (!dry_run) {
              const { error: insErr } = await supabase
                .from("employees")
                .insert(emp as any);
              if (insErr) {
                allErrors.push({ row: 0, field: "insert", value: "", error: insErr.message });
              } else {
                inserted++;
              }
            }
          }
        }

        if (dry_run) {
          inserted += employeesToUpsert.length;
        }
      }
    }

    // Build report
    const reportData = {
      total_rows: rows.length,
      inserted,
      updated,
      skipped,
      error_count: allErrors.length,
      sample_errors: allErrors.slice(0, 50),
      dry_run: !!dry_run,
    };

    // Update job
    const finalStatus = allErrors.length > 0 && inserted === 0 && updated === 0 ? "failed" : "completed";
    await supabase
      .from("import_jobs")
      .update({
        status: finalStatus,
        summary: reportData,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // Store report
    const reportJson = JSON.stringify(reportData, null, 2);
    const reportPath = `${tenant_id}/${job.id}/report.json`;

    let fileUrl: string | null = null;
    if (!dry_run) {
      const { error: uploadErr } = await supabase.storage
        .from("exports")
        .upload(reportPath, reportJson, { contentType: "application/json", upsert: true });

      if (!uploadErr) {
        fileUrl = reportPath;
      }
    }

    // Create import_report
    const checksum = await crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(reportJson))
      .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""));

    await supabase.from("import_reports").insert({
      import_job_id: job.id,
      report: reportData,
      checksum,
      file_url: fileUrl,
    });

    return new Response(
      JSON.stringify({
        import_job_id: job.id,
        status: finalStatus,
        summary: reportData,
        dry_run: !!dry_run,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
