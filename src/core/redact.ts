// Utilities for masking customer personal information (emails, phone numbers, addresses)
// before passing data to AI models or returning API responses.

export function maskEmail(email: string | undefined | null): string {
  if (!email || !email.includes('@')) return 'N/A';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}${'*'.repeat(user.length - 2)}${user.slice(-1)}@${domain}`;
}

export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return 'N/A';
  const clean = phone.replace(/[^0-9+]/g, '');
  if (clean.length < 6) return '******';
  return `${clean.slice(0, 3)}******${clean.slice(-2)}`;
}

export function maskAddress(text: string | undefined | null): string {
  if (!text) return 'N/A';
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) return `${words[0].slice(0, 3)}****`;
  return `${words[0]} ${words[1].slice(0, 2)}****`;
}

export function maskPostcode(postcode: string | undefined | null): string {
  if (!postcode) return 'N/A';
  return `${postcode.slice(0, 2)}****`;
}
