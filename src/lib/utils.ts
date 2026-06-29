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

// ── Generate role-based user ID ──
// role: 'moderator' | 'tech-admin' | 'founder'
// moderIndex: порядковий номер модератора (починаючи з 1), потрібен лише для 'moderator'
export function genRoleUserId(role: string, moderIndex?: number): string {
  if (role === 'moderator') {
    const n = moderIndex ?? 1;
    return 'ZAP-MODER' + n;
  }
  if (role === 'tech-admin') return 'ZAP-TECADM';
  if (role === 'founder') return 'ZAP-FONDER';
  return genUserId();
}

// ── Check if a uniqueId matches a reserved/role pattern ──
// Blocks normal users from getting IDs like ZAP-MODER1, ZAP-TECADM, ZAP-FONDER
export function isReservedId(id: string): boolean {
  if (!id) return false;
  const upper = id.toUpperCase();
  if (upper === 'ZAP-TECADM') return true;
  if (upper === 'ZAP-FONDER') return true;
  // ZAP-MODER followed by one or more digits
  if (/^ZAP-MODER\d+$/.test(upper)) return true;
  return false;
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
  { v: 'wedding', l: 'Весілля', e: '💍' },
  { v: 'birthday', l: 'День народження', e: '🎂' },
  { v: 'party', l: 'Свято / Вечірка', e: '🥂' },
  { v: 'cinema', l: 'Кіно', e: '🎬' },
  { v: 'coffee', l: 'Кава', e: '☕' },
  { v: 'dinner', l: 'Обід / Вечеря', e: '🍽️' },
  { v: 'sport', l: 'Спорт / Активність', e: '⚽' },
  { v: 'meeting', l: 'Ділова зустріч', e: '💼' },
  { v: 'travel', l: 'Подорож', e: '✈️' },
  { v: 'other', l: 'Інше', e: '✨' },
];

export const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.v, t]));

// ── Confetti effect ──
export function boom() {
  if (typeof window === 'undefined') return;
  const colors = ['#c9922a', '#2d7a4f', '#e05c5c', '#5a8fd4', '#e8b84b', '#6db87a'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `
      left:${Math.random() * 100}vw;top:-10px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      width:${6 + Math.random() * 8}px;height:${6 + Math.random() * 8}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration:${1.5 + Math.random() * 2}s;
      animation-delay:${Math.random() * 0.6}s;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}
