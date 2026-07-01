'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { ref, get } from 'firebase/database';
import { sendFriendRequest, acceptFriendRequest, removeFriend } from '@/lib/firebase/db';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import Link from 'next/link';

export default function ClientUserProfile({ uid }: { uid: string }) {
  const { user: me } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<string>(''); // 'none', 'friend', 'pending-sent', 'pending-received'

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await get(ref(db, 'users/' + uid));
        if (snap.exists()) {
          setUserData(snap.val());
        } else {
          setUserData(null);
        }

        if (me && me.uid !== uid) {
          const fSnap = await get(ref(db, `friends/${me.uid}/${uid}`));
          if (fSnap.exists()) {
            setFriendStatus('friend');
          } else {
            const rSnap = await get(ref(db, `friend-requests/${me.uid}/${uid}`));
            if (rSnap.exists()) {
              setFriendStatus('pending-received');
            } else {
              const sSnap = await get(ref(db, `friend-requests/${uid}/${me.uid}`));
              if (sSnap.exists()) {
                setFriendStatus('pending-sent');
              } else {
                setFriendStatus('none');
              }
            }
          }
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid, me]);

  const handleAddFriend = async () => {
    if (!me || !userData) return;
    try {
      await sendFriendRequest(me.uid, userData.uid, me.displayName || 'Користувач');
      setFriendStatus('pending-sent');
      toast('Запит надіслано', 'success');
    } catch(e: any) {
      toast(e.message || 'Помилка', 'error');
    }
  };

  const handleAcceptRequest = async () => {
    if (!me || !userData) return;
    try {
      await acceptFriendRequest(me.uid, userData.uid);
      setFriendStatus('friend');
      toast('Запит прийнято', 'success');
    } catch(e) {
      toast('Помилка', 'error');
    }
  };

  const isMe = me?.uid === uid;
  const isOnline = userData?.lastSeen && (Date.now() - userData.lastSeen < 2 * 60 * 1000);
  const memberSince = userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }) : '';

  if (loading) {
    return (
      <div className="wrap" style={{marginTop:'40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
          <div className="skeleton-line" style={{width:'140px',height:'28px'}}></div>
          <div className="skeleton" style={{width:'40px',height:'40px',borderRadius:'50%'}}></div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="uprofile-wrap wrap" style={{marginTop:'40px'}}>
        <div className="home-empty">
          <div className="home-empty-icon"><Icon name="user" size={36}/></div>
          <div className="home-empty-title">Користувача не знайдено</div>
          <p className="home-empty-sub">Можливо, він видалив акаунт</p>
        </div>
      </div>
    );
  }

  return (
    <div className="uprofile-wrap">
      {/* Back button */}
      <Link href="/" className="uprofile-back-btn" style={{textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'8px',marginBottom:'24px',color:'var(--muted)',fontSize:'.9rem'}}>
        <Icon name="arrow-left" size={16}/> Назад
      </Link>

      {/* Hero card */}
      <div className="profile-hero" style={{marginBottom:'20px'}}>
        <div className="profile-hero-star">✦</div>
        <div className="profile-hero-inner">
          {/* Avatar with online ring */}
          <div className="profile-avatar-wrap">
            <div className={`profile-avatar-ring ${isOnline ? 'online' : ''}`}>
              <div className="avatar avatar-xl">
                {userData.avatar ? <img src={userData.avatar} alt="Avatar"/> : (userData.name||'?').charAt(0).toUpperCase()}
              </div>
            </div>
            {isOnline && <div className="uprofile-online-badge">В мережі</div>}
          </div>
          
          {/* Name + badges */}
          <div className="profile-hero-info">
            <div className="profile-hero-name" style={{color:'#fff'}}>{userData.name}</div>
            <div className="profile-hero-meta">
              {userData.role === 'founder' && <span className="role-badge founder">Засновник</span>}
              {userData.role === 'tech-admin' && <span className="role-badge tech-admin">Тех-адмін</span>}
              {userData.role === 'moderator' && <span className="role-badge moderator">Модератор</span>}
              {userData.role === 'support' && <span className="role-badge support">Підтримка</span>}
              <span className="profile-id">{userData.uniqueId}</span>
            </div>
            
            <div className="profile-hero-login">
              <span className="phl-item" style={{color:'var(--muted)'}}><Icon name="user" size={11}/> @{userData.login}</span>
              {memberSince && (
                <span className="phl-item date" style={{color:'var(--muted)'}}>
                  <Icon name="calendar-blank" size={11}/> з {memberSince}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons row below hero */}
      {!isMe && me && (
        <div className="uprofile-actions" style={{display:'flex', gap:'10px', justifyContent:'center', marginBottom:'20px'}}>
          {friendStatus === 'friend' && (
            <button className="btn btn-sm" disabled style={{background:'var(--green-bg)',color:'var(--green)',border:'1.5px solid rgba(45,122,79,.25)',borderRadius:'12px',padding:'12px 22px', display:'flex', alignItems:'center', gap:'6px'}}>
              <Icon name="check-circle" size={15}/> У друзях
            </button>
          )}
          {friendStatus === 'pending-sent' && (
            <button className="btn btn-outline btn-sm" disabled style={{padding:'12px 22px', display:'flex', alignItems:'center', gap:'6px'}}>
              <Icon name="clock" size={15}/> Запит надіслано
            </button>
          )}
          {friendStatus === 'pending-received' && (
            <button className="btn btn-gold btn-sm" onClick={handleAcceptRequest} style={{padding:'12px 22px', display:'flex', alignItems:'center', gap:'6px'}}>
              <Icon name="check" size={15}/> Прийняти запит
            </button>
          )}
          {friendStatus === 'none' && (
            <button className="btn btn-dark btn-sm" onClick={handleAddFriend} style={{padding:'12px 22px', display:'flex', alignItems:'center', gap:'6px'}}>
              <Icon name="hand-waving" size={15}/> Додати в друзі
            </button>
          )}
          <Link href={`/create?to=${encodeURIComponent(userData.name)}`} className="btn btn-gold btn-sm" style={{padding:'12px 22px',textDecoration:'none', display:'flex', alignItems:'center', gap:'6px'}}>
            <Icon name="paper-plane-tilt" size={15}/> Запросити
          </Link>
        </div>
      )}

      {isMe && (
        <div className="uprofile-actions" style={{display:'flex', gap:'10px', justifyContent:'center', marginBottom:'20px'}}>
          <Link href="/profile" className="btn btn-outline btn-sm" style={{padding:'12px 22px',textDecoration:'none', display:'flex', alignItems:'center', gap:'6px'}}>
            <Icon name="gear" size={15}/> Налаштування
          </Link>
        </div>
      )}

      {/* Info card (if not me) */}
      {!isMe && (
        <div className="uprofile-info-card">
          {friendStatus === 'friend' ? (
            <div className="uprofile-friend-status">
              <div className="uprofile-friend-status-icon"><Icon name="check-circle" size={20}/></div>
              <div>
                <div className="uprofile-friend-status-title">Ви друзі</div>
                <div className="uprofile-friend-status-sub">Ви можете надсилати запрошення напряму</div>
              </div>
            </div>
          ) : friendStatus === 'pending-sent' ? (
            <div className="uprofile-friend-status pending">
              <div className="uprofile-friend-status-icon"><Icon name="clock" size={20}/></div>
              <div>
                <div className="uprofile-friend-status-title">Запит надіслано</div>
                <div className="uprofile-friend-status-sub">Очікуємо відповіді від {userData.name}</div>
              </div>
            </div>
          ) : (
            <div className="uprofile-info-row">
              <span className="uprofile-info-icon"><Icon name="info" size={16}/></span>
              <span className="uprofile-info-text">Додайте {userData.name} у друзі, щоб надсилати запрошення напряму</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
