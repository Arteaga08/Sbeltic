// Normaliza un teléfono para wa.me: solo dígitos y, si son 10 (México sin lada),
// antepone la lada 52.
export function toWhatsAppPhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `52${digits}`;
  return digits;
}
