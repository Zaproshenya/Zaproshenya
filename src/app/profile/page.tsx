'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser, updateProfileData, changeLogin, changePassword, deleteAccount, verifyAndChangeEmail } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserInvites, getFriends, getUserTickets, createSupportTicket, listenTicketMessages, stopListeningTicket, listenTicket, stopListeningTicketMeta, sendTicketMessage, markTicketReadByUser } from '@/lib/firebase/db';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  // Modals state
  const [editMode, setEditMode] = useState<'name'|'login'|'password'|'email'|'disable2fa'|null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  
  const [targetEmail, setTargetEmail] = useState('');
  const [showEmailSent, setShowEmailSent] = useState(false);
  const [disablePass, setDisablePass] = useState('');

  useEffect(() => {
    if (editMode !== 'email' || !showEmailSent || !targetEmail) return;
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified && auth.currentUser.email === targetEmail) {
          clearInterval(interval);
          const { updateProfileData } = await import('@/lib/firebase/auth');
          await updateProfileData(auth.currentUser.uid, { email: targetEmail, twoFactorEnabled: true });
          updateProfile({ email: targetEmail, twoFactorEnabled: true });
          toast('Електронну пошту підтверджено! 2FA активовано. ✦', 'success');
          setEditMode(null);
          setShowEmailSent(false);
          setTargetEmail('');
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [editMode, showEmailSent, targetEmail, updateProfile]);
  
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [ticketType, setTicketType] = useState('bug');
  
  const [chatTicketId, setChatTicketId] = useState<string | null>(null);
  const [chatTicket, setChatTicket] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Form refs
  const nameRef = useRef<HTMLInputElement>(null);
  const loginRef = useRef<HTMLInputElement>(null);
  const oldPassRef = useRef<HTMLInputElement>(null);
  const newPassRef = useRef<HTMLInputElement>(null);
  const newPass2Ref = useRef<HTMLInputElement>(null);
  
  const ticketSubjectRef = useRef<HTMLInputElement>(null);
  const ticketMsgRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const deletePassRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [invs, frnds, tkts] = await Promise.all([
          getUserInvites(user.uid),
          getFriends(user.uid),
          getUserTickets(user.uid)
        ]);
        
        const personalCount = invs.filter((i: any) => !i.isGroup).length;
        const groupCount = invs.filter((i: any) => i.isGroup).length;
        const acceptedCount = invs.filter((i: any) => i.status === 'accepted').length;
        const declinedCount = invs.filter((i: any) => i.status === 'declined').length;
        const pendingCount = invs.filter((i: any) => i.status === 'pending' || !i.status).length;

        setStats({
          totalInvites: invs.length,
          personalCount, groupCount,
          acceptedCount, declinedCount, pendingCount,
          totalFriends: frnds.length
        });
        setTickets(tkts);
      } catch (e) {
        console.warn('Profile load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, router]);

  useEffect(() => {
    if (chatTicketId) {
      listenTicketMessages(chatTicketId, setChatMessages);
      listenTicket(chatTicketId, setChatTicket);
      return () => {
        stopListeningTicket(chatTicketId);
        stopListeningTicketMeta(chatTicketId);
      };
    }
  }, [chatTicketId]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    const isModalOpen = !!(editMode || newTicketOpen || chatTicketId || deleteModalOpen);
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editMode, newTicketOpen, chatTicketId, deleteModalOpen]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyId = () => {
    if (!profile?.uniqueId) return;
    navigator.clipboard.writeText(profile.uniqueId);
    toast('ID скопійовано', 'success');
  };

  const closeEditModal = () => {
    setEditMode(null);
    setEditError('');
    setShowEmailSent(false);
    setTargetEmail('');
    setDisablePass('');
  };

  const handleSaveEdit = async () => {
    if (!user || !profile) return;
    setEditError('');
    setSaving(true);
    try {
      if (editMode === 'name') {
        const val = nameRef.current?.value.trim();
        if (!val || val.length < 2) throw new Error("Ім'я має бути не менше 2 символів");
        await updateProfileData(user.uid, { name: val });
        toast("Ім'я змінено", 'success');
        setEditMode(null);
      } else if (editMode === 'login') {
        const val = loginRef.current?.value.trim();
        if (!val) throw new Error("Введіть логін");
        await changeLogin(user, profile, val);
        toast("Логін змінено", 'success');
        setEditMode(null);
      } else if (editMode === 'password') {
        const oldP = oldPassRef.current?.value;
        const newP = newPassRef.current?.value;
        const newP2 = newPass2Ref.current?.value;
        if (!oldP || !newP) throw new Error("Заповніть всі поля");
        if (newP !== newP2) throw new Error("Паролі не співпадають");
        await changePassword(user, profile, oldP, newP);
        toast("Пароль змінено", 'success');
        setEditMode(null);
      } else if (editMode === 'email') {
        if (showEmailSent) {
          await auth.currentUser?.reload();
          if (auth.currentUser?.emailVerified && auth.currentUser.email === targetEmail) {
            const { updateProfileData } = await import('@/lib/firebase/auth');
            await updateProfileData(auth.currentUser.uid, { email: targetEmail, twoFactorEnabled: true });
            updateProfile({ email: targetEmail, twoFactorEnabled: true });
            toast('Пошту успішно підтверджено! 2FA активовано. ✦', 'success');
            setEditMode(null);
            setShowEmailSent(false);
            setTargetEmail('');
          } else {
            throw new Error("Електронна пошта ще не підтверджена. Перевірте свій лист.");
          }
          return;
        }

        const emailVal = targetEmail.trim().toLowerCase();
        if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
          throw new Error("Некоректний формат пошти");
        }
        await verifyAndChangeEmail(user, emailVal);
        setShowEmailSent(true);
        toast("Лист-підтвердження надіслано!", 'success');
      } else if (editMode === 'disable2fa') {
        if (!disablePass) throw new Error("Введіть пароль");
        const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
        const email = user.email || (profile.login + '@zap.app');
        const cred = EmailAuthProvider.credential(email, disablePass);
        await reauthenticateWithCredential(user, cred);

        const { updateProfileData } = await import('@/lib/firebase/auth');
        await updateProfileData(user.uid, { twoFactorEnabled: false });
        updateProfile({ twoFactorEnabled: false });

        toast('Двофакторну автентифікацію вимкнено', 'info');
        setDisablePass('');
        setEditMode(null);
      }
    } catch (e: any) {
      let msg = e.message || 'Помилка';
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'Невірний поточний пароль';
      if (e.code === 'auth/requires-recent-login') {
        if (editMode === 'email') msg = 'Для налаштування 2FA потрібно переувійти в акаунт';
        else if (editMode === 'password') msg = 'Для зміни паролю потрібно переувійти в акаунт';
        else if (editMode === 'login') msg = 'Для зміни логіну увійдіть знову';
        else msg = 'Для здійснення цієї дії потрібно переувійти в акаунт';
      }
      setEditError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user || !targetEmail) return;
    setSaving(true);
    try {
      await verifyAndChangeEmail(user, targetEmail);
      toast('Лист надіслано повторно!', 'success');
    } catch (e: any) {
      toast(e.message || 'Помилка відправлення', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!user || !profile) return;
    const subj = ticketSubjectRef.current?.value.trim();
    const msg = ticketMsgRef.current?.value.trim();
    if (!subj) return setEditError("Введіть тему");
    if (!msg) return setEditError("Введіть повідомлення");

    setSaving(true);
    try {
      const tid = await createSupportTicket({
        type: ticketType,
        subject: subj,
        firstMessage: msg,
        authorUid: user.uid,
        authorName: profile.name
      });
      toast('Звернення створено!', 'success');
      setNewTicketOpen(false);
      if (tid) {
        const tkts = await getUserTickets(user.uid);
        setTickets(tkts);
        openChat(tid);
      }
    } catch (e: any) {
      setEditError(e.message || "Помилка");
    } finally {
      setSaving(false);
    }
  };

  const openChat = (tid: string) => {
    setChatTicketId(tid);
    const t = tickets.find(x => x.id === tid);
    if (t?.unreadByUser) {
      markTicketReadByUser(tid).catch(console.warn);
      setTickets(prev => prev.map(x => x.id === tid ? { ...x, unreadByUser: false } : x));
    }
  };

  const handleSendChat = async () => {
    if (!user || !profile || !chatTicketId) return;
    const text = chatInputRef.current?.value.trim();
    if (!text) return;
    
    if (chatInputRef.current) chatInputRef.current.value = '';
    
    try {
      await sendTicketMessage(chatTicketId, {
        uid: user.uid,
        name: profile.name,
        role: 'user',
        avatar: profile.avatar || null,
        text
      });
    } catch (e) {
      toast('Помилка відправки', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !profile) return;
    const pass = deletePassRef.current?.value;
    if (!pass) return setEditError("Введіть пароль");
    setSaving(true);
    try {
      await deleteAccount(user, profile, pass);
      toast('Акаунт видалено', 'info');
      router.push('/login');
    } catch (e: any) {
      setSaving(false);
      setEditError(e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' ? 'Невірний пароль' : (e.message || 'Помилка'));
    }
  };

  const handleAvatarChange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;
    if (!file.type.startsWith('image/')) {
      toast('Недійсний файл', 'error');
      return;
    }
    
    setSaving(true);
    toast('Завантаження...', 'info');
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const maxSize = 256;
          let w = img.width, h = img.height;
          if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
          else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          const base64Url = canvas.toDataURL('image/jpeg', 0.85);
          
          await updateProfileData(user.uid, { avatar: base64Url });
          updateProfile?.({ avatar: base64Url });
          toast('Аватар оновлено!', 'success');
          setSaving(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast('Помилка: ' + err.message, 'error');
      setSaving(false);
    }
  };

  if (loading || user === undefined || !profile) {
    return (
      <div className="wrap">
        <div className="profile-hero">
          <div className="profile-hero-inner">
            <div className="skeleton-circle" style={{width:'100px',height:'100px',flexShrink:0}}></div>
            <div style={{flex:1}}>
              <div className="skeleton-line w-1-2" style={{marginBottom:'10px',height:'22px'}}></div>
              <div className="skeleton-line w-1-4" style={{height:'14px'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const memberSince = profile.createdAt && !isNaN(new Date(profile.createdAt).getTime())
      ? new Date(profile.createdAt).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' })
      : '—';

  return (
    <>
      <div className="wrap" style={{paddingBottom: '80px'}}>
        
        {/* Hero */}
      <div className="profile-hero">
        <div className="profile-hero-star">✦</div>
        <div className="profile-hero-inner">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-ring">
              <div className="avatar avatar-xl">
                {profile.avatar ? <img src={profile.avatar} alt=""/> : profile.name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <label className="profile-avatar-edit" title="Змінити аватар">
              <Icon name="camera" size={14}/>
              <input type="file" accept="image/jpeg, image/png" style={{display:'none'}} onChange={handleAvatarChange} />
            </label>
          </div>
          <div className="profile-hero-info">
            <div className="profile-hero-name">{profile.name}</div>
            <div className="profile-hero-meta">
              {profile.role === 'founder' && <span className="role-badge founder">Founder</span>}
              <span className="profile-id">{profile.uniqueId}</span>
            </div>
            <div className="profile-hero-login">
              <span className="phl-item"><Icon name="user" size={11}/> @{profile.login}</span>
              {profile.createdAt && <span className="phl-item date"><Icon name="calendar-blank" size={11}/> з {memberSince}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat-card">
          <div className="profile-stat-num">{stats?.totalInvites ?? '—'}</div>
          <div className="profile-stat-label">Запрошень</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-num" style={{background:'linear-gradient(135deg,#4a90d9,#6eb3f0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', filter:'drop-shadow(0 2px 6px rgba(74,144,217,.25))'}}>{stats?.totalFriends ?? '—'}</div>
          <div className="profile-stat-label">Друзів</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-num" style={{background:'linear-gradient(135deg,var(--green),#56c68a)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', filter:'drop-shadow(0 2px 6px rgba(45,122,79,.25))'}}>{stats?.acceptedCount ?? '—'}</div>
          <div className="profile-stat-label">Прийнято</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-num" style={{background:'linear-gradient(135deg,#a08878,#c4b0a0)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>{stats?.pendingCount ?? '—'}</div>
          <div className="profile-stat-label">Очікує</div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="profile-section">
        <div className="profile-section-header">
          <div className="profile-section-icon"><Icon name="user" size={16}/></div>
          <div className="profile-section-title">Особисті дані</div>
        </div>
        <div className="profile-section-content">
          <div className="profile-field">
            <div>
              <div className="profile-field-label">Ім'я</div>
              <div className="profile-field-value">{profile.name}</div>
            </div>
            <button className="btn-outline btn-sm" onClick={() => setEditMode('name')}>Змінити</button>
          </div>
          <div className="profile-field">
            <div>
              <div className="profile-field-label">Логін</div>
              <div className="profile-field-value">@{profile.login}</div>
            </div>
            <button className="btn-outline btn-sm" onClick={() => setEditMode('login')}>Змінити</button>
          </div>
          <div className="profile-field">
            <div>
              <div className="profile-field-label">Унікальний ID</div>
              <div className="profile-field-value" style={{fontFamily:'monospace', fontSize:'.88rem'}}>{profile.uniqueId}</div>
            </div>
            <button className="btn-outline btn-sm" onClick={handleCopyId}>Копіювати</button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="profile-section">
        <div className="profile-section-header">
          <div className="profile-section-icon"><Icon name="shield-check" size={16}/></div>
          <div className="profile-section-title">Безпека</div>
        </div>
        <div className="profile-section-content">
          <div className="profile-field">
            <div>
              <div className="profile-field-label">Пароль</div>
              <div className="profile-field-value" style={{letterSpacing:'.15em', fontSize:'1.1rem'}}>••••••••</div>
            </div>
            <button className="btn-outline btn-sm" onClick={() => setEditMode('password')}>Змінити</button>
          </div>
          <div className="profile-field">
            <div>
              <div className="profile-field-label">Двофакторна автентифікація (2FA)</div>
              <div className="profile-field-value" style={{fontSize:'.93rem', fontWeight:600}}>
                {profile.twoFactorEnabled 
                  ? `Увімкнено (${profile.email || 'пошта не вказана'})` 
                  : 'Вимкнено'}
              </div>
            </div>
            {profile.twoFactorEnabled ? (
              <button className="btn-outline btn-sm" style={{color:'var(--red)', borderColor:'rgba(192,57,43,.3)'}} onClick={() => setEditMode('disable2fa')}>
                Вимкнути
              </button>
            ) : (
              <button className="btn-outline btn-sm" onClick={() => setEditMode('email')}>
                Налаштувати
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Support & Ideas */}
      <div className="profile-section">
        <div className="profile-section-header">
          <div className="profile-section-icon"><Icon name="lifebuoy" size={16}/></div>
          <div className="profile-section-title">Допомога та підтримка</div>
        </div>
        <div className="support-action-grid">
          <button className="support-action-btn" onClick={() => { setTicketType('bug'); setNewTicketOpen(true); }}>
            <span className="sa-icon">🐛</span>Знайшов баг
          </button>
          <button className="support-action-btn" onClick={() => { setTicketType('idea'); setNewTicketOpen(true); }}>
            <span className="sa-icon">💡</span>Є ідея
          </button>
          <button className="support-action-btn" onClick={() => { setTicketType('question'); setNewTicketOpen(true); }}>
            <span className="sa-icon">❓</span>Питання
          </button>
        </div>

        {tickets.length > 0 && (
          <>
            <div className="my-tickets-header">
              <span>Мої звернення</span>
              <span style={{fontSize:'.7rem', fontWeight:500}}>{tickets.length}</span>
            </div>
            {tickets.map(t => (
              <div key={t.id} className="ticket-item" onClick={() => openChat(t.id)}>
                <div className={`ticket-item-icon ${t.type || 'other'}`}>
                  {t.type === 'bug' ? '🐛' : t.type === 'idea' ? '💡' : t.type === 'question' ? '❓' : '💬'}
                </div>
                <div className="ticket-item-body">
                  <div className="ticket-item-subject">{t.subject || t.type}</div>
                  <div className="ticket-item-preview">{(t.lastMessageText || '').slice(0, 50)}</div>
                </div>
                <div className="ticket-item-meta">
                  <span className={`ticket-status ${t.status || 'open'}`}>
                    {t.status === 'resolved' ? 'Вирішено' : t.status === 'dismissed' ? 'Закрито' : 'Відкрито'}
                  </span>
                  {t.unreadByUser && <div className="ticket-unread-dot"></div>}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Donation Block */}
      <div className="donation-block">
        <div className="donation-header">
          <div className="donation-header-icon">✦</div>
          <div className="donation-header-title">Підтримати проєкт</div>
        </div>
        <div className="donation-body">
          <div className="donation-text">
            Запрошення ✦ — це безкоштовний незалежний проєкт. Якщо він приносить вам радість — ви можете підтримати його розвиток.
          </div>
          <a href="https://send.monobank.ua/jar/5se11GGQ5i" target="_blank" rel="noreferrer" className="donation-btn">
            <Icon name="heart" size={18}/> Підтримати через Monobank
          </a>
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
          <button className="btn btn-red btn-sm" onClick={() => { setEditError(''); setDeleteModalOpen(true); }}>
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

      {/* ─── MODALS ─── */}
      
      {/* Edit Modal */}
      {editMode && (
        <div className="overlay" onClick={closeEditModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px'}}>
              <h3 className="modal-title" style={{marginBottom:0}}>
                {editMode === 'name' ? "Змінити ім'я" : editMode === 'login' ? "Змінити логін" : editMode === 'password' ? "Змінити пароль" : editMode === 'email' ? "Налаштувати 2FA" : "Вимкнути 2FA"}
              </h3>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>
            
            {editMode === 'name' && (
              <div className="form-group">
                <label className="lbl">Нове ім'я</label>
                <input ref={nameRef} defaultValue={profile.name} placeholder="Ваше ім'я" maxLength={15} />
              </div>
            )}
            {editMode === 'login' && (
              <>
                <div className="form-group">
                  <label className="lbl">Новий логін</label>
                  <input 
                    ref={loginRef} 
                    defaultValue={profile.login} 
                    placeholder="Логін (латиниця та цифри)" 
                    maxLength={10}
                    onChange={e => {
                      if (e.target.value) {
                        e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                      }
                    }}
                  />
                </div>
                <p style={{fontSize:'.8rem', color:'var(--muted)', marginBottom:'12px'}}>
                  <Icon name="warning" size={14}/> Після зміни логіну потрібно буде входити з новим логіном
                </p>
              </>
            )}
            {editMode === 'password' && (
              <>
                <div className="form-group">
                  <label className="lbl">Поточний пароль</label>
                  <input ref={oldPassRef} type="password" placeholder="Ваш поточний пароль" />
                </div>
                <div className="form-group">
                  <label className="lbl">Новий пароль</label>
                  <input ref={newPassRef} type="password" placeholder="Мінімум 6 символів" />
                </div>
                <div className="form-group">
                  <label className="lbl">Підтвердити новий пароль</label>
                  <input ref={newPass2Ref} type="password" placeholder="Повторіть новий пароль" />
                </div>
              </>
            )}
            {editMode === 'email' && (
              <>
                {!showEmailSent ? (
                  <div className="form-group">
                    <label className="lbl">Електронна пошта для 2FA</label>
                    <input 
                      type="email" 
                      placeholder="example@domain.com" 
                      value={targetEmail} 
                      onChange={e => setTargetEmail(e.target.value)} 
                    />
                    <p style={{fontSize:'.75rem', color:'var(--muted)', marginTop:'8px'}}>
                      <Icon name="info" size={13}/> Ми надішлемо вам лист-підтвердження для перевірки та увімкнення двофакторної автентифікації.
                    </p>
                  </div>
                ) : (
                  <div style={{textAlign:'center', padding:'10px 0'}}>
                    <div style={{width:'48px', height:'48px', borderRadius:'50%', background:'rgba(var(--gold-rgb), 0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold)', margin:'0 auto 16px'}}>
                      <Icon name="envelope-simple" size={24}/>
                    </div>
                    <p style={{fontSize:'.88rem', color:'var(--muted)', lineHeight:1.6, marginBottom:'16px'}}>
                      Лист для підтвердження надіслано на <strong style={{color:'var(--ink)'}}>{targetEmail}</strong>. 
                      Будь ласка, перейдіть за посиланням у листі для завершення.
                    </p>
                    <button type="button" className="btn btn-outline btn-full btn-sm" onClick={handleResendVerification} style={{marginBottom:'8px'}}>
                      Надіслати лист ще раз
                    </button>
                  </div>
                )}
              </>
            )}
            {editMode === 'disable2fa' && (
              <div className="form-group">
                <label className="lbl">Введіть пароль для підтвердження</label>
                <input 
                  type="password" 
                  placeholder="Ваш поточний пароль" 
                  value={disablePass} 
                  onChange={e => setDisablePass(e.target.value)} 
                />
                <p style={{fontSize:'.78rem', color:'var(--muted)', marginTop:'8px'}}>
                  <Icon name="warning" size={13}/> Двофакторна автентифікація буде вимкнена.
                </p>
              </div>
            )}

            {editError && <div className="form-error show">{editError}</div>}
            <button className="btn btn-dark btn-full" disabled={saving} onClick={handleSaveEdit}>
              {saving ? 'Збереження...' : (editMode === 'email' && showEmailSent ? 'Я підтвердив(ла)' : 'Зберегти')}
            </button>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {newTicketOpen && (
        <div className="overlay" onClick={() => setNewTicketOpen(false)}>
          <div className="modal new-ticket-modal" onClick={e => e.stopPropagation()} style={{maxWidth:'480px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h3 className="modal-title" style={{marginBottom:0}}>Нове звернення</h3>
              <button className="modal-close" onClick={() => setNewTicketOpen(false)}>×</button>
            </div>
            <div className="ticket-type-grid">
              {[
                { v: 'bug', i: '🐛', l: 'Знайшов баг', d: 'Помилка у роботі' },
                { v: 'idea', i: '💡', l: 'Є ідея', d: 'Пропозиція' },
                { v: 'question', i: '❓', l: 'Питання', d: 'Потрібна відповідь' },
                { v: 'other', i: '💬', l: 'Інше', d: 'Загальне' },
              ].map(t => (
                <button key={t.v} className={`ticket-type-option ${ticketType === t.v ? 'selected' : ''}`} onClick={() => setTicketType(t.v)}>
                  <span className="tt-icon">{t.i}</span>
                  <span>{t.l}</span>
                  <span style={{fontSize:'.7rem', color:'var(--muted)', fontWeight:400}}>{t.d}</span>
                </button>
              ))}
            </div>
            <div className="form-group">
              <label className="lbl">Тема</label>
              <input ref={ticketSubjectRef} placeholder="Коротко опишіть проблему або ідею..." maxLength={100} />
            </div>
            <div className="form-group">
              <label className="lbl">Повідомлення</label>
              <textarea ref={ticketMsgRef} rows={5} maxLength={300} placeholder="Детально опишіть... (до 300 символів)" 
                style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--border)', background:'var(--input-bg, var(--paper))', color:'var(--ink)', resize:'vertical', fontFamily:'var(--font-body)', fontSize:'.88rem', lineHeight:1.5}}></textarea>
            </div>
            {editError && <div className="form-error show">{editError}</div>}
            <button className="btn btn-dark btn-full" disabled={saving} onClick={handleCreateTicket}>
              {saving ? 'Надсилання...' : <><Icon name="paper-plane-tilt" size={16}/> Надіслати</>}
            </button>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatTicketId && (
        <div className="support-chat-overlay" onClick={() => setChatTicketId(null)}>
          <div className="support-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="chat-modal-header">
              <button className="chat-modal-back" onClick={() => setChatTicketId(null)}>
                <Icon name="arrow-left" size={16}/>
              </button>
              <div className="chat-modal-info">
                <div className="chat-modal-title">
                  {chatTicket?.type === 'bug' ? '🐛' : chatTicket?.type === 'idea' ? '💡' : chatTicket?.type === 'question' ? '❓' : '💬'} 
                  {' · '}
                  {chatTicket?.subject || 'Звернення'}
                </div>
                <div className="chat-modal-subtitle">
                  {chatTicket?.status === 'resolved' ? 'Вирішено' : chatTicket?.status === 'dismissed' ? 'Закрито' : 'Відкрито'}
                </div>
              </div>
              <button className="chat-modal-close" onClick={() => setChatTicketId(null)}>×</button>
            </div>
            
            <div className="chat-messages-area">
              {chatMessages.length === 0 ? (
                <div className="chat-loading-spinner"><Icon name="circle-notch" size={24}/></div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isUser = msg.role === 'user';
                  const time = new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={msg.id || i} className={`chat-msg ${isUser ? 'user' : 'support'}`}>
                      <div className="chat-msg-avatar">
                        {isUser ? (
                          profile.avatar ? <img src={profile.avatar} alt=""/> : (msg.name || '?').charAt(0).toUpperCase()
                        ) : (
                          <Icon name="headset" size={16}/>
                        )}
                      </div>
                      <div className="chat-msg-content">
                        {msg.text && <div className="chat-bubble">{msg.text}</div>}
                        <div className="chat-msg-time">{!isUser && 'Підтримка · '} {time}</div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div id="chat-input-container">
              {chatTicket?.status === 'resolved' || chatTicket?.status === 'dismissed' ? (
                <div className="chat-resolved-banner">
                  <div className="chat-resolved-text"><Icon name="check-circle" size={16}/> Звернення закрито</div>
                </div>
              ) : (
                <div className="chat-input-area">
                  <div className="chat-input-row">
                    <textarea 
                      ref={chatInputRef}
                      className="chat-text-input" 
                      maxLength={300}
                      placeholder="Написати повідомлення..."
                      rows={1}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                    />
                    <button className="chat-send-btn" onClick={handleSendChat}>
                      <Icon name="paper-plane-tilt" size={18}/>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div className="overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{textAlign:'center', marginBottom:'20px'}}>
              <div style={{width:'56px', height:'56px', borderRadius:'50%', background:'var(--red-bg)', border:'2px solid rgba(192,57,43,.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:'1.4rem', color:'var(--red)'}}>
                <Icon name="trash" size={24}/>
              </div>
              <h3 className="modal-title" style={{color:'var(--red)', marginBottom:0}}>Видалити акаунт?</h3>
            </div>
            <p style={{color:'var(--muted)', fontSize:'.9rem', marginBottom:'20px', textAlign:'center', lineHeight:1.6}}>
              Ця дія незворотня. Всі ваші дані, запрошення та друзі будуть видалені назавжди.
            </p>
            <div className="form-group">
              <label className="lbl">Введіть пароль для підтвердження</label>
              <input ref={deletePassRef} type="password" placeholder="Ваш пароль"/>
            </div>
            {editError && <div className="form-error show">{editError}</div>}
            <div style={{display:'flex', gap:'10px'}}>
              <button className="btn btn-red btn-full" disabled={saving} onClick={handleDeleteAccount}>
                {saving ? '...' : 'Так, видалити'}
              </button>
              <button className="btn btn-outline btn-full" disabled={saving} onClick={() => setDeleteModalOpen(false)}>Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
