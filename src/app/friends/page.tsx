'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getFriends, getUserByLogin, getUserById, sendFriendRequest,
  getFriendRequests, acceptFriendRequest, declineFriendRequest, removeFriend,
  getNotifications, markNotifRead
} from '@/lib/firebase/db';
import { timeAgo } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import Link from 'next/link';

export default function FriendsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [friendInvites, setFriendInvites] = useState<any[]>([]);
  const [tab, setTab] = useState<'friends' | 'requests' | 'invites'>('friends');
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; isDanger?: boolean }>({ show: false, title: '', message: '', onConfirm: () => {} });

  const [searchInput, setSearchInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [fList, reqList, notifs] = await Promise.all([
        getFriends(user.uid),
        getFriendRequests(user.uid),
        getNotifications(user.uid)
      ]);
      
      setFriends(fList);
      
      const reqsWithProfiles = [];
      for (const r of reqList) {
        // getFriendRequests now returns raw data from node, but wait, 
        // the old logic stored name/uid in the node or sent via addNotification?
        // Let's rely on the notification data that stores fromUid and fromName
      }
      
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      // Parse requests from notifications
      const pendingReqs = notifs.filter(n => n.type === 'friend-request' && !n.read && now - n.createdAt < SEVEN_DAYS);
      setRequests(pendingReqs);

      // Parse invites via friends
      const invs = notifs.filter(n => (n.type === 'invite' || n.type === 'group-invite') && n.inviteId && !n.read && now - n.createdAt < SEVEN_DAYS);
      setFriendInvites(invs);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/login');
      return;
    }
    loadData();
    // Close menu when clicking outside
    const handleGlobalClick = () => setOpenMenuId(null);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [user, router]);

  const handleSearch = async () => {
    const term = searchInput.trim();
    if (!term || term.length < 3) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      let res = null;
      if (term.startsWith('@')) {
        res = await getUserByLogin(term.substring(1));
      } else if (term.toUpperCase().startsWith('ZAP-')) {
        res = await getUserById(term.toUpperCase());
      }
      
      if (res && res.uid === user?.uid) res = null;
      setSearchResult(res ? { ...res, found: true } : { found: false });
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult || !searchResult.uid || !user) return;
    try {
      await sendFriendRequest(user.uid, searchResult.uid, user.displayName || 'Користувач');
      toast('Запит надіслано!', 'success');
      setSearchResult(null);
      setSearchInput('');
    } catch (e: any) {
      toast(e.message || 'Помилка', 'error');
    }
  };

  const handleAcceptRequest = async (notifId: string, fromUid: string) => {
    if (!user) return;
    try {
      await acceptFriendRequest(user.uid, fromUid);
      await markNotifRead(user.uid, notifId);
      toast('Запит прийнято', 'success');
      loadData();
    } catch (e: any) {
      toast('Помилка прийняття', 'error');
    }
  };

  const handleDeclineRequest = async (notifId: string, fromUid: string) => {
    if (!user) return;
    try {
      await declineFriendRequest(user.uid, fromUid);
      await markNotifRead(user.uid, notifId);
      toast('Запит відхилено', 'info');
      loadData();
    } catch (e: any) {
      toast('Помилка відхилення', 'error');
    }
  };

  const handleRemoveFriend = (friendUid: string) => {
    if (!user) return;
    setConfirmModal({
      show: true,
      title: 'Видалення друга',
      message: 'Ви дійсно хочете видалити цього користувача з друзів?',
      isDanger: true,
      onConfirm: async () => {
        try {
          await removeFriend(user.uid, friendUid);
          toast('Друга видалено', 'info');
          loadData();
        } catch (e: any) {
          toast('Помилка', 'error');
        }
      }
    });
  };

  const toggleMenu = (e: React.MouseEvent, fUid: string) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setOpenMenuId(openMenuId === fUid ? null : fUid);
  };

  if (loading || user === undefined) {
    return (
      <div className="wrap">
        <div className="friends-header">
          <div className="skeleton-line" style={{width:'150px', height:'28px', marginBottom:'8px'}}></div>
          <div className="skeleton-line" style={{width:'280px', height:'14px'}}></div>
        </div>

        <div className="friends-search-bar">
          <div className="skeleton-line" style={{flex: 1, height: '44px', borderRadius: '10px'}}></div>
          <div className="skeleton-btn" style={{width: '90px', height: '44px', borderRadius: '10px'}}></div>
        </div>

        <div className="mode-tabs" style={{marginBottom:'24px'}}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{height:'38px', borderRadius:'8px', flex:1, margin:'0 4px'}}></div>
          ))}
        </div>

        {[1,2,3].map(i => (
          <div key={i} className="skeleton-card" style={{height: '68px', borderRadius: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', animationDelay:`${i*80}ms`}}>
            <div className="skeleton-circle" style={{width: '40px', height: '40px'}}></div>
            <div style={{flex: 1}}>
              <div className="skeleton-line w-1-2" style={{height: '14px', marginBottom: '8px'}}></div>
              <div className="skeleton-line w-1-4" style={{height: '10px'}}></div>
            </div>
            <div className="skeleton-line" style={{width: '24px', height: '24px', borderRadius: '50%'}}></div>
          </div>
        ))}
      </div>
    );
  }

  const isOnline = (f: any) => f.lastSeen && (Date.now() - f.lastSeen < 2 * 60 * 1000);

  return (
    <div className="wrap" style={{paddingBottom:'80px'}}>
      <div className="friends-header">
        <div>
          <h1 className="friends-title">Друзі</h1>
          <p className="friends-subtitle">Додавайте друзів та надсилайте запрошення напряму</p>
        </div>
      </div>

      <div className="friends-search-bar">
        <div className="friends-search-input-wrap">
          <span className="friends-search-icon"><Icon name="magnifying-glass" size={18}/></span>
          <input 
            placeholder="Введіть ID (ZAP-XXXX) або @логін"
            maxLength={12}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button className="btn btn-dark" onClick={handleSearch} disabled={searchLoading} style={{flexShrink:0, padding:'12px 20px', width:'auto'}}>
          {searchLoading ? <Icon name="circle-notch" size={16}/> : 'Знайти'}
        </button>
      </div>

      {searchResult && (
        <div className={`search-result-card ${searchResult.found ? 'search-found' : 'search-not-found'}`}>
          {searchResult.found ? (
            <>
              <div className="avatar">{searchResult.avatar ? <img src={searchResult.avatar} alt=""/> : (searchResult.name || '?').charAt(0).toUpperCase()}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:'.95rem', fontWeight:600, color:'var(--ink)', marginBottom:'2px'}}>{searchResult.name}</div>
                <div style={{fontSize:'.8rem', color:'var(--muted)'}}>
                  @{searchResult.login} • {searchResult.uniqueId}
                </div>
              </div>
              <button className="btn btn-dark" onClick={handleSendRequest} style={{padding:'8px 16px', fontSize:'.85rem'}}>
                <Icon name="user-plus" size={16}/> Додати
              </button>
            </>
          ) : (
            <>
              <Icon name="warning-circle" size={18} />
              <span>Користувача не знайдено</span>
            </>
          )}
        </div>
      )}

      <div className="mode-tabs">
        <button className={`mode-tab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
          <Icon name="users" size={16}/> Друзі
          {friends.length > 0 && <span className="tab-count">{friends.length}</span>}
        </button>
        <button className={`mode-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          <Icon name="hand-waving" size={16}/> Запити
          {requests.length > 0 && <span className="tab-count" style={{background:'rgba(192,57,43,.15)', color:'var(--red)'}}>{requests.length}</span>}
        </button>
        <button className={`mode-tab ${tab === 'invites' ? 'active' : ''}`} onClick={() => setTab('invites')}>
          <Icon name="paper-plane-tilt" size={16}/> Запрошення
          {friendInvites.length > 0 && <span className="tab-count">{friendInvites.length}</span>}
        </button>
      </div>

      {tab === 'friends' && (
        friends.length === 0 ? (
          <div className="friends-empty">
            <div className="friends-empty-icon"><Icon name="users-three" size={40}/></div>
            <div className="friends-empty-title">Ще немає друзів</div>
            <p className="friends-empty-sub">
              Введіть унікальний ID (ZAP-XXXXXX) або @логін у пошуковий рядок вище, щоб знайти друга
            </p>
          </div>
        ) : (
          <div className="friend-list">
            {friends.map((f, i) => {
              const online = isOnline(f);
              const statusText = online ? 'В мережі' : (f.lastSeen ? timeAgo(f.lastSeen) : '');
              return (
                <div key={f.uid} className="friend-row" style={{animationDelay: `${i * 35}ms`}}>
                  <div style={{position:'relative', flexShrink:0}}>
                    <div className="avatar avatar-sm">
                      {f.avatar ? <img src={f.avatar} alt=""/> : (f.name || '?').charAt(0).toUpperCase()}
                    </div>
                    {online && <span className="friend-online-dot"></span>}
                  </div>
                  <div className="friend-row-info">
                    <div className="friend-row-name">
                      {f.name}
                      {f.uniqueId && <span style={{fontSize:'.8rem', color:'var(--muted)', marginLeft:'6px', fontWeight:400}}>{f.uniqueId}</span>}
                    </div>
                    {statusText && <div className={`friend-row-status ${online ? 'online' : ''}`}>{statusText}</div>}
                  </div>
                  <div style={{position:'relative'}}>
                    <button className="friend-menu-btn" title="Дії" onClick={e => toggleMenu(e, f.uid)}>
                      <Icon name="dots-three-vertical" size={20}/>
                    </button>
                    {openMenuId === f.uid && (
                      <div className="friend-menu" onClick={e => e.stopPropagation()} style={{position:'absolute', top:'100%', right:'0', minWidth:'180px', marginTop:'4px'}}>
                        <Link href={`/u/${f.uid}`} className="friend-menu-item" style={{textDecoration: 'none'}}>
                          <Icon name="user" size={16}/> Перейти до профілю
                        </Link>
                        <button className="friend-menu-item danger" onClick={() => { setOpenMenuId(null); handleRemoveFriend(f.uid); }}>
                          <Icon name="user-minus" size={16}/> Видалити з друзів
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'requests' && (
        requests.length === 0 ? (
          <div className="friends-empty">
            <div className="friends-empty-icon"><Icon name="hand-waving" size={40}/></div>
            <div className="friends-empty-title">Немає запитів</div>
            <p className="friends-empty-sub">Нові запити на дружбу з'являться тут</p>
          </div>
        ) : (
          <div className="friend-list">
            {requests.map(r => (
              <div key={r.id} className="friend-row" style={{flexWrap: 'wrap'}}>
                <div style={{display:'flex', alignItems:'center', gap:'14px', flex:1, minWidth:'200px'}}>
                  <div className="avatar avatar-sm">
                    {(r.fromName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="friend-row-info">
                    <div className="friend-row-name">{r.fromName || 'Невідомий'}</div>
                    <div className="friend-row-status">Хоче додати вас у друзі</div>
                  </div>
                </div>
                <div style={{display:'flex', gap:'8px', width:'100%', marginTop:'10px'}}>
                  <button className="btn btn-dark" style={{flex:1, padding:'10px', fontSize:'.85rem'}} onClick={() => handleAcceptRequest(r.id, r.fromUid)}>
                    Прийняти
                  </button>
                  <button className="btn btn-outline" style={{flex:1, padding:'10px', fontSize:'.85rem'}} onClick={() => handleDeclineRequest(r.id, r.fromUid)}>
                    Відхилити
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'invites' && (
        friendInvites.length === 0 ? (
          <div className="friends-empty">
            <div className="friends-empty-icon"><Icon name="paper-plane-tilt" size={40}/></div>
            <div className="friends-empty-title">Немає запрошень</div>
          </div>
        ) : (
          <div className="friend-list">
            {friendInvites.map(inv => (
              <Link href={`/${inv.type === 'group-invite' ? 'g' : 'i'}/${inv.inviteId}`} key={inv.id} className="friend-row" style={{textDecoration:'none', color:'inherit'}}>
                <div style={{display:'flex', alignItems:'center', gap:'14px', flex:1}}>
                  <div className="avatar avatar-sm" style={{background:'var(--blue-bg)', color:'var(--blue)', border:'none'}}>
                    <Icon name="paper-plane-tilt" size={18}/>
                  </div>
                  <div className="friend-row-info">
                    <div className="friend-row-name" style={{fontSize:'.95rem', color:'var(--ink)'}}>{inv.title}</div>
                    <div className="friend-row-status" style={{color:'var(--muted)'}}>{inv.body}</div>
                  </div>
                </div>
                <Icon name="caret-right" size={16} color="var(--muted)"/>
              </Link>
            ))}
          </div>
        )
      )}
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        isDanger={confirmModal.isDanger}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal(prev => ({ ...prev, show: false }));
        }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
