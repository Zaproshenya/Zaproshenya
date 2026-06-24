'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/Icon';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/login');
      return;
    }
    
    // For now we just mock an empty list
    setLoading(false);
  }, [user, router]);

  if (loading || user === undefined) {
    return (
      <div className="wrap">
        <div className="notif-page-header">
          <div className="notif-page-header-left">
            <div className="skeleton-line" style={{width: '140px', height: '28px', marginBottom: '8px'}}></div>
            <div className="skeleton-line" style={{width: '280px', height: '14px'}}></div>
          </div>
          <div style={{display:'flex', gap:'8px'}}>
            <div className="skeleton-line" style={{width: '36px', height: '36px', borderRadius: '50%'}}></div>
            <div className="skeleton-line" style={{width: '36px', height: '36px', borderRadius: '50%'}}></div>
          </div>
        </div>

        {[1,2,3].map(i => (
          <div key={i} className="skeleton-card" style={{height: '80px', borderRadius: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', animationDelay:`${i*80}ms`}}>
            <div className="skeleton-circle" style={{width: '40px', height: '40px'}}></div>
            <div style={{flex: 1}}>
              <div className="skeleton-line w-3-4" style={{height: '14px', marginBottom: '8px'}}></div>
              <div className="skeleton-line w-1-2" style={{height: '10px'}}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="notif-page-header">
        <div className="notif-page-header-left">
          <h1 className="notif-page-title">Сповіщення</h1>
          <p className="notif-page-subtitle">Тут з'являтимуться відповіді на ваші запрошення та запити в друзі</p>
        </div>
        <div style={{display:'flex', gap:'8px'}}>
          <button className="btn-icon" title="Налаштування" onClick={() => {}}>
            <Icon name="gear" size={20}/>
          </button>
          <button className="btn-icon" title="Прочитати всі" onClick={() => {}}>
            <Icon name="check-circle" size={20}/>
          </button>
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon"><Icon name="bell-slash" size={32}/></div>
            <div className="notif-empty-title">Немає сповіщень</div>
            <p className="notif-empty-sub">Нові сповіщення з'являться тут</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id}>Сповіщення</div>
          ))
        )}
      </div>
    </div>
  );
}
