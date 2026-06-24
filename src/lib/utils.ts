// ── Generate short ID ──
export function genId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
}

// ── Generate unique user ID (ZAP-XXXXXX) ──
export function genUserId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return 'ZAP-' + id;
}

// ── HTML escape ──
export function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Date formatting ──
export function formatDate(dateStr: string | number): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return String(dateStr); }
}

export function timeAgo(timestamp: number): string {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'щойно';
  if (mins < 60) return `${mins} хв тому`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} год тому`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} дн тому`;
  return formatDate(new Date(timestamp).toISOString().split('T')[0]);
}

// ── Invite types ──
export const TYPES = [
  { v: 'date', l: 'Побачення', e: '🌹' },
  { v: 'walk', l: 'Прогулянка', e: '🍃' },
  { v: 'birthday', l: 'День народження', e: '🎂' },
  { v: 'party', l: 'Свято / Вечірка', e: '🥂' },
  { v: 'cinema', l: 'Кіно', e: '🎬' },
  { v: 'coffee', l: 'Кава', e: '☕' },
  { v: 'travel', l: 'Подорож', e: '✈️' },
  { v: 'other', l: 'Інше', e: '✨' },
];

export const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.v, t]));
