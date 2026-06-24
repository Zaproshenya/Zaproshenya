'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInvites } from '@/lib/firebase/db';
import { TYPE_MAP } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        const data = await getUserInvites(user.uid);
        // sort by newest first (assuming createdAt exists)
        data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setInvites(data);
      } catch (err) {
        console.error('Error fetching invites', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <span className="status-badge status-accepted"><Icon name="check" size={12}/> Прийнято</span>;
      case 'declined': return <span className="status-badge status-declined"><Icon name="x" size={12}/> Відхилено</span>;
      case 'reschedule': return <span className="status-badge status-reschedule"><Icon name="clock-counter-clockwise" size={12}/> Перенос</span>;
      default: return <span className="status-badge status-pending"><Icon name="hourglass-high" size={12}/> Очікує</span>;
    }
  };

  const incomingInvites = [] as any[]; // TODO: from notifications
  const incomingCount = incomingInvites.length;

  const counts = {
    all: invites.length,
    pending: invites.filter(i => i.status === 'pending' || !i.status).length,
    accepted: invites.filter(i => i.status === 'accepted').length,
    declined: invites.filter(i => i.status === 'declined').length,
    reschedule: invites.filter(i => i.status === 'reschedule').length,
  };

  if (loading || !user) {
    return (
      <div className="home-header">
        <div className="home-header-left">
          <div className="skeleton-line" style={{width: '220px', height: '26px', marginBottom: '8px'}}></div>
          <div className="skeleton-line" style={{width: '280px', height: '13px'}}></div>
        </div>
      </div>
    );
  }

  const shown = filter === 'all' ? invites : invites.filter(i => i.status === filter);

  return (
    <>
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
            { key: 'all', label: 'Всі', cls: '' },
            { key: 'pending', label: 'Очікують', cls: 'stat-pending' },
            { key: 'accepted', label: 'Прийняті', cls: 'stat-accepted' },
            { key: 'declined', label: 'Відхилені', cls: 'stat-declined' },
            { key: 'reschedule', label: 'Перенос', cls: 'stat-reschedule' },
          ].map(({ key, label, cls }) => (
            <button key={key} className={`home-stat-chip ${filter === key && activeTab === 'outgoing' ? 'active' : ''} ${cls}`}
              onClick={() => { setActiveTab('outgoing'); setFilter(key); }}>
              <span className="home-stat-num">{counts[key as keyof typeof counts]}</span>
              <span className="home-stat-label">{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="home-tabs">
        <button className={`home-tab ${activeTab === 'outgoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('outgoing')}>
          <Icon name="paper-plane-tilt" size={16} /> Відправлені
        </button>
        <button className={`home-tab ${activeTab === 'incoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('incoming')}>
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
              {filter === 'all' ? 'Створіть перше запрошення і поділіться ним з другом' : 'Спробуйте обрати інший фільтр'}
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
            const link = typeof window !== 'undefined' ? `${window.location.origin}/${inv.isGroup ? 'g' : 'i'}/${inv.id}` : '';
            return (
              <Link href={`/${inv.isGroup ? 'g' : 'i'}/${inv.id}`} key={inv.id} className={`home-inv-card status-${inv.status || 'pending'}`} style={{ animationDelay: `${i * 35}ms` }}>
                <div className="home-inv-emoji">{t.e}</div>
                <div className="home-inv-body">
                  <div className="home-inv-title">
                    {inv.to || inv.title || 'Групове запрошення'}
                    {inv.isGroup && <span className="home-inv-group-badge"><Icon name="users" size={12} /> Група</span>}
                  </div>
                  <div className="home-inv-meta">
                    {t.l}
                    {inv.date && ` · ${inv.date}`}
                    {inv.time && ` · ${inv.time}`}
                  </div>
                </div>
                <div className="home-inv-right">
                  {getStatusBadge(inv.status || 'pending')}
                  <button className="home-copy-btn" title="Копіювати посилання"
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(link);
                      // Toast here
                    }}>
                    <Icon name="link" size={14} />
                  </button>
                </div>
              </Link>
            );
          })
        )
      ) : (
        <div className="home-empty">
          <div className="home-empty-icon"><Icon name="users" size={40} /></div>
          <div className="home-empty-title">Немає нових запрошень</div>
        </div>
      )}
    </>
  );
}
