'use client';
import { useState, useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { timeAgo } from '@/lib/utils';
import {
  changeUserUniqueId,
  autoAssignRoleIds,
  previewAutoAssignRoleIds,
  updateUserRole,
  updateModeratorPermissions,
  listenStaffActionLog,
  pinStaffLog,
  logStaffAction,
} from '@/lib/firebase/db';
import { toast } from '@/components/Toast';
import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase/config';

const ROLE_LABELS: Record<string, string> = {
  founder: 'FOUNDER',
  'tech-admin': 'TECH-ADMIN',
  moderator: 'MODERATOR',
  user: 'USER',
};

const ROLE_COLORS: Record<string, string> = {
  founder: 'var(--gold)',
  'tech-admin': '#5a8fd4',
  moderator: '#6db87a',
  user: 'var(--muted)',
};

const DEFAULT_PERMISSIONS = {
  overview: true,
  users: true,
  moderation: true,
  reports: true,
  support: true,
  canBan: true,
};

const PERMISSION_LABELS: Record<string, string> = {
  overview: 'Огляд',
  users: 'Користувачі',
  moderation: 'Модерація',
  reports: 'Скарги',
  support: 'Підтримка',
  canBan: 'Може банити',
};

// Format a full date+time string (e.g. "29 чер 2026, 16:42")
function formatFullDate(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate();
  const months = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mon} ${year}, ${h}:${m}`;
}

// Determine icon, color and label for a log action string
function getActionMeta(action: string): { icon: string; color: string; label: string } {
  const a = (action || '').toLowerCase();
  if (a.includes('заблок') || a.includes('бан')) return { icon: 'prohibit', color: '#e05c5c', label: 'Блокування' };
  if (a.includes('розблок')) return { icon: 'lock-open', color: '#6db87a', label: 'Розблокування' };
  if (a.includes('видалив акаунт') || a.includes('видалив користувача')) return { icon: 'user-minus', color: '#e05c5c', label: 'Видалення акаунту' };
  if (a.includes('роль')) return { icon: 'shield-star', color: '#5a8fd4', label: 'Роль' };
  if (a.includes('дозвол') || a.includes('пермі')) return { icon: 'sliders', color: '#9b7de8', label: 'Дозволи' };
  if (a.includes('id') || a.includes('ідентифікатор')) return { icon: 'identification-badge', color: '#c9922a', label: 'Ідентифікатор' };
  if (a.includes('автопризначення')) return { icon: 'magic-wand', color: '#c9922a', label: 'Автопризначення' };
  if (a.includes('видалив запрошення')) return { icon: 'trash', color: '#e05c5c', label: 'Видалення запрошення' };
  if (a.includes('скарг') || a.includes('схвалив') || a.includes('відхилив скарг')) return { icon: 'warning', color: '#e05c5c', label: 'Скарга' };
  if (a.includes('зверненн') || a.includes('відпів') || a.includes('тікет') || a.includes('вирішив зверн') || a.includes('закрив зверн')) return { icon: 'chat-circle-dots', color: '#c9922a', label: 'Підтримка' };
  return { icon: 'clipboard-text', color: 'var(--muted)', label: 'Дія' };
}

function isOnline(lastSeen: number) {
  return Date.now() - lastSeen < 3 * 60 * 1000;
}

export default function AdminRoles({
  users,
  profile,
  reload,
}: {
  users: any[];
  profile: any;
  reload: () => void;
}) {
  const staffUsers = users
    .filter(u => u.role === 'founder' || u.role === 'tech-admin' || u.role === 'moderator')
    .sort((a, b) => {
      const rankMap: Record<string, number> = { founder: 0, 'tech-admin': 1, moderator: 2 };
      return (rankMap[a.role] ?? 9) - (rankMap[b.role] ?? 9) || (a.createdAt || 0) - (b.createdAt || 0);
    });

  const [editId, setEditId] = useState<Record<string, string>>({});
  const [editLoading, setEditLoading] = useState<Record<string, boolean>>({});
  const [expandedPerms, setExpandedPerms] = useState<string | null>(null);
  const [permSaving, setPermSaving] = useState<string | null>(null);
  const [localPerms, setLocalPerms] = useState<Record<string, Record<string, boolean>>>({});
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoPreview, setAutoPreview] = useState<any[] | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logPinLoading, setLogPinLoading] = useState<string | null>(null);

  const isSuperAdmin = profile?.role === 'founder' || profile?.role === 'tech-admin';

  // Init local permissions from user data
  useEffect(() => {
    const init: Record<string, Record<string, boolean>> = {};
    staffUsers.forEach(u => {
      if (u.role === 'moderator') {
        init[u.uid] = { ...DEFAULT_PERMISSIONS, ...(u.permissions || {}) };
      }
    });
    setLocalPerms(init);
  }, [users]);

  // Real-time logs
  useEffect(() => {
    const unsub = listenStaffActionLog(setLogs);
    return () => unsub();
  }, []);

  // ── Auto-assign IDs ──
  const handleAutoPreview = async () => {
    setAutoLoading(true);
    try {
      // Only CALCULATE what would change — does NOT apply anything
      const preview = await previewAutoAssignRoleIds();
      if (preview.length === 0) {
        toast('Всі ID вже відповідають ролям ❖', 'success');
      } else {
        setAutoPreview(preview);
      }
    } catch (e: any) {
      toast(e.message || 'Помилка', 'error');
    } finally {
      setAutoLoading(false);
    }
  };

  const handleAutoConfirm = async () => {
    if (!autoPreview) return;
    setAutoLoading(true);
    try {
      const result = await autoAssignRoleIds();
      await logStaffAction(profile.uid, profile.name, `Автопризначення ролевих ID: оновлено ${result.updated}`);
      toast(`Оновлено ${result.updated} ID ✦`, 'success');
      setAutoPreview(null);
      reload();
    } catch (e: any) {
      toast(e.message || 'Помилка', 'error');
    } finally {
      setAutoLoading(false);
    }
  };

  // ── Manual ID change ──
  const handleChangeId = async (u: any) => {
    const newId = (editId[u.uid] || '').trim().toUpperCase();
    if (!newId) return toast('Введіть новий ID', 'error');
    if (newId === u.uniqueId) return toast('ID не змінився', 'info');
    if (!/^ZAP-[A-Z0-9]{4,12}$/.test(newId)) {
      return toast('Формат ID: ZAP-XXXXXX (лише латиниця та цифри, 4-12 символів після тире)', 'error');
    }
    setEditLoading(prev => ({ ...prev, [u.uid]: true }));
    try {
      const snap = await get(ref(db, 'ids/' + newId));
      if (snap.exists() && snap.val() !== u.uid) {
        toast('Цей ID вже зайнятий іншим користувачем', 'error');
        return;
      }
      await changeUserUniqueId(u.uid, u.uniqueId || '', newId);
      await logStaffAction(profile.uid, profile.name, `Змінив ID → ${newId}`, u.uid, u.name);
      toast(`ID змінено на ${newId} ✦`, 'success');
      setEditId(prev => ({ ...prev, [u.uid]: '' }));
      reload();
    } catch (e: any) {
      toast(e.message || 'Помилка', 'error');
    } finally {
      setEditLoading(prev => ({ ...prev, [u.uid]: false }));
    }
  };

  // ── Remove role ──
  const handleRemoveRole = async (u: any) => {
    if (!window.confirm(`Зняти роль у ${u.name}? Їх ID буде замінено на рандомний.`)) return;
    try {
      await updateUserRole(u.uid, 'user');
      await logStaffAction(profile.uid, profile.name, `Зняв роль ${u.role}`, u.uid, u.name);
      toast(`Роль знято у ${u.name} ✦`, 'success');
      reload();
    } catch (e: any) {
      toast(e.message || 'Помилка', 'error');
    }
  };

  // ── Permissions ──
  const handlePermToggle = (uid: string, key: string) => {
    setLocalPerms(prev => ({
      ...prev,
      [uid]: { ...(prev[uid] || DEFAULT_PERMISSIONS), [key]: !(prev[uid]?.[key] ?? DEFAULT_PERMISSIONS[key as keyof typeof DEFAULT_PERMISSIONS]) },
    }));
  };

  const handleSavePerms = async (u: any) => {
    setPermSaving(u.uid);
    try {
      await updateModeratorPermissions(u.uid, localPerms[u.uid] || DEFAULT_PERMISSIONS);
      await logStaffAction(profile.uid, profile.name, 'Оновив дозволи', u.uid, u.name);
      toast('Дозволи збережено ✦', 'success');
    } catch (e: any) {
      toast(e.message || 'Помилка', 'error');
    } finally {
      setPermSaving(null);
    }
  };

  // ── Log pin ──
  const handlePin = async (log: any) => {
    setLogPinLoading(log.key);
    try {
      await pinStaffLog(log.key, !log.pinned);
    } catch (e) {
      toast('Помилка', 'error');
    } finally {
      setLogPinLoading(null);
    }
  };

  // ── Rank check ──
  const getCanEdit = (targetRole: string) => {
    if (profile?.role === 'founder') return true;
    if (profile?.role === 'tech-admin' && targetRole === 'moderator') return true;
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Auto-assign banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,146,42,0.08) 0%, rgba(90,143,212,0.06) 100%)',
        border: '1px solid rgba(201,146,42,0.2)',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
            <Icon name="magic-wand" size={16} /> Автоматичне призначення ID
          </div>
          <div style={{ fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            Присвоїти усім модераторам, тех-адміну та засновнику відповідні рольові ідентифікатори.
          </div>
        </div>
        <button
          className="btn btn-dark"
          onClick={handleAutoPreview}
          disabled={autoLoading}
          style={{ padding: '9px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}
        >
          {autoLoading ? 'Обробка...' : <><Icon name="arrows-clockwise" size={15} /> Автопризначення</>}
        </button>
      </div>

      {/* ── Preview modal ── */}
      {autoPreview && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '20px 24px',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--ink)' }}>
            <Icon name="eye" size={15} /> Попередній перегляд змін ({autoPreview.length} записів)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {autoPreview.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '.85rem', padding: '8px 12px', background: 'var(--warm)', borderRadius: '8px' }}>
                <span style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>{item.oldId || '—'}</span>
                <Icon name="arrow-right" size={13} />
                <span style={{ fontFamily: 'monospace', color: ROLE_COLORS[item.role], fontWeight: 600 }}>{item.newId}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{item.name}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-dark" onClick={handleAutoConfirm} disabled={autoLoading} style={{ borderRadius: '30px', padding: '9px 20px' }}>
              Підтвердити
            </button>
            <button className="btn btn-outline" onClick={() => setAutoPreview(null)} style={{ borderRadius: '30px', padding: '9px 20px' }}>
              Скасувати
            </button>
          </div>
        </div>
      )}

      {/* ── Staff list ── */}
      <div>
        <div style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
          Привілейовані користувачі ({staffUsers.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {staffUsers.length === 0 && (
            <div style={{ color: 'var(--muted)', padding: '24px', textAlign: 'center', fontSize: '.9rem' }}>
              Немає привілейованих користувачів
            </div>
          )}
          {staffUsers.map(u => {
            const online = isOnline(u.lastSeen || 0);
            const canEdit = getCanEdit(u.role);
            const perms = localPerms[u.uid] || { ...DEFAULT_PERMISSIONS, ...(u.permissions || {}) };
            const expanded = expandedPerms === u.uid;

            return (
              <div key={u.uid} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div className="avatar avatar-sm" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>
                      {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (u.name || '?').charAt(0)}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 12, height: 12, borderRadius: '50%',
                      background: online ? '#4caf50' : '#9e9e9e',
                      border: '2px solid var(--card)',
                    }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '.95rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {u.name}
                      <span style={{
                        fontSize: '.65rem', fontWeight: 700, letterSpacing: '.07em', padding: '2px 8px',
                        borderRadius: '20px', background: `${ROLE_COLORS[u.role]}18`,
                        color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role]}40`,
                      }}>
                        {ROLE_LABELS[u.role] || u.role?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>@{u.login}</span>
                      <span style={{ fontSize: '.78rem', fontFamily: 'monospace', color: ROLE_COLORS[u.role], fontWeight: 600 }}>{u.uniqueId || '—'}</span>
                      <span style={{ fontSize: '.75rem', color: online ? '#4caf50' : 'var(--muted)' }}>
                        {online ? '● Онлайн' : `● ${u.lastSeen ? timeAgo(u.lastSeen) : 'Не відомо'}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {u.role === 'moderator' && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setExpandedPerms(expanded ? null : u.uid)}
                          style={{ borderRadius: '20px', padding: '5px 12px', fontSize: '.78rem' }}
                        >
                          <Icon name="sliders" size={13} /> Дозволи
                        </button>
                      )}
                      <button
                        className="btn btn-sm"
                        onClick={() => handleRemoveRole(u)}
                        style={{ borderRadius: '20px', padding: '5px 12px', fontSize: '.78rem', background: 'rgba(224,92,92,0.1)', color: 'var(--red)', border: '1px solid rgba(224,92,92,0.2)' }}
                      >
                        <Icon name="user-minus" size={13} /> Зняти роль
                      </button>
                    </div>
                  )}
                </div>

                {/* Manual ID change */}
                {canEdit && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder={`Новий ID (зараз: ${u.uniqueId || '—'})`}
                      value={editId[u.uid] || ''}
                      onChange={e => setEditId(prev => ({ ...prev, [u.uid]: e.target.value.toUpperCase() }))}
                      style={{
                        flex: 1, padding: '7px 14px', fontSize: '.82rem',
                        background: 'var(--warm)', border: '1px solid var(--border)',
                        borderRadius: '8px', color: 'var(--ink)', fontFamily: 'monospace',
                        outline: 'none', minWidth: 0,
                      }}
                    />
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleChangeId(u)}
                      disabled={editLoading[u.uid] || !editId[u.uid]}
                      style={{ borderRadius: '8px', padding: '7px 14px', whiteSpace: 'nowrap', fontSize: '.82rem' }}
                    >
                      {editLoading[u.uid] ? '...' : <><Icon name="check" size={13} /> Змінити</>}
                    </button>
                  </div>
                )}

                {/* Permissions (moderators only) */}
                {expanded && u.role === 'moderator' && (
                  <div style={{
                    borderTop: '1px solid var(--border)', paddingTop: '14px',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                  }}>
                    <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                      Дозволи модератора
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                      {Object.keys(DEFAULT_PERMISSIONS).map(key => (
                        <label key={key} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                          background: perms[key] ? 'rgba(109,184,122,0.08)' : 'var(--warm)',
                          border: `1px solid ${perms[key] ? 'rgba(109,184,122,0.3)' : 'var(--border)'}`,
                          transition: 'all .15s',
                        }}>
                          <input
                            type="checkbox"
                            checked={!!perms[key]}
                            onChange={() => handlePermToggle(u.uid, key)}
                            style={{ accentColor: '#6db87a', width: 15, height: 15 }}
                          />
                          <span style={{ fontSize: '.82rem', color: 'var(--ink)' }}>{PERMISSION_LABELS[key]}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      className="btn btn-dark btn-sm"
                      onClick={() => handleSavePerms(u)}
                      disabled={permSaving === u.uid}
                      style={{ alignSelf: 'flex-start', borderRadius: '20px', padding: '7px 18px' }}
                    >
                      {permSaving === u.uid ? 'Збереження...' : 'Зберегти дозволи'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Action log ── */}
      <div>
        <div style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="clipboard-text" size={14} /> Лог дій стафу <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({logs.length})</span>
        </div>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '.88rem', padding: '32px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <Icon name="clipboard-text" size={28} />
            <div style={{ marginTop: '10px' }}>Лог порожній — жодної дії ще не виконано</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.map(log => {
              const actionMeta = getActionMeta(log.action);
              const fullDate = log.createdAt ? formatFullDate(log.createdAt) : null;
              return (
                <div key={log.key} style={{
                  borderRadius: '12px',
                  background: log.pinned ? 'rgba(201,146,42,0.05)' : 'var(--card)',
                  border: `1px solid ${log.pinned ? 'rgba(201,146,42,0.3)' : 'var(--border)'}`,
                  overflow: 'hidden',
                  transition: 'border-color .15s',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '11px 14px',
                    fontSize: '.83rem',
                  }}>
                    {/* Action icon badge */}
                    <div style={{
                      width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${actionMeta.color}18`,
                      color: actionMeta.color,
                    }}>
                      <Icon name={actionMeta.icon} size={14} />
                    </div>

                    {/* Main text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {log.pinned && (
                          <span style={{
                            fontSize: '.65rem', fontWeight: 700, letterSpacing: '.06em',
                            padding: '1px 6px', borderRadius: '10px',
                            background: 'rgba(201,146,42,0.15)', color: 'var(--gold)',
                            border: '1px solid rgba(201,146,42,0.3)',
                            textTransform: 'uppercase',
                          }}>ЗАКРІПЛЕНО</span>
                        )}
                        <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '.85rem' }}>{log.adminName}</span>
                        <span style={{ fontSize: '.75rem', padding: '1px 7px', background: `${actionMeta.color}12`, borderRadius: '8px', color: actionMeta.color, fontWeight: 600, border: `1px solid ${actionMeta.color}25` }}>{actionMeta.label}</span>
                      </div>
                      <div style={{ color: 'var(--muted)', marginTop: '2px', fontSize: '.8rem' }}>
                        {log.action}
                        {log.targetName && (
                          <> → <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{log.targetName}</span></>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                      <span style={{ color: 'var(--ink)', fontSize: '.78rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {log.createdAt ? timeAgo(log.createdAt) : '—'}
                      </span>
                      {fullDate && (
                        <span style={{ color: 'var(--muted)', fontSize: '.7rem', whiteSpace: 'nowrap' }}>{fullDate}</span>
                      )}
                    </div>

                    {/* Pin button */}
                    {isSuperAdmin && (
                      <button
                        onClick={() => handlePin(log)}
                        disabled={logPinLoading === log.key}
                        title={log.pinned ? 'Відкріпити' : 'Закріпити'}
                        style={{
                          background: log.pinned ? 'rgba(201,146,42,0.12)' : 'transparent',
                          border: `1px solid ${log.pinned ? 'rgba(201,146,42,0.35)' : 'var(--border)'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: log.pinned ? 'var(--gold)' : 'var(--muted)',
                          padding: '5px 7px',
                          lineHeight: 1,
                          flexShrink: 0,
                          transition: 'all .15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {logPinLoading === log.key
                          ? <Icon name="spinner" size={13} />
                          : <Icon name={log.pinned ? 'push-pin-slash' : 'push-pin'} size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
