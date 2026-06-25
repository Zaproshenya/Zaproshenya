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

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/login');
      return;
    }

    const unsubInvites = listenUserInvites(user.uid, (data) => {
      setInvites(data);
      setLoading(false);
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
            const t = TYPE_MAP[inv.type] || TYPE_MAP.other;
            const link = typeof window !== 'undefined'
              ? `${window.location.origin}/${inv.isGroup ? 'g' : 'i'}/${inv.id}`
              : '';
            return (
              <Link
                href={`/${inv.isGroup ? 'g' : 'i'}/${inv.id}`}
                key={inv.id}
                className={`home-inv-card status-${inv.status || 'pending'}`}
                style={{ animationDelay: `${i * 35}ms` }}
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
                    {t.l}
                    {inv.date && ` · ${inv.date}`}
                    {inv.time && ` · ${inv.time}`}
                  </div>
                </div>
                <div className="home-inv-right">
                  {getStatusBadge(inv.status || 'pending')}
                  <button
                    className="home-copy-btn"
                    title="Копіювати посилання"
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(link);
                      toast('Посилання скопійовано ✓', 'success', 2500);
                    }}
                  >
                    <Icon name="link" size={14} />
                  </button>
                </div>
              </Link>
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
                  <Icon name="paper-plane-tilt" size={24} />
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
                    {inv.body || `Від ${inv.fromName || 'когось'}`}
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
    </div>
  );
}
