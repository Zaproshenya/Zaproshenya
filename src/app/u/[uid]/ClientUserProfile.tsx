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
    <div className="uprofile-wrap wrap" style={{marginTop:'40px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <h1 className="page-title" style={{marginBottom:0}}>Профіль</h1>
      </div>

      <div className="uprofile-card" style={{background:'var(--card)',borderRadius:'var(--radius-lg)',border:'1px solid var(--border)',padding:'30px',marginBottom:'24px'}}>
        <div className="uprofile-avatar-ring">
          <div className="avatar avatar-xl">
            {userData.avatar ? <img src={userData.avatar} alt="Avatar"/> : (userData.name||'?').charAt(0).toUpperCase()}
          </div>
          {isOnline && <div className="friend-online-dot" style={{width:'18px',height:'18px',bottom:'6px',right:'6px',border:'3px solid var(--card)'}}></div>}
        </div>
        
        <h2 className="uprofile-name">{userData.name}</h2>
        <div className="uprofile-meta" style={{color:'var(--muted)',fontSize:'.9rem',display:'flex',alignItems:'center',gap:'8px',justifyContent:'center',marginBottom:'16px'}}>
          <span style={{fontFamily:'monospace',fontSize:'.85rem'}}>{userData.uniqueId}</span>
          {userData.role === 'founder' && <span className="role-badge founder">Засновник</span>}
          {userData.role === 'tech-admin' && <span className="role-badge founder" style={{background:'var(--ink)',color:'#fff'}}>Тех-адмін</span>}
        </div>

        <div className="uprofile-since" style={{fontSize:'.85rem',color:'var(--muted)',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
          <Icon name="calendar-blank" size={14}/> В системі з {memberSince}
        </div>

        {/* Actions */}
        {!isMe && me && (
          <div className="uprofile-actions" style={{marginTop:'24px',display:'flex',justifyContent:'center',gap:'12px'}}>
            {friendStatus === 'friend' && (
              <button className="btn btn-sm" disabled style={{background:'var(--green-bg)',color:'var(--green)',border:'1.5px solid rgba(45,122,79,.25)',borderRadius:'12px',padding:'12px 22px'}}>
                <Icon name="check-circle" size={15}/> Ви друзі
              </button>
            )}
            {friendStatus === 'pending-sent' && (
              <button className="btn btn-outline btn-sm" disabled style={{padding:'12px 22px'}}>
                <Icon name="clock" size={15}/> Запит надіслано
              </button>
            )}
            {friendStatus === 'pending-received' && (
              <button className="btn btn-gold btn-sm" onClick={handleAcceptRequest} style={{padding:'12px 22px'}}>
                <Icon name="check" size={15}/> Прийняти запит
              </button>
            )}
            {friendStatus === 'none' && (
              <button className="btn btn-gold btn-sm" onClick={handleAddFriend} style={{padding:'12px 22px'}}>
                <Icon name="user-plus" size={15}/> Додати в друзі
              </button>
            )}
          </div>
        )}

        {isMe && (
          <div className="uprofile-actions" style={{marginTop:'24px',display:'flex',justifyContent:'center'}}>
            <Link href="/profile" className="btn btn-outline btn-sm" style={{padding:'12px 22px',textDecoration:'none'}}>
              <Icon name="gear" size={15}/> Налаштування
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
