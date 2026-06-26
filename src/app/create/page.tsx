'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFriends, createInvite, createGroupInvite } from '@/lib/firebase/db';
import { TYPES, genId, boom } from '@/lib/utils';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';
import Link from 'next/link';

export default function CreatePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [mode, setMode] = useState<'personal' | 'group'>('personal');
  const [isPublic, setIsPublic] = useState(true);
  const [requireAuth, setRequireAuth] = useState(false);
  const [showSender, setShowSender] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendFilter, setFriendFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [createdInv, setCreatedInv] = useState<any>(null);

  const [form, setForm] = useState({
    title: '',
    to: '',
    msg: '',
    type: TYPES[0].v,
    date: '',
    time: '',
    place: ''
  });

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push('/login');
      return;
    }
    getFriends(user.uid).then(f => {
      setFriends(f);
      setLoading(false);

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const toParam = params.get('to');
        const uidParam = params.get('uid');
        if (toParam) {
          setForm(prev => ({ ...prev, to: toParam }));
        }
        if (uidParam) {
          const exists = f.some(friend => friend.uid === uidParam);
          if (exists) {
            setSelectedFriends([uidParam]);
          }
        }
      }
    });
  }, [user, router]);

  const toggleFriend = (uid: string) => {
    if (mode === 'personal') {
      const friend = friends.find(f => f.uid === uid);
      if (selectedFriends.includes(uid)) {
        setSelectedFriends([]);
        setForm(prev => ({ ...prev, to: '' }));
      } else {
        setSelectedFriends([uid]);
        if (friend) {
          setForm(prev => ({ ...prev, to: friend.name || '' }));
        }
      }
    } else {
      setSelectedFriends(prev =>
        prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
      );
    }
  };

  const isFormValid = () => {
    if (mode === 'group') return form.title.trim().length > 0;
    return form.to.trim().length > 0 || selectedFriends.length > 0;
  };

  const handleSubmit = async () => {
    if (!isFormValid() || submitting) return;
    setSubmitting(true);
    try {
      const invId = genId();
      const payload: any = {
        id: invId,
        type: form.type,
        msg: form.msg,
        date: form.date,
        time: form.time,
        place: form.place,
        creatorUid: user?.uid || null,
        created: Date.now(),
        showSender: showSender,
      };

      if (mode === 'personal') {
        payload.to = form.to;
        payload.recipientUid = selectedFriends.length === 1 ? selectedFriends[0] : null;
        payload.requireAuth = requireAuth;
        await createInvite(payload);
      } else {
        payload.title = form.title;
        payload.isGroup = true;
        payload.isPublic = isPublic;
        payload.invitedUids = isPublic ? [] : selectedFriends;
        await createGroupInvite(payload);
      }

      setCreatedInv({ ...payload, sentToFriends: selectedFriends.length > 0 });
      setDone(true);
      boom();
    } catch (e) {
      console.error(e);
      toast('Помилка при створенні запрошення', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDone(false);
    setCreatedInv(null);
    setSelectedFriends([]);
    setForm({ title: '', to: '', msg: '', type: TYPES[0].v, date: '', time: '', place: '' });
  };

  // ── Skeleton loading ──
  if (loading || user === undefined) {
    return (
      <div className="wrap">
        <div className="create-header">
          <div className="skeleton-line" style={{width:'200px', height:'28px', marginBottom:'8px'}}></div>
          <div className="skeleton-line" style={{width:'300px', height:'14px'}}></div>
        </div>
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton-card" style={{marginBottom:'14px', animationDelay:`${i*80}ms`}}>
            <div className="skeleton-line" style={{width:'120px', height:'13px', marginBottom:'14px'}}></div>
            <div className="skeleton-line w-full" style={{height:'42px', borderRadius:'8px'}}></div>
          </div>
        ))}
        <div className="skeleton-btn" style={{width:'100%', height:'52px', marginTop:'8px'}}></div>
      </div>
    );
  }

  if (done && createdInv) {
    const link = typeof window !== 'undefined'
      ? `${window.location.origin}/${createdInv.isGroup ? 'g' : 'i'}/${createdInv.id}`
      : '';
    return (
      <div className="wrap">
        <div className="create-done">
          <div className="create-done-icon"><Icon name="confetti" size={36}/></div>
          <h2 className="create-done-title">Готово!</h2>
          <p className="create-done-desc">
            {createdInv.sentToFriends
              ? 'Запрошення надіслано друзям! Вони отримають сповіщення.'
              : 'Скопіюйте та поділіться цим посиланням:'}
          </p>

          {!createdInv.sentToFriends && (
            <div className="create-link-box">
              <div className="create-link-url">{link}</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  toast('Посилання скопійовано ✓', 'success', 2500);
                }}
                className="btn btn-dark btn-full"
                style={{fontSize:'.95rem'}}
              >
                <Icon name="link" size={15}/> Скопіювати посилання
              </button>
            </div>
          )}

          <div className="create-done-actions" style={{marginTop:'20px'}}>
            <button onClick={resetForm} className="btn btn-outline" style={{padding:'10px 24px'}}>
              <Icon name="plus" size={14}/> Ще одне
            </button>
            <Link href="/home" className="btn btn-dark" style={{padding:'10px 24px'}}>
              <Icon name="house" size={14}/> До списку
            </Link>
          </div>

          <div className="create-done-support">
            <div className="create-done-support-inner">
              <div className="create-done-support-icon">✦</div>
              <div className="create-done-support-title">Підтримати розвиток проєкту</div>
              <div className="create-done-support-text">
                Запрошення ✦ — безкоштовний і незалежний. Якщо він вам корисний — ви можете підтримати його розвиток.
              </div>
              <a href="https://send.monobank.ua/jar/5se11GGQ5i" target="_blank" rel="noreferrer" className="donation-btn">
                <Icon name="heart" size={16}/> Задонатити через Monobank
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredFriends = friends.filter(f =>
    (f.name || '').toLowerCase().includes(friendFilter.toLowerCase()) ||
    (f.uniqueId || '').toLowerCase().includes(friendFilter.toLowerCase())
  );

  return (
    <div className="wrap">
      <div className="create-header">
        <h1 className="create-title">Нове запрошення</h1>
        <p className="create-subtitle">Заповніть деталі — посилання буде готове миттєво</p>
      </div>

      <div className="mode-tabs">
        <button className={`mode-tab ${mode === 'personal' ? 'active' : ''}`} onClick={() => setMode('personal')}>
          <Icon name="user" size={17}/> Персональне
        </button>
        <button className={`mode-tab ${mode === 'group' ? 'active' : ''}`} onClick={() => setMode('group')}>
          <Icon name="users" size={17}/> Групове
        </button>
      </div>

      <div id="cform">
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon"><Icon name={mode === 'personal' ? 'user' : 'users'} size={14}/></div>
            <div className="form-section-label">{mode === 'personal' ? 'Отримувач' : 'Назва зустрічі'}</div>
          </div>
          <div className="form-section-body">
            {mode === 'group' ? (
              <div>
                <label className="lbl">Назва зустрічі</label>
                <input
                  placeholder="Наприклад: Вечірка на день народження"
                  value={form.title}
                  maxLength={40}
                  onChange={e => setForm({...form, title: e.target.value})}
                />
              </div>
            ) : (
              <div>
                <label className="lbl">Кому</label>
                <input
                  placeholder="Ім'я отримувача"
                  value={form.to}
                  maxLength={25}
                  onChange={e => {
                    const val = e.target.value;
                    setForm({...form, to: val});
                    if (selectedFriends.length === 1) {
                      const selFriend = friends.find(f => f.uid === selectedFriends[0]);
                      if (selFriend && selFriend.name !== val) {
                        setSelectedFriends([]);
                      }
                    }
                  }}
                />

                {friends.length > 0 && (
                  <div style={{marginTop:'12px'}}>
                    <label className="lbl" style={{marginBottom:'8px'}}>Або обрати з друзів</label>
                    <div className="friends-grid">
                      {filteredFriends.map(f => (
                        <button
                          key={f.uid}
                          type="button"
                          className={`friend-chip ${selectedFriends.includes(f.uid) ? 'on' : ''}`}
                          onClick={() => toggleFriend(f.uid)}
                          style={{width: '100px'}}
                        >
                          <div className="avatar avatar-md" style={{flexShrink:0}}>
                            {f.avatar ? <img src={f.avatar} alt=""/> : f.name?.charAt(0).toUpperCase()}
                          </div>
                           <div style={{display:'flex', flexDirection:'column', alignItems:'center', minWidth:0, textAlign:'center'}}>
                            <span className="friend-chip-name" style={{fontSize:'.9rem', fontWeight:500, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'80px'}}>{f.name}</span>
                            {f.uniqueId && <span className="friend-chip-id" style={{whiteSpace:'nowrap'}}>{f.uniqueId}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon"><Icon name="chat-circle-dots" size={14}/></div>
            <div className="form-section-label">Повідомлення</div>
          </div>
          <div className="form-section-body">
            <textarea
              placeholder="Напишіть своїми словами — що хочете, куди запрошуєте…"
              maxLength={100}
              value={form.msg}
              onChange={e => setForm({...form, msg: e.target.value})}
            />
            <div style={{textAlign:'right', fontSize:'.72rem', color:'var(--muted)', marginTop:'4px'}}>
              <span>{form.msg.length}</span>/100
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon"><Icon name="sparkle" size={14}/></div>
            <div className="form-section-label">Тип події</div>
          </div>
          <div className="form-section-body">
            <div className="type-picker">
              {TYPES.map(t => (
                <button
                  key={t.v}
                  type="button"
                  className={`type-option ${form.type === t.v ? 'selected' : ''}`}
                  onClick={() => setForm({...form, type: t.v})}
                >
                  <span className="type-option-emoji">{t.e}</span>
                  <span>{t.l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon"><Icon name="calendar-blank" size={14}/></div>
            <div className="form-section-label">Коли та де</div>
          </div>
          <div className="form-section-body">
            <div className="datetime-row">
              <div>
                <label className="lbl">Дата</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div>
                <label className="lbl">Час</label>
                <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
              </div>
            </div>
            <div style={{marginTop:'12px'}}>
              <label className="lbl">Місце</label>
              <input
                placeholder="Адреса, назва кафе, парк…"
                maxLength={60}
                value={form.place}
                onChange={e => setForm({...form, place: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon"><Icon name="shield" size={14}/></div>
            <div className="form-section-label">Налаштування доступу</div>
          </div>
          <div className="form-section-body" style={{paddingTop:'4px', paddingBottom:'4px'}}>
            {mode === 'group' && (
              <div className="toggle-row">
                <button className={`toggle ${isPublic ? 'on' : ''}`} onClick={() => { setIsPublic(!isPublic); if (isPublic) setSelectedFriends([]); }} role="switch" aria-checked={isPublic}></button>
                <div className="toggle-row-text">
                  <div className="toggle-row-label">
                    {isPublic ? <><Icon name="globe-hemisphere-west" size={13}/> Публічне</> : <><Icon name="lock" size={13}/> Приватне</>}
                  </div>
                  <div className="toggle-row-desc">
                    {isPublic ? 'Будь-хто може приєднатися за посиланням' : 'Тільки для обраних друзів'}
                  </div>
                </div>
              </div>
            )}

            {selectedFriends.length === 0 && (
              <div className="toggle-row">
                <button className={`toggle ${requireAuth ? 'on' : ''}`} onClick={() => setRequireAuth(!requireAuth)} role="switch" aria-checked={requireAuth}></button>
                <div className="toggle-row-text">
                  <div className="toggle-row-label">
                    {requireAuth ? <><Icon name="lock" size={13}/> Тільки для зареєстрованих</> : <><Icon name="globe-hemisphere-west" size={13}/> Для всіх</>}
                  </div>
                  <div className="toggle-row-desc">
                    {requireAuth ? 'Отримувач повинен увійти в акаунт' : 'Будь-хто може переглянути запрошення'}
                  </div>
                </div>
              </div>
            )}

            <div className="toggle-row">
              <button className={`toggle ${showSender !== false ? 'on' : ''}`} onClick={() => setShowSender(!showSender)} role="switch" aria-checked={showSender !== false}></button>
              <div className="toggle-row-text">
                <div className="toggle-row-label">
                  {showSender !== false ? <><Icon name="eye" size={13}/> Показувати від кого</> : <><Icon name="eye-slash" size={13}/> Анонімне запрошення</>}
                </div>
                <div className="toggle-row-desc">
                  {showSender !== false ? 'Отримувач бачитиме ваше ім\'я' : 'Відправник прихований'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {mode === 'group' && (!isPublic || selectedFriends.length > 0) && (
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon"><Icon name="users" size={14}/></div>
              <div className="form-section-label">Запросити друзів {selectedFriends.length > 0 && <span className="tab-count">{selectedFriends.length}</span>}</div>
            </div>
            <div className="form-section-body">
              {friends.length === 0 ? (
                <p style={{fontSize:'.88rem', color:'var(--muted)', fontStyle:'italic'}}>
                  У вас ще немає друзів. <Link href="/friends" className="btn-ghost" style={{display:'inline-block'}}>Додати →</Link>
                </p>
              ) : (
                <>
                  {friends.length > 4 && (
                    <input type="text" placeholder="Пошук друга..." value={friendFilter} onChange={e => setFriendFilter(e.target.value)} style={{marginBottom:'10px'}}/>
                  )}
                  <div className="friends-grid">
                    {filteredFriends.length === 0 ? (
                      <p style={{fontSize:'.85rem', color:'var(--muted)', fontStyle:'italic'}}>Нікого не знайдено</p>
                    ) : filteredFriends.map(f => (
                      <button
                        key={f.uid}
                        type="button"
                        className={`friend-chip ${selectedFriends.includes(f.uid) ? 'on' : ''}`}
                        onClick={() => toggleFriend(f.uid)}
                        style={{width: '100px'}}
                      >
                        <div className="avatar avatar-md" style={{flexShrink:0}}>
                          {f.avatar ? <img src={f.avatar} alt=""/> : f.name?.charAt(0).toUpperCase()}
                        </div>
                         <div style={{display:'flex', flexDirection:'column', alignItems:'center', minWidth:0, textAlign:'center'}}>
                          <span className="friend-chip-name" style={{fontSize:'.9rem', fontWeight:500, color:'var(--ink)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'80px'}}>{f.name}</span>
                          {f.uniqueId && <span className="friend-chip-id" style={{whiteSpace:'nowrap'}}>{f.uniqueId}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="create-submit-wrap">
          <button
            className="btn btn-dark btn-full"
            disabled={!isFormValid() || submitting}
            onClick={handleSubmit}
            style={{marginTop:'4px', fontSize:'1rem', padding:'15px 24px'}}
          >
            <Icon name="paper-plane-tilt" size={18}/>{' '}
            {submitting ? 'Створення...' : 'Створити запрошення'}
          </button>
        </div>
      </div>
    </div>
  );
}
