export function formatCurrency(amount: number, currency = 'EUR', locale = 'de-DE'): string {
  return new Intl.NumberFormat(locale, {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr?: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('de-DE', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
    ...opts,
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('de-DE', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function truncate(str: string, length = 80): string {
  return str.length > length ? str.slice(0, length) + '…' : str;
}
