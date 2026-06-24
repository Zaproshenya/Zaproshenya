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

  if (loading || !user) {
    return <div style={{padding: '2rem'}}>Завантаження...</div>;
  }

  return (
    <>
      <div className="notif-header">
        <h1 className="notif-title">Сповіщення</h1>
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
          <div className="friends-empty" style={{marginTop:'40px'}}>
            <div className="friends-empty-icon"><Icon name="bell-slash" size={40}/></div>
            <div className="friends-empty-title">Немає нових сповіщень</div>
            <p className="friends-empty-sub">Тут з'являтимуться відповіді на ваші запрошення та запити в друзі</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id}>Сповіщення</div>
          ))
        )}
      </div>
    </>
  );
}
