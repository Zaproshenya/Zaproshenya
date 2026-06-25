'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { listenNotifications, markNotifRead, markAllNotifsRead, deleteNotification } from '@/lib/firebase/db';
import { timeAgo } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import Link from 'next/link';

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

    const unsub = listenNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsub();
  }, [user, router]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllNotifsRead(user.uid);
      toast('Всі сповіщення прочитано', 'success');
    } catch (e) {
      toast('Помилка', 'error');
    }
  };

  const handleMarkRead = async (notifId: string) => {
    if (!user) return;
    try {
      await markNotifRead(user.uid, notifId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteNotification(user.uid, notifId);
    } catch (e) {
      console.error(e);
    }
  };

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

  const renderIcon = (type: string) => {
    switch (type) {
      case 'friend-request': return <Icon name="user-plus" size={20}/>;
      case 'friend-accepted': return <Icon name="user-check" size={20}/>;
      case 'friend-removed': return <Icon name="user-minus" size={20}/>;
      case 'invite': return <Icon name="envelope-open" size={20}/>;
      case 'group-invite': return <Icon name="users" size={20}/>;
      case 'support-reply': return <Icon name="headset" size={20}/>;
      case 'system': return <Icon name="info" size={20}/>;
      default: return <Icon name="bell" size={20}/>;
    }
  };

  return (
    <div className="wrap" style={{paddingBottom:'80px'}}>
      <div className="notif-page-header">
        <div className="notif-page-header-left">
          <h1 className="notif-page-title">Сповіщення</h1>
          <p className="notif-page-subtitle">Тут з'являтимуться відповіді на ваші запрошення та запити в друзі</p>
        </div>
        <div style={{display:'flex', gap:'8px'}}>
          <button className="btn-icon" title="Прочитати всі" onClick={handleMarkAllRead}>
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
          notifications.map(n => {
            const isInvite = n.type === 'invite' || n.type === 'group-invite';
            const isRequest = n.type === 'friend-request';
            
            const Wrapper = (isInvite && n.inviteId) ? Link : 'div';
            const wrapperProps: any = {};
            if (isInvite && n.inviteId) {
              wrapperProps.href = `/${n.type === 'group-invite' ? 'g' : 'i'}/${n.inviteId}`;
              wrapperProps.className = `notif-item ${!n.read ? 'unread' : ''}`;
            } else {
              wrapperProps.className = `notif-item ${!n.read ? 'unread' : ''}`;
              wrapperProps.onClick = () => !n.read && !isRequest && handleMarkRead(n.id);
            }

            return (
              <Wrapper key={n.id} {...wrapperProps} style={isInvite ? {textDecoration:'none', color:'inherit'} : {}}>
                <div className={`notif-icon-wrap type-${n.type || 'default'}`}>
                  {renderIcon(n.type)}
                </div>
                <div className="notif-body">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-text">{n.body}</div>
                  <div className="notif-time">{timeAgo(n.createdAt)}</div>
                </div>
                <div className="notif-actions">
                  {!n.read && <div className="notif-unread-dot"></div>}
                  {isRequest && (
                    <button className="btn btn-dark btn-sm" onClick={(e) => { e.stopPropagation(); router.push('/friends'); }}>
                      Переглянути
                    </button>
                  )}
                  <button className="notif-delete-btn" onClick={(e) => handleDelete(e, n.id)}>
                    <Icon name="x" size={16}/>
                  </button>
                </div>
              </Wrapper>
            );
          })
        )}
      </div>
    </div>
  );
}
