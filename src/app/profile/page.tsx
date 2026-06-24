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

  if (loading || user === undefined || !profile) {
    return (
      <div className="wrap">
        <div className="profile-header">
          <div className="skeleton-line" style={{width:'160px', height:'28px'}}></div>
          <div className="skeleton-circle" style={{width:'36px', height:'36px'}}></div>
        </div>

        <div className="profile-card" style={{display:'flex', alignItems:'center', gap:'20px', padding:'24px', marginBottom:'24px'}}>
          <div className="skeleton-circle" style={{width:'72px', height:'72px'}}></div>
          <div style={{flex:1}}>
            <div className="skeleton-line w-1-2" style={{height:'18px', marginBottom:'10px'}}></div>
            <div className="skeleton-line w-1-3" style={{height:'14px'}}></div>
          </div>
        </div>

        <div className="profile-menu" style={{marginBottom:'24px'}}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-card" style={{height:'52px', border:'none', borderBottom:'1px solid var(--border)', borderRadius:0, display:'flex', alignItems:'center', padding:'0 20px', gap:'16px'}}>
              <div className="skeleton-circle" style={{width:'24px', height:'24px'}}></div>
              <div className="skeleton-line w-1-3" style={{height:'14px'}}></div>
            </div>
          ))}
        </div>

        <div className="skeleton-card" style={{height:'140px', borderRadius:'12px'}}></div>
      </div>
    );
  }

  return (
    <div className="wrap">
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

      {/* Danger Zone */}
      <div className="profile-danger">
        <div className="profile-danger-header">
          <div className="profile-danger-icon"><Icon name="warning" size={16}/></div>
          <div className="profile-danger-title">Небезпечна зона</div>
        </div>
        <div className="profile-danger-body">
          <p style={{fontSize:'.88rem', color:'var(--muted)', marginBottom:'16px', lineHeight:'1.6'}}>
            Видалення акаунту є незворотнім. Усі ваші дані, запрошення та список друзів будуть безповоротно видалені.
          </p>
          <button className="btn btn-red btn-sm" onClick={() => {}} style={{width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px'}}>
            <Icon name="trash" size={14}/> Видалити акаунт
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="profile-logout">
        <button className="btn-ghost" onClick={handleLogout} style={{color:'var(--red)', fontSize:'.9rem', display:'flex', alignItems:'center', gap:'6px'}}>
          <Icon name="sign-out" size={16}/> Вийти з акаунту
        </button>
      </div>
    </div>
  );
}
