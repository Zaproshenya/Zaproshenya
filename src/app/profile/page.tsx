'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/lib/firebase/auth';
import { Icon } from '@/components/Icon';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !user || !profile) {
    return <div style={{padding: '2rem'}}>Завантаження...</div>;
  }

  return (
    <>
      <div className="profile-header">
        <h1 className="profile-title">Мій профіль</h1>
        <button className="btn-icon" onClick={handleLogout} title="Вийти">
          <Icon name="sign-out" size={20}/>
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {profile.avatar ? <img src={profile.avatar} alt=""/> : profile.name?.charAt(0).toUpperCase()}
          </div>
          <button className="profile-avatar-edit"><Icon name="camera" size={16}/></button>
        </div>
        <div className="profile-info">
          <div className="profile-name">{profile.name}</div>
          <div className="profile-id-badge" onClick={() => navigator.clipboard.writeText(profile.uniqueId || '')}>
            {profile.uniqueId} <Icon name="copy" size={12}/>
          </div>
        </div>
      </div>

      <div className="profile-menu">
        <Link href="/friends" className="profile-menu-item">
          <div className="profile-menu-icon"><Icon name="users" size={20}/></div>
          <div className="profile-menu-text">Друзі</div>
          <Icon name="caret-right" size={16} color="var(--muted)"/>
        </Link>
        <Link href="/notifications" className="profile-menu-item">
          <div className="profile-menu-icon"><Icon name="bell" size={20}/></div>
          <div className="profile-menu-text">Сповіщення</div>
          <Icon name="caret-right" size={16} color="var(--muted)"/>
        </Link>
        <div className="profile-menu-item" onClick={() => {}}>
          <div className="profile-menu-icon"><Icon name="palette" size={20}/></div>
          <div className="profile-menu-text">Оформлення (Тема)</div>
          <Icon name="caret-right" size={16} color="var(--muted)"/>
        </div>
      </div>

      <div className="profile-danger-zone">
        <button className="btn-ghost danger" onClick={handleLogout} style={{width:'100%', marginBottom:'8px'}}>
          Вийти з акаунту
        </button>
        <button className="btn-ghost danger" onClick={() => {}} style={{width:'100%', opacity:0.7}}>
          Видалити акаунт назавжди
        </button>
      </div>
    </>
  );
}
