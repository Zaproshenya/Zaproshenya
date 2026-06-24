'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from './Icon';

export function BottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const unreadCount = 0; // TODO: fetch from notifications

  if (!user) return null;

  const isHiddenPage = pathname === '/login' || pathname === '/register' || pathname?.startsWith('/i/') || pathname?.startsWith('/g/');
  if (isHiddenPage) return null;

  const isActive = (path: string) => pathname === path ? 'on' : '';

  return (
    <nav className="bottom-nav">
      <Link href="/home" className={`bn-item ${isActive('/home')}`}>
        <div style={{ fontSize: '1.25rem' }}><Icon name="house" size={22} /></div>
        <span>Мої</span>
      </Link>
      <Link href="/create" className={`bn-item ${isActive('/create')}`}>
        <div style={{ fontSize: '1.25rem' }}><Icon name="plus" size={22} /></div>
        <span>Нове</span>
      </Link>
      <Link href="/friends" className={`bn-item ${isActive('/friends')}`}>
        <div style={{ fontSize: '1.25rem' }}><Icon name="users" size={22} /></div>
        <span>Друзі</span>
      </Link>
      <Link href="/notifications" className={`bn-item ${isActive('/notifications')}`} style={{ position: 'relative' }}>
        <div style={{ fontSize: '1.25rem' }}><Icon name="bell" size={22} /></div>
        <span>Сповіщення</span>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </Link>
      <Link href="/profile" className={`bn-item ${isActive('/profile')}`}>
        <div style={{ fontSize: '1.25rem' }}><Icon name="user" size={22} /></div>
        <span>Профіль</span>
      </Link>
    </nav>
  );
}
