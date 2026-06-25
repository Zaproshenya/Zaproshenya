'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from './Icon';

export function BottomNav() {
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const unreadCount = 0; // TODO: fetch from notifications

  if (!user) return null;

  const isHiddenPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname?.startsWith('/i/') || pathname?.startsWith('/g/');
  if (isHiddenPage) return null;

  const isActive = (path: string) => pathname === path ? 'on' : '';
  const isAdmin = profile && (profile.role === 'founder' || profile.role === 'tech-admin' || profile.role === 'moderator');

  return (
    <nav className="bottom-nav">
      <Link href="/home" className={`bn-item ${isActive('/home')}`}>
        <div style={{ fontSize: '1.25rem' }}><Icon name="house" size={22} /></div>
        <span>Мої</span>
      </Link>
      <Link href="/friends" className={`bn-item ${isActive('/friends')}`}>
        <div style={{ fontSize: '1.25rem' }}><Icon name="users" size={22} /></div>
        <span>Друзі</span>
      </Link>

      {/* Center FAB Button */}
      <Link href="/create" className="bn-fab">
        <Icon name="plus" size={24} />
      </Link>

      <Link href="/notifications" className={`bn-item ${isActive('/notifications')}`} style={{ position: 'relative' }}>
        <div style={{ fontSize: '1.25rem' }}><Icon name="bell" size={22} /></div>
        <span>Сповіщення</span>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </Link>
      
      {isAdmin ? (
        <Link href="/admin" className={`bn-item ${isActive('/admin')}`}>
          <div style={{ fontSize: '1.25rem' }}><Icon name="chart-bar" size={22} /></div>
          <span>Панель</span>
        </Link>
      ) : (
        <Link href="/profile" className={`bn-item ${isActive('/profile')}`}>
          <div style={{ fontSize: '1.25rem' }}><Icon name="user" size={22} /></div>
          <span>Профіль</span>
        </Link>
      )}
    </nav>
  );
}
