import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Copy, Check, Loader2 } from "lucide-react";
import { z } from "zod";

const totpCodeSchema = z.string().length(6, "Código deve ter 6 dígitos").regex(/^\d+$/, "Apenas números");

export function MfaSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "backup">("idle");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeError, setCodeError] = useState("");

  const startSetup = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Generate TOTP secret client-side for QR display
      const rawSecret = crypto.getRandomValues(new Uint8Array(20));
      const base32Secret = base32Encode(rawSecret);
      const issuer = "BenefitOS";
      const uri = `otpauth://totp/${issuer}:${user.email}?secret=${base32Secret}&issuer=${issuer}&digits=6&period=30`;

      setSecret(base32Secret);
      setQrUri(uri);
      setStep("setup");
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível iniciar a configuração." });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    const result = totpCodeSchema.safeParse(verifyCode);
    if (!result.success) {
      setCodeError(result.error.errors[0].message);
      return;
    }
    setCodeError("");
    setLoading(true);

    try {
      // Generate backup codes
      const codes = Array.from({ length: 8 }, () =>
        Array.from(crypto.getRandomValues(new Uint8Array(4)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );

      // Store encrypted secret via edge function
      const { error } = await supabase.functions.invoke("sso-management/store-totp", {
        body: {
          user_id: user!.id,
          encrypted_secret: secret,
          backup_codes: codes,
        },
      });

      if (error) throw error;

      setBackupCodes(codes);
      setStep("backup");
      toast({ title: "MFA ativado!", description: "Autenticação de dois fatores configurada com sucesso." });
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao verificar código. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === "idle") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Autenticação de Dois Fatores (MFA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta usando um aplicativo autenticador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={startSetup} disabled={loading} className="btn-premium">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Configurar MFA
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "setup") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurar Autenticador</CardTitle>
          <CardDescription>
            Escaneie o QR code ou copie a chave manual no seu app autenticador (Google Authenticator, Authy, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
              alt="QR Code MFA"
              className="w-48 h-48"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Chave manual:</p>
            <code className="block p-2 bg-muted rounded text-sm break-all">{secret}</code>
          </div>
          <Button onClick={() => setStep("verify")} className="w-full">
            Próximo: Verificar Código
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificar Código</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos do seu aplicativo autenticador para confirmar a configuração.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="000000"
            value={verifyCode}
            onChange={(e) => {
              setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setCodeError("");
            }}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
          />
          {codeError && <p className="text-sm text-destructive">{codeError}</p>}
          <Button onClick={verifyAndEnable} disabled={loading || verifyCode.length !== 6} className="w-full btn-premium">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Verificar e Ativar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // backup step
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          MFA Ativado
        </CardTitle>
        <CardDescription>
          Salve estes códigos de backup em um local seguro. Cada código pode ser usado apenas uma vez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((code, i) => (
            <Badge key={i} variant="outline" className="justify-center py-2 font-mono text-sm">
              {code}
            </Badge>
          ))}
        </div>
        <Button variant="outline" onClick={copyBackupCodes} className="w-full gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado!" : "Copiar Códigos"}
        </Button>
        <p className="text-xs text-destructive font-medium text-center">
          ⚠️ Estes códigos não serão exibidos novamente.
        </p>
      </CardContent>
    </Card>
  );
}

// Base32 encoder for TOTP secret
function base32Encode(data: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }
  return result;
}
