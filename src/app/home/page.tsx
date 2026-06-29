'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { listenUserInvites, listenNotifications } from '@/lib/firebase/db';
import { TYPE_MAP } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<any[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [filter, setFilter] = useState('all');
  const [selectedInvite, setSelectedInvite] = useState<any | null>(null);
  const [rescheduleData, setRescheduleData] = useState<any | null>(null);

  useEffect(() => {
    if (selectedInvite && selectedInvite.status === 'reschedule') {
      import('@/lib/firebase/db').then(({ getReschedule }) => {
        getReschedule(selectedInvite.id).then((res) => {
          setRescheduleData(res);
        });
      });
    } else {
      setRescheduleData(null);
    }
  }, [selectedInvite]);

  const handleDeleteInvite = async (invId: string, isGroup: boolean) => {
    if (!confirm('Видалити запрошення?')) return;
    try {
      const { deleteInvite } = await import('@/lib/firebase/db');
      await deleteInvite(invId, user?.uid, isGroup);
      setInvites(prev => prev.filter(i => i.id !== invId));
      setSelectedInvite(null);
      toast('Запрошення видалено ✓', 'success', 2500);
    } catch (err) {
      console.error('Failed to delete invite:', err);
      toast('Сталася помилка при видаленні', 'error', 2500);
    }
  };

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/login');
      return;
    }

    const unsubInvites = listenUserInvites(user.uid, async (data) => {
      setInvites(data);
      setLoading(false);

      // Self-healing migration for custom invites that lack custom fields in user-invites node
      for (const inv of data) {
        if (inv.type === 'custom' && (!inv.customLabel || !inv.customEmoji)) {
          try {
            const { getInvite, getGroupInvite } = await import('@/lib/firebase/db');
            const { db } = await import('@/lib/firebase/config');
            const { ref, update } = await import('firebase/database');
            const fullInv = inv.isGroup ? await getGroupInvite(inv.id) : await getInvite(inv.id);
            if (fullInv && (fullInv.customLabel || fullInv.customEmoji)) {
              await update(ref(db, `user-invites/${user.uid}/${inv.id}`), {
                customLabel: fullInv.customLabel || null,
                customEmoji: fullInv.customEmoji || null,
              });
            }
          } catch (err) {
            console.error('Failed to migrate custom invite fields:', err);
          }
        }
      }
    });

    const unsubNotifs = listenNotifications(user.uid, (notifs) => {
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const incoming = notifs.filter(n =>
        (n.type === 'invite' || n.type === 'group-invite') && n.inviteId &&
        (!n.read || (now - n.createdAt < SEVEN_DAYS))
      );
      setIncomingInvites(incoming);
    });

    return () => {
      unsubInvites();
      unsubNotifs();
    };
  }, [user, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':   return <span className="badge badge-accepted"><Icon name="check" size={12}/> Прийнято</span>;
      case 'declined':   return <span className="badge badge-declined"><Icon name="x" size={12}/> Відхилено</span>;
      case 'reschedule': return <span className="badge badge-reschedule"><Icon name="clock-counter-clockwise" size={12}/> Перенос</span>;
      default:           return <span className="badge badge-pending"><Icon name="hourglass-high" size={12}/> Очікує</span>;
    }
  };

  const incomingCount = incomingInvites.filter(i => !i.read).length;

  const counts = {
    all:        invites.length,
    pending:    invites.filter(i => i.status === 'pending' || !i.status).length,
    accepted:   invites.filter(i => i.status === 'accepted').length,
    declined:   invites.filter(i => i.status === 'declined').length,
    reschedule: invites.filter(i => i.status === 'reschedule').length,
  };

  // ── Skeleton loading ──
  if (loading || user === undefined) {
    return (
      <div className="wrap">
        <div className="home-header">
          <div className="home-header-left">
            <div className="skeleton-line" style={{width: '220px', height: '28px', marginBottom: '8px'}}></div>
            <div className="skeleton-line" style={{width: '160px', height: '13px'}}></div>
          </div>
          <div className="skeleton-btn" style={{width:'90px', height:'38px', borderRadius:'20px'}}></div>
        </div>
        <div className="home-stats-row">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton" style={{height:'60px', borderRadius:'12px', flex:1, minWidth:'52px'}}></div>
          ))}
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton-card" style={{animationDelay:`${i*80}ms`}}>
            <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
              <div className="skeleton-circle" style={{width:'40px', height:'40px'}}></div>
              <div style={{flex:1}}>
                <div className="skeleton-line w-3-4" style={{marginBottom:'8px', height:'15px'}}></div>
                <div className="skeleton-line w-1-2" style={{height:'12px'}}></div>
              </div>
              <div className="skeleton-line" style={{width:'70px', height:'22px', borderRadius:'20px'}}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const shown = filter === 'all' ? invites : invites.filter(i => i.status === filter);

  return (
    <div className="wrap">
      <div className="home-header">
        <div className="home-header-left">
          <h1 className="home-title">Мої запрошення</h1>
        </div>
        <Link href="/create" className="btn-create-fab" title="Нове запрошення">
          <Icon name="plus" size={20} />
          <span>Нове</span>
        </Link>
      </div>

      {invites.length > 0 && (
        <div className="home-stats-row">
          {[
            { key: 'all',        label: 'Всі',       cls: '' },
            { key: 'pending',    label: 'Очікують',  cls: 'stat-pending' },
            { key: 'accepted',   label: 'Прийняті',  cls: 'stat-accepted' },
            { key: 'declined',   label: 'Відхилені', cls: 'stat-declined' },
            { key: 'reschedule', label: 'Перенос',   cls: 'stat-reschedule' },
          ].map(({ key, label, cls }) => (
            <button
              key={key}
              className={`home-stat-chip ${filter === key && activeTab === 'outgoing' ? 'active' : ''} ${cls}`}
              onClick={() => { setActiveTab('outgoing'); setFilter(key); }}
            >
              <span className="home-stat-num">{counts[key as keyof typeof counts]}</span>
              <span className="home-stat-label">{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="home-tabs">
        <button
          className={`home-tab ${activeTab === 'outgoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('outgoing')}
        >
          <Icon name="paper-plane-tilt" size={16} /> Відправлені
        </button>
        <button
          className={`home-tab ${activeTab === 'incoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          <Icon name="users" size={16} /> Від друзів
          {incomingCount > 0 && <span className="home-tab-badge">{incomingCount}</span>}
        </button>
      </div>

      {activeTab === 'outgoing' ? (
        shown.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty-icon">
              <Icon name={filter === 'all' ? 'paper-plane-tilt' : 'funnel'} size={40} />
            </div>
            <div className="home-empty-title">
              {filter === 'all' ? 'Ще немає запрошень' : 'Немає запрошень з таким статусом'}
            </div>
            <p className="home-empty-sub">
              {filter === 'all'
                ? 'Створіть перше запрошення і поділіться ним з другом'
                : 'Спробуйте обрати інший фільтр'}
            </p>
            {filter === 'all' ? (
              <Link href="/create" className="btn btn-dark" style={{ width: 'auto', padding: '12px 32px', marginTop: '4px' }}>
                <Icon name="plus" size={16} /> Створити запрошення
              </Link>
            ) : (
              <button className="btn-ghost" onClick={() => setFilter('all')}>
                Показати всі
              </button>
            )}
          </div>
        ) : (
          shown.map((inv, i) => {
            const t = inv.type === 'custom'
              ? { v: 'custom', l: inv.customLabel || 'Своє', e: inv.customEmoji || '✦' }
              : (TYPE_MAP[inv.type] || TYPE_MAP.other);
            const link = typeof window !== 'undefined'
              ? `${window.location.origin}/${inv.isGroup ? 'g' : 'i'}/${inv.id}`
              : '';
            return (
              <div
                onClick={() => setSelectedInvite(inv)}
                key={inv.id}
                className={`home-inv-card status-${inv.status || 'pending'}`}
                style={{ animationDelay: `${i * 35}ms`, cursor: 'pointer' }}
              >
                <div className="home-inv-emoji">{t.e}</div>
                <div className="home-inv-body">
                  <div className="home-inv-title">
                    {inv.to || inv.title || 'Групове запрошення'}
                    {inv.isGroup && (
                      <span className="home-inv-group-badge">
                        <Icon name="users" size={12} /> Група
                      </span>
                    )}
                  </div>
                  <div className="home-inv-meta">
                    <span className="home-inv-meta-type">{t.l}</span>
                    {(inv.date || inv.time) && (
                      <span className="home-inv-meta-date">
                        <Icon name="calendar-blank" size={13} />
                        <span>
                          {inv.date && inv.date}
                          {inv.time && ` · ${inv.time}`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="home-inv-right">
                  {getStatusBadge(inv.status || 'pending')}
                  <button
                    className="home-copy-btn"
                    title="Копіювати посилання"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      navigator.clipboard.writeText(link);
                      toast('Посилання скопійовано ✓', 'success', 2500);
                    }}
                  >
                    <Icon name="link" size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )
      ) : (
        incomingInvites.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty-icon"><Icon name="users" size={40} /></div>
            <div className="home-empty-title">Немає нових запрошень</div>
            <p className="home-empty-sub">Тут будуть запрошення від друзів</p>
          </div>
        ) : (
          incomingInvites.map((inv, i) => {
            return (
              <Link
                href={`/${inv.type === 'group-invite' ? 'g' : 'i'}/${inv.inviteId}`}
                key={inv.id}
                className={`home-inv-card ${!inv.read ? 'unread' : ''}`}
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <div className="home-inv-emoji">
                  <Icon name="paper-plane-tilt" size={20} />
                </div>
                <div className="home-inv-body">
                  <div className="home-inv-title">
                    {inv.title || 'Нове запрошення'}
                    {!inv.read && (
                      <span className="home-inv-group-badge" style={{background:'var(--blue-bg)', color:'var(--blue)', borderColor:'var(--blue-border)'}}>
                        Нове
                      </span>
                    )}
                  </div>
                  <div className="home-inv-meta">
                    <span className="home-inv-meta-type">
                      {inv.type === 'group-invite' ? 'Група' : 'Запрошення'}
                    </span>
                    <span className="home-inv-meta-date">
                      <Icon name="user" size={13} />
                      <span>{inv.body || `Від ${inv.fromName || 'когось'}`}</span>
                    </span>
                  </div>
                </div>
                <div className="home-inv-right">
                  <Icon name="caret-right" size={16} color="var(--muted)"/>
                </div>
              </Link>
            );
          })
        )
      )}

      {selectedInvite && (() => {
        const t = selectedInvite.type === 'custom'
          ? { v: 'custom', l: selectedInvite.customLabel || 'Своє', e: selectedInvite.customEmoji || '✦' }
          : (TYPE_MAP[selectedInvite.type] || TYPE_MAP.other);
        const link = typeof window !== 'undefined'
          ? `${window.location.origin}/${selectedInvite.isGroup ? 'g' : 'i'}/${selectedInvite.id}`
          : '';

        return (
          <div className="overlay active" onClick={() => setSelectedInvite(null)} style={{ zIndex: 9999 }}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', animation: 'fadeUp .3s ease' }}>
              <div className="modal-hdr" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="modal-emoji-wrap">{t.e}</div>
                  <div>
                    <div className="modal-inv-name">{selectedInvite.to || selectedInvite.title || 'Групове'}</div>
                    <div className="modal-inv-type">
                      {t.l} {selectedInvite.isGroup && <>· <Icon name="users" size={13} /> Групове</>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {getStatusBadge(selectedInvite.status || 'pending')}
                  <button onClick={() => setSelectedInvite(null)} className="modal-close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '50%' }}>
                    <Icon name="x" size={18} />
                  </button>
                </div>
              </div>

              <div className="modal-details">
                <div className="modal-detail-row">
                  <span className="modal-detail-icon"><Icon name="calendar-blank" size={17} /></span>
                  <span className="modal-detail-label">Дата</span>
                  <span className="modal-detail-value">{selectedInvite.date || '—'}</span>
                </div>
                <div className="modal-detail-row">
                  <span className="modal-detail-icon"><Icon name="clock" size={17} /></span>
                  <span className="modal-detail-label">Час</span>
                  <span className="modal-detail-value">{selectedInvite.time || '—'}</span>
                </div>
                {selectedInvite.place && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-icon"><Icon name="map-pin" size={17} /></span>
                    <span className="modal-detail-label">Місце</span>
                    <span className="modal-detail-value">{selectedInvite.place}</span>
                  </div>
                )}
                {selectedInvite.msg && (
                  <div className="modal-detail-row">
                    <span className="modal-detail-icon"><Icon name="chat-circle-dots" size={17} /></span>
                    <span className="modal-detail-label">Текст</span>
                    <span className="modal-detail-value" style={{ fontStyle: 'italic' }}>{selectedInvite.msg}</span>
                  </div>
                )}
                {selectedInvite.status === 'reschedule' && (
                  <div className="modal-detail-row" style={{ background: 'var(--gold-dim)', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '.7rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="calendar-blank" size={14} /> Пропозиція отримувача
                    </div>
                    <div style={{ fontSize: '.92rem', fontWeight: 500, color: 'var(--ink)' }}>
                      {rescheduleData 
                        ? `${rescheduleData.date || '—'}${rescheduleData.time ? ` о ${rescheduleData.time}` : ''}`
                        : 'Завантаження...'
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-link-box">
                <p style={{ fontSize: '.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icon name="link" size={14} /> Посилання
                </p>
                <div className="modal-link-url" style={{ marginBottom: '12px' }}>{link}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(link);
                      toast('Посилання скопійовано ✓', 'success', 2500);
                    }}
                    className="btn btn-dark"
                    style={{ flex: 1, padding: '10px 14px', fontSize: '.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Icon name="copy" size={14} /> Скопіювати
                  </button>
                  <Link
                    href={`/${selectedInvite.isGroup ? 'g' : 'i'}/${selectedInvite.id}`}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '10px 14px', fontSize: '.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textAlign: 'center' }}
                  >
                    <Icon name="eye" size={14} /> Переглянути
                  </Link>
                </div>
              </div>

              <button
                onClick={() => handleDeleteInvite(selectedInvite.id, !!selectedInvite.isGroup)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '.82rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: 'color .15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <Icon name="trash" size={14} /> Видалити запрошення
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
