/**
 * Masks sensitive data for display in the UI
 * Use this for PII fields that should not be fully visible
 */

/**
 * Mask CPF for display (shows only last 3 digits)
 * Example: "123.456.789-00" → "***.***.**9-00"
 */
export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return "***.***.***-**";
  
  // Remove non-digit characters
  const digits = cpf.replace(/\D/g, "");
  
  if (digits.length < 4) return "***.***.***-**";
  
  // Show only last 3 digits
  const lastDigits = digits.slice(-3);
  return `***.***.**${lastDigits.charAt(0)}-${lastDigits.slice(1)}`;
}

/**
 * Mask email for display (shows first char and domain)
 * Example: "john.doe@example.com" → "j***@example.com"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "***@***";
  
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***@***";
  
  return `${localPart.charAt(0)}***@${domain}`;
}

/**
 * Mask phone number for display (shows only last 4 digits)
 * Example: "(11) 99999-1234" → "(XX) XXXXX-1234"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "(XX) XXXXX-XXXX";
  
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "(XX) XXXXX-XXXX";
  
  const lastFour = digits.slice(-4);
  return `(XX) XXXXX-${lastFour}`;
}

/**
 * Format salary for display with optional masking for non-admins
 */
export function formatSalary(
  salary: number | null | undefined,
  showFull: boolean = true
): string {
  if (salary === null || salary === undefined) return "—";
  
  if (!showFull) {
    return "R$ ***.***,**";
  }
  
  return salary.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
