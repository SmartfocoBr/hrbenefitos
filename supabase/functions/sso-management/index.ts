import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials");
  return createClient(url, serviceKey);
}

async function getActorId(req: Request): Promise<string | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const client = createClient(url, anonKey);
    const { data } = await client.auth.getUser(authHeader.replace("Bearer ", ""));
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

async function auditLog(
  supabase: ReturnType<typeof createClient>,
  actorId: string | null,
  tenantId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  payload: Record<string, unknown>
) {
  const now = new Date().toISOString();
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload) + now);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  await supabase.from("auth_audit_logs").insert({
    actor_id: actorId,
    tenant_id: tenantId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    payload,
    hash,
    created_at: now,
  });
}

// Validate SAML metadata fields
function validateSamlMetadata(metadata: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!metadata.entity_id) errors.push("Missing entity_id");
  if (!metadata.sso_url) errors.push("Missing sso_url (SingleSignOnService URL)");
  if (!metadata.certificate) errors.push("Missing certificate");
  const cert = metadata.certificate as string;
  if (cert && cert.length > 10000) errors.push("Certificate too large (max 10KB)");
  return errors;
}

// Validate OIDC metadata fields
function validateOidcMetadata(metadata: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!metadata.issuer) errors.push("Missing issuer");
  if (!metadata.authorization_endpoint) errors.push("Missing authorization_endpoint");
  if (!metadata.token_endpoint) errors.push("Missing token_endpoint");
  if (!metadata.client_id) errors.push("Missing client_id");
  return errors;
}

// Validate OAuth metadata fields
function validateOauthMetadata(metadata: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!metadata.client_id) errors.push("Missing client_id");
  if (!metadata.authorize_url) errors.push("Missing authorize_url");
  if (!metadata.token_url) errors.push("Missing token_url");
  return errors;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    const supabase = getServiceClient();
    const actorId = await getActorId(req);

    // ========== VERIFY SSO METADATA ==========
    if (path === "verify-metadata" && req.method === "POST") {
      const { tenant_id, provider_type, metadata } = await req.json();

      if (!tenant_id || !provider_type || !metadata) {
        return new Response(JSON.stringify({ error: "Missing required fields: tenant_id, provider_type, metadata" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let validationErrors: string[] = [];
      if (provider_type === "saml") {
        validationErrors = validateSamlMetadata(metadata);
      } else if (provider_type === "oidc") {
        validationErrors = validateOidcMetadata(metadata);
      } else if (provider_type === "oauth") {
        validationErrors = validateOauthMetadata(metadata);
      } else {
        return new Response(JSON.stringify({ error: "Invalid provider_type. Must be saml, oidc, or oauth" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (validationErrors.length > 0) {
        return new Response(JSON.stringify({ valid: false, errors: validationErrors }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Store in sso_providers
      const { data: ssoProvider, error: insertError } = await supabase
        .from("sso_providers")
        .upsert({
          tenant_id,
          provider_type,
          metadata,
          enabled: false,
        }, { onConflict: "id" })
        .select()
        .single();

      if (insertError) throw insertError;

      await auditLog(supabase, actorId, tenant_id, "SSO_METADATA_VERIFIED", "sso_providers", ssoProvider?.id, {
        provider_type,
        status: "validated_and_stored",
      });

      return new Response(JSON.stringify({
        valid: true,
        provider_id: ssoProvider?.id,
        message: "Metadata validated and stored. Provider is disabled until explicitly enabled.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== SSO HEALTH CHECK ==========
    if (path === "health-check" && req.method === "POST") {
      const { provider_id } = await req.json();

      if (!provider_id) {
        return new Response(JSON.stringify({ error: "Missing provider_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: provider, error } = await supabase
        .from("sso_providers")
        .select("*")
        .eq("id", provider_id)
        .single();

      if (error || !provider) {
        return new Response(JSON.stringify({ healthy: false, error: "Provider not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Re-validate stored metadata
      let validationErrors: string[] = [];
      const meta = provider.metadata as Record<string, unknown>;
      if (provider.provider_type === "saml") validationErrors = validateSamlMetadata(meta);
      else if (provider.provider_type === "oidc") validationErrors = validateOidcMetadata(meta);
      else if (provider.provider_type === "oauth") validationErrors = validateOauthMetadata(meta);

      const healthy = validationErrors.length === 0;

      await auditLog(supabase, actorId, provider.tenant_id, "SSO_HEALTH_CHECK", "sso_providers", provider_id, {
        healthy,
        errors: validationErrors,
      });

      return new Response(JSON.stringify({ healthy, provider_type: provider.provider_type, errors: validationErrors }), {
        status: healthy ? 200 : 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== STORE TOTP SECRET ==========
    if (path === "store-totp" && req.method === "POST") {
      const { user_id, encrypted_secret, backup_codes } = await req.json();

      if (!user_id || !encrypted_secret) {
        return new Response(JSON.stringify({ error: "Missing user_id or encrypted_secret" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: upsertError } = await supabase
        .from("mfa_settings")
        .upsert({
          user_id,
          totp_secret: encrypted_secret,
          is_enabled: true,
          backup_codes: backup_codes || null,
        }, { onConflict: "user_id" });

      if (upsertError) throw upsertError;

      await auditLog(supabase, actorId, null, "MFA_TOTP_STORED", "mfa_settings", user_id, {
        action: "totp_secret_stored",
      });

      return new Response(JSON.stringify({ success: true, message: "TOTP secret stored securely" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown endpoint. Use: verify-metadata, health-check, store-totp" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("SSO Management Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
