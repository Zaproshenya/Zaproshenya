'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from './Icon';

export function Navbar() {
  const { user, profile, unreadCount, adminUnreadCount } = useAuth();
  const pathname = usePathname();

  const isHiddenPage = pathname === '/login' || pathname === '/register' || pathname?.startsWith('/i/') || pathname?.startsWith('/g/');
  if (isHiddenPage) return null;

  if (pathname === '/') return null; // Landing uses its own structure

  const isActive = (path: string) => pathname === path ? 'on' : '';

  return (
    <header className="topbar">
      <Link href={user ? "/home" : "/"} className="logo">Запрошення ✦</Link>
      <div className="topbar-right">
        {user ? (
          <>
            <Link href="/home" className={`nb ${isActive('/home')}`}>
              <Icon name="house" size={18} /> Мої
            </Link>
            <Link href="/create" className={`nb ${isActive('/create')}`}>
              <Icon name="plus" size={18} /> Нове
            </Link>
            <div className="pill-wrap">
              <Link href="/friends" className={`nb ${isActive('/friends')}`} aria-label="Друзі">
                <Icon name="users" size={18} />
              </Link>
            </div>
            {profile && (profile.role === 'founder' || profile.role === 'tech-admin' || profile.role === 'moderator') && (
              <div className="pill-wrap" style={{ position: 'relative' }}>
                <Link href="/admin" className={`nb ${isActive('/admin')}`} aria-label="Дашборд">
                  <Icon name="wrench" size={18} />
                </Link>
                {adminUnreadCount > 0 && <span className="notif-badge">{adminUnreadCount}</span>}
              </div>
            )}
            <div className="pill-wrap" style={{ position: 'relative' }}>
              <Link href="/notifications" className={`nb ${isActive('/notifications')}`} aria-label="Сповіщення">
                <Icon name="bell" size={18} />
              </Link>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </div>
            <Link href="/profile" className="topbar-user">
              <div className="avatar avatar-sm">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  (profile?.name || '?').charAt(0).toUpperCase()
                )}
              </div>
              <span className="topbar-username">{profile?.name}</span>
            </Link>
          </>
        ) : (
          <Link href="/login" className="btn btn-outline btn-sm" style={{ padding: '6px 12px' }}>Увійти</Link>
        )}
      </div>
    </header>
  );
}
