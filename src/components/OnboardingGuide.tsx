'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/Icon';

/* ── Types ── */
interface OnboardingGuideProps {
  userName: string;
  onComplete: () => void;
}

/* ══════════════════════════════════════════
   Mock Topbar Navbar (Unified & Authentic)
════════════════════════════════════════════ */
interface MockTopbarProps {
  activeTab: 'home' | 'create' | 'friends' | 'notifications';
  bellPulse?: boolean;
}

function MockTopbar({ activeTab, bellPulse }: MockTopbarProps) {
  return (
    <div className="ob-topbar">
      <span className="ob-topbar-logo">Запрошення ✦</span>
      <div className="ob-topbar-nav">
        <span className={`ob-nb ${activeTab === 'home' ? 'ob-nb-active' : ''}`}>
          <Icon name="house" size={13} /> Мої
        </span>
        <span className={`ob-nb ${activeTab === 'create' ? 'ob-nb-active' : ''}`}>
          <Icon name="plus" size={13} /> Нове
        </span>
        <span className={`ob-nb-icon ${activeTab === 'friends' ? 'ob-nb-active' : ''}`}>
          <Icon name="users" size={14} />
        </span>
        <span className={`ob-nb-icon ${activeTab === 'notifications' ? 'ob-nb-active' : ''}`} style={{ position: 'relative' }}>
          <Icon name="bell" size={14} />
          {bellPulse && <span className="ob-notif-badge ob-badge-pulse">1</span>}
        </span>
        <div className="ob-topbar-avatar">О</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 1 — Welcome
════════════════════════════════════════════ */
function WelcomeStep({ name }: { name: string }) {
  return (
    <div className="ob-welcome">
      <div className="ob-welcome-logo">✦</div>
      <h2 className="ob-welcome-title">
        Ласкаво просимо,<br />
        <span className="ob-welcome-name">{name}!</span>
      </h2>
      <p className="ob-welcome-desc">
        Запрошення ✦ — зручний спосіб організовувати зустрічі та надсилати запрошення друзям.
        Давайте разом познайомимося з основними функціями.
      </p>
      <div className="ob-welcome-features">
        {[
          { icon: 'house',           label: 'Мої запрошення' },
          { icon: 'plus',            label: 'Створення' },
          { icon: 'users',           label: 'Друзі' },
          { icon: 'bell',            label: 'Сповіщення' },
        ].map(f => (
          <div key={f.icon} className="ob-welcome-feature">
            <span className="ob-welcome-feature-icon-circle">
              <Icon name={f.icon} size={14} />
            </span>
            <span className="ob-welcome-feature-label">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 2 — Home (Мої запрошення)
════════════════════════════════════════════ */
function HomeStep() {
  const [statusIdx, setStatusIdx] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const statuses = ['pending', 'accepted', 'declined', 'reschedule'] as const;

  type StatusKey = typeof statuses[number];
  const statusMeta: Record<StatusKey, { label: string; icon: string; color: string }> = {
    pending:    { label: 'Очікує',   icon: 'hourglass-high',          color: 'var(--gold)' },
    accepted:   { label: 'Прийнято', icon: 'check',                   color: 'var(--green)' },
    declined:   { label: 'Відхилено',icon: 'x',                       color: 'var(--red)' },
    reschedule: { label: 'Перенос',  icon: 'clock-counter-clockwise', color: 'var(--gold)' },
  };

  const invites = [
    { emoji: '☕', name: 'Аня',   type: 'Кава',    date: '1 лип · 15:00',  si: 0 },
    { emoji: '🎉', name: 'Макс',  type: 'Вечірка', date: '5 лип · 20:00',  si: 1 },
    { emoji: '🍕', name: 'Олена', type: 'Вечеря',  date: '10 лип · 19:00', si: 2 },
  ];

  // Cycle statuses
  useEffect(() => {
    const t = setInterval(() => {
      setStatusIdx(i => (i + 1) % statuses.length);
    }, 1600);
    return () => clearInterval(t);
  }, []);

  // Automatic copy simulation loop
  useEffect(() => {
    let current = 0;
    const cycleCopy = () => {
      setCopiedIdx(current);
      setTimeout(() => {
        setCopiedIdx(null);
      }, 1000);

      current = (current + 1) % 4; // Cycles with a pause
    };

    const t = setInterval(cycleCopy, 2000);
    cycleCopy();

    return () => clearInterval(t);
  }, []);

  return (
    <div className="ob-screen">
      <MockTopbar activeTab="home" />

      <div className="ob-wrap">
        {/* Header */}
        <div className="ob-home-header">
          <h2 className="ob-home-title">Мої запрошення</h2>
          <div className="ob-btn-create-fab">
            <Icon name="plus" size={14} /> Нове
          </div>
        </div>

        {/* Stats chips */}
        <div className="ob-stats-row">
          {[
            { label: 'Всі',      num: 3, cls: 'ob-stat-active' },
            { label: 'Очікують', num: 1, cls: 'stat-pending' },
            { label: 'Прийняті', num: 1, cls: 'stat-accepted' },
            { label: 'Відхилені',num: 1, cls: 'stat-declined' },
          ].map(s => (
            <div key={s.label} className={`ob-stat-chip ${s.cls}`}>
              <span className="ob-stat-num">{s.num}</span>
              <span className="ob-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="ob-home-tabs">
          <div className="ob-home-tab ob-home-tab-active">
            <Icon name="paper-plane-tilt" size={14} /> Відправлені
          </div>
          <div className="ob-home-tab">
            <Icon name="users" size={14} /> Від друзів
          </div>
        </div>

        {/* Invite cards */}
        {invites.map((inv, i) => {
          const st = statuses[(statusIdx + i) % statuses.length];
          const sm = statusMeta[st];
          const isCopied = copiedIdx === i;
          return (
            <div key={i} className={`ob-inv-card ob-status-${st}`} style={{ animationDelay: `${i * 60}ms` }}>
              <div className="ob-inv-emoji">{inv.emoji}</div>
              <div className="ob-inv-body">
                <div className="ob-inv-title">{inv.name}</div>
                <div className="ob-inv-meta">
                  <span className="ob-inv-meta-type">{inv.type}</span>
                  <span className="ob-inv-meta-date">
                    <Icon name="calendar-blank" size={12} />
                    {inv.date}
                  </span>
                </div>
              </div>
              <div className="ob-inv-right">
                <span className="ob-badge" style={{ color: sm.color, borderColor: sm.color, background: `${sm.color}18` }}>
                  <Icon name={sm.icon} size={10} />
                  {sm.label}
                </span>
                <button
                  className={`ob-copy-btn ${isCopied ? 'ob-copy-ok' : ''}`}
                  style={{ pointerEvents: 'none' }}
                  tabIndex={-1}
                >
                  <Icon name={isCopied ? 'check' : 'link'} size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 3 — Create (With Auto-Scrolling)
════════════════════════════════════════════ */
const EVENT_TYPES = [
  { v: 'coffee', e: '☕', l: 'Кава' },
  { v: 'party',  e: '🎉', l: 'Вечірка' },
  { v: 'dinner', e: '🍕', l: 'Вечеря' },
  { v: 'date',   e: '💑', l: 'Побачення' },
];

const MOCK_FRIENDS = [
  { uid: 'f1', name: 'Андрій', uniqueId: 'ZAP-4721', letter: 'А' },
  { uid: 'f2', name: 'Катя',   uniqueId: 'ZAP-1984', letter: 'К' },
  { uid: 'f3', name: 'Богдан', uniqueId: 'ZAP-3329', letter: 'Б' },
];

function CreateStep() {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [typedTo, setTypedTo] = useState('');
  const [typedMsg, setTypedMsg] = useState('');
  const [typedDate, setTypedDate] = useState('');
  const [typedTime, setTypedTime] = useState('');
  const [typedPlace, setTypedPlace] = useState('');
  const [selectedFriendUid, setSelectedFriendUid] = useState<string | null>(null);
  const [typeIdx, setTypeIdx] = useState(0);

  // Refs for auto-scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recipientSectionRef = useRef<HTMLDivElement>(null);
  const messageSectionRef = useRef<HTMLDivElement>(null);
  const typeSectionRef = useRef<HTMLDivElement>(null);
  const detailsSectionRef = useRef<HTMLDivElement>(null);
  const submitSectionRef = useRef<HTMLDivElement>(null);

  // Cycle selected event type
  useEffect(() => {
    const t = setInterval(() => setTypeIdx(i => (i + 1) % EVENT_TYPES.length), 1800);
    return () => clearInterval(t);
  }, []);

  // Main animation timeline
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    if (animationPhase === 0) {
      setTypedTo('');
      setTypedMsg('');
      setTypedDate('');
      setTypedTime('');
      setTypedPlace('');
      setSelectedFriendUid(null);

      t1 = setTimeout(() => {
        setAnimationPhase(1);
      }, 800);
    } else if (animationPhase === 1) {
      // Choose "Андрій"
      setSelectedFriendUid('f1');
      setTypedTo('Андрій');

      t1 = setTimeout(() => {
        setAnimationPhase(2);
      }, 1000);
    } else if (animationPhase === 2) {
      // Type Message
      const target = 'Кава разом ☕';
      let char = 0;
      const interval = setInterval(() => {
        if (char < target.length) {
          setTypedMsg(target.slice(0, char + 1));
          char++;
        } else {
          clearInterval(interval);
          t2 = setTimeout(() => setAnimationPhase(3), 500);
        }
      }, 60);
      return () => {
        clearInterval(interval);
        clearTimeout(t2);
      };
    } else if (animationPhase === 3) {
      // Type Date
      const target = '12.07.2025';
      let char = 0;
      const interval = setInterval(() => {
        if (char < target.length) {
          setTypedDate(target.slice(0, char + 1));
          char++;
        } else {
          clearInterval(interval);
          t2 = setTimeout(() => setAnimationPhase(4), 400);
        }
      }, 60);
      return () => {
        clearInterval(interval);
        clearTimeout(t2);
      };
    } else if (animationPhase === 4) {
      // Type Time
      const target = '18:30';
      let char = 0;
      const interval = setInterval(() => {
        if (char < target.length) {
          setTypedTime(target.slice(0, char + 1));
          char++;
        } else {
          clearInterval(interval);
          t2 = setTimeout(() => setAnimationPhase(5), 400);
        }
      }, 60);
      return () => {
        clearInterval(interval);
        clearTimeout(t2);
      };
    } else if (animationPhase === 5) {
      // Type Place
      const target = 'Синій птах';
      let char = 0;
      const interval = setInterval(() => {
        if (char < target.length) {
          setTypedPlace(target.slice(0, char + 1));
          char++;
        } else {
          clearInterval(interval);
          t2 = setTimeout(() => setAnimationPhase(6), 650);
        }
      }, 60);
      return () => {
        clearInterval(interval);
        clearTimeout(t2);
      };
    } else if (animationPhase === 6) {
      t1 = setTimeout(() => {
        setAnimationPhase(0);
      }, 2500);
    }

    return () => clearTimeout(t1);
  }, [animationPhase]);

  // Smooth scroll logic based on active animation phase
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let targetElement: HTMLDivElement | null = null;

    switch (animationPhase) {
      case 0:
      case 1:
        targetElement = recipientSectionRef.current;
        break;
      case 2:
        targetElement = messageSectionRef.current;
        break;
      case 3:
      case 4:
      case 5:
        targetElement = detailsSectionRef.current;
        break;
      case 6:
        targetElement = submitSectionRef.current;
        break;
    }

    if (targetElement) {
      const top = targetElement.offsetTop - container.offsetTop - 8;
      container.scrollTo({ top, behavior: 'smooth' });
    }
  }, [animationPhase]);

  return (
    <div className="ob-screen">
      <MockTopbar activeTab="create" />

      {/* Programmatic scroll locked container (overflowY: hidden) */}
      <div className="ob-wrap" ref={scrollContainerRef} style={{ overflowY: 'hidden' }}>
        <div className="ob-create-header">
          <h2 className="ob-create-title">Нове запрошення</h2>
          <p className="ob-create-subtitle">Заповніть деталі — посилання буде готове миттєво</p>
        </div>

        {/* Mode tabs */}
        <div className="ob-mode-tabs">
          <div className="ob-mode-tab ob-mode-tab-active">
            <Icon name="user" size={14} /> Персональне
          </div>
          <div className="ob-mode-tab">
            <Icon name="users" size={14} /> Групове
          </div>
        </div>

        {/* 1. Отримувач Section */}
        <div className="ob-form-section" ref={recipientSectionRef}>
          <div className="ob-form-section-header">
            <div className="ob-form-section-icon"><Icon name="user" size={13} /></div>
            <span className="ob-form-section-label">Отримувач</span>
          </div>
          <div className="ob-form-section-body">
            <div className="ob-field">
              <label className="ob-field-label">Кому</label>
              <div className={`ob-input-mock ${animationPhase === 1 ? 'ob-input-active' : ''}`}>
                <span>{typedTo || <span className="ob-input-placeholder">Ім'я отримувача</span>}</span>
                {animationPhase === 1 && <span className="ob-cursor">|</span>}
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <label className="ob-field-label" style={{ marginBottom: '6px', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.78rem' }}>
                Або обрати з друзів
              </label>
              <div className="ob-friends-grid">
                {MOCK_FRIENDS.map(f => {
                  const isSelected = selectedFriendUid === f.uid;
                  return (
                    <div
                      key={f.uid}
                      className={`ob-friend-chip ${isSelected ? 'ob-friend-chip-on' : ''}`}
                    >
                      <div className="ob-avatar ob-avatar-sm" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                        {f.letter}
                      </div>
                      <div className="ob-friend-chip-info">
                        <span className="ob-friend-chip-name">{f.name}</span>
                        <span className="ob-friend-chip-id">{f.uniqueId}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Повідомлення Section */}
        <div className="ob-form-section" ref={messageSectionRef}>
          <div className="ob-form-section-header">
            <div className="ob-form-section-icon"><Icon name="chat-circle-dots" size={13} /></div>
            <span className="ob-form-section-label">Повідомлення</span>
          </div>
          <div className="ob-form-section-body">
            <div className={`ob-input-mock ob-textarea-mock ${animationPhase === 2 ? 'ob-input-active' : ''}`}>
              <span>{typedMsg || <span className="ob-input-placeholder">Напишіть своїми словами...</span>}</span>
              {animationPhase === 2 && <span className="ob-cursor">|</span>}
            </div>
          </div>
        </div>

        {/* 3. Тип події Section */}
        <div className="ob-form-section" ref={typeSectionRef}>
          <div className="ob-form-section-header">
            <div className="ob-form-section-icon"><Icon name="sparkle" size={13} /></div>
            <span className="ob-form-section-label">Тип події</span>
          </div>
          <div className="ob-form-section-body">
            <div className="ob-type-picker">
              {EVENT_TYPES.map((t, ti) => (
                <div key={t.v} className={`ob-type-option ${ti === typeIdx ? 'ob-selected' : ''}`}>
                  <span className="ob-type-emoji">{t.e}</span>
                  <span>{t.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Коли та де Section */}
        <div className="ob-form-section" ref={detailsSectionRef}>
          <div className="ob-form-section-header">
            <div className="ob-form-section-icon"><Icon name="calendar-blank" size={13} /></div>
            <span className="ob-form-section-label">Коли та де</span>
          </div>
          <div className="ob-form-section-body">
            <div className="ob-datetime-row">
              <div className="ob-field">
                <label className="ob-field-label">Дата</label>
                <div className={`ob-input-mock ${animationPhase === 3 ? 'ob-input-active' : ''}`}>
                  <span>{typedDate || <span className="ob-input-placeholder">дд.мм.рррр</span>}</span>
                  {animationPhase === 3 && <span className="ob-cursor">|</span>}
                </div>
              </div>
              <div className="ob-field">
                <label className="ob-field-label">Час</label>
                <div className={`ob-input-mock ${animationPhase === 4 ? 'ob-input-active' : ''}`}>
                  <span>{typedTime || <span className="ob-input-placeholder">гг:хх</span>}</span>
                  {animationPhase === 4 && <span className="ob-cursor">|</span>}
                </div>
              </div>
            </div>

            <div className="ob-field" style={{ marginTop: '8px' }}>
              <label className="ob-field-label">Місце</label>
              <div className={`ob-input-mock ${animationPhase === 5 ? 'ob-input-active' : ''}`}>
                <span>{typedPlace || <span className="ob-input-placeholder">Де зустрічаємось?</span>}</span>
                {animationPhase === 5 && <span className="ob-cursor">|</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className={`ob-create-submit ${animationPhase === 6 ? 'ob-submit-pulse' : ''}`} ref={submitSectionRef} style={{ marginBottom: '24px' }}>
          {animationPhase === 6
            ? <><Icon name="confetti" size={16} /> Запрошення створено!</>
            : <><Icon name="paper-plane-tilt" size={15} /> Надіслати запрошення</>
          }
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 4 — Friends
════════════════════════════════════════════ */
function FriendsStep() {
  const [phase, setPhase] = useState<'empty' | 'typing' | 'found' | 'added'>('empty');
  const [searchText, setSearchText] = useState('');
  const TARGET = '@andriy_k';
  const friends = [
    { name: 'Катя',   online: true,  letter: 'К' },
    { name: 'Богдан', online: false, letter: 'Б', ago: '5 хв тому' },
  ];

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === 'empty') {
      t = setTimeout(() => setPhase('typing'), 700);
    } else if (phase === 'typing') {
      if (searchText.length < TARGET.length) {
        t = setTimeout(() => setSearchText(TARGET.slice(0, searchText.length + 1)), 90);
      } else {
        t = setTimeout(() => setPhase('found'), 450);
      }
    } else if (phase === 'found') {
      t = setTimeout(() => setPhase('added'), 1400);
    } else {
      t = setTimeout(() => { setPhase('empty'); setSearchText(''); }, 1800);
    }
    return () => clearTimeout(t);
  }, [phase, searchText]);

  return (
    <div className="ob-screen">
      <MockTopbar activeTab="friends" />

      <div className="ob-wrap">
        <div className="ob-page-header">
          <h2 className="ob-page-title">Друзі</h2>
          <p className="ob-page-subtitle">Додавайте друзів та надсилайте запрошення напряму</p>
        </div>

        {/* Search */}
        <div className="ob-friends-search">
          <div className="ob-search-input-wrap">
            <span className="ob-search-icon"><Icon name="magnifying-glass" size={16} /></span>
            <div className="ob-search-input-mock">
              {searchText || <span className="ob-input-placeholder">ID (ZAP-XXXX) або @логін</span>}
              {phase === 'typing' && <span className="ob-cursor">|</span>}
            </div>
          </div>
          <div className="ob-btn-find">Знайти</div>
        </div>

        {/* Result */}
        {phase === 'found' && (
          <div className="ob-search-result ob-anim-pop">
            <div className="ob-avatar">А</div>
            <div style={{ flex: 1 }}>
              <div className="ob-result-name">Андрій Коваль</div>
              <div className="ob-result-id">@andriy_k · ZAP-4721</div>
            </div>
            <div className="ob-btn-add"><Icon name="user-plus" size={14} /> Додати</div>
          </div>
        )}
        {phase === 'added' && (
          <div className="ob-search-result ob-result-added ob-anim-pop">
            <Icon name="check-circle" size={18} />
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>Запит надіслано!</span>
          </div>
        )}

        {/* Tabs */}
        <div className="ob-mode-tabs" style={{ marginTop: '14px' }}>
          <div className="ob-mode-tab ob-mode-tab-active">
            <Icon name="users" size={13} /> Друзі <span className="ob-tab-count">{friends.length}</span>
          </div>
          <div className="ob-mode-tab">
            <Icon name="hand-waving" size={13} /> Запити
          </div>
          <div className="ob-mode-tab">
            <Icon name="paper-plane-tilt" size={13} /> Запрошення
          </div>
        </div>

        {/* Friends list */}
        <div className="ob-friend-list">
          {friends.map((f, i) => (
            <div key={i} className="ob-friend-row">
              <div style={{ position: 'relative' }}>
                <div className="ob-avatar ob-avatar-sm">{f.letter}</div>
                {f.online && <span className="ob-online-dot" />}
              </div>
              <div className="ob-friend-info">
                <div className="ob-friend-name">{f.name}</div>
                <div className={`ob-friend-status ${f.online ? 'ob-friend-online' : ''}`}>
                  {f.online ? 'В мережі' : f.ago}
                </div>
              </div>
              <button className="ob-friend-menu-btn">
                <Icon name="dots-three-vertical" size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   STEP 5 — Notifications
════════════════════════════════════════════ */
function NotificationsStep() {
  const [notifState, setNotifState] = useState<'idle' | 'arriving' | 'accepted'>('idle');
  const [bellPulse, setBellPulse] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setNotifState('idle');
      setBellPulse(false);
      setTimeout(() => setBellPulse(true), 600);
      setTimeout(() => setNotifState('arriving'), 900);
      setTimeout(() => setNotifState('accepted'), 2500);
      setTimeout(cycle, 4500);
    };
    const t = setTimeout(cycle, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="ob-screen">
      <MockTopbar activeTab="notifications" bellPulse={bellPulse} />

      <div className="ob-wrap">
        <div className="ob-page-header">
          <h2 className="ob-page-title">Сповіщення</h2>
          <p className="ob-page-subtitle">Всі події в одному місці</p>
        </div>

        <div className="ob-notif-group-label">СЬОГОДНІ</div>

        {/* Incoming invite notif */}
        {(notifState === 'arriving' || notifState === 'accepted') && (
          <div className={`ob-notif-item ob-notif-unread ${notifState === 'arriving' ? 'ob-anim-slide-in' : ''} ${notifState === 'accepted' ? 'ob-notif-processed' : ''}`}>
            <div className="ob-notif-icon-wrap ob-notif-type-invite">
              <Icon name="paper-plane-tilt" size={18} />
            </div>
            <div className="ob-notif-body">
              <div className="ob-notif-title">Нове запрошення від Олени!</div>
              <div className="ob-notif-text">Кава · 15 лип о 14:00 · Парк Шевченка</div>
              {notifState === 'accepted' && (
                <div className="ob-status-text ob-anim-fade-in">
                  <Icon name="check" size={13} /> Прийнято
                </div>
              )}
              <div className="ob-notif-time">
                <Icon name="clock" size={11} /> щойно
              </div>
            </div>
            {notifState !== 'accepted' && <div className="ob-notif-unread-dot" />}
          </div>
        )}

        {/* Static older notifs */}
        <div className="ob-notif-item">
          <div className="ob-notif-icon-wrap ob-notif-type-friend">
            <Icon name="check-circle" size={18} />
          </div>
          <div className="ob-notif-body">
            <div className="ob-notif-title">Богдан прийняв запрошення</div>
            <div className="ob-notif-text">Вечірка · 5 лип о 20:00</div>
            <div className="ob-notif-time"><Icon name="clock" size={11} /> 2 год тому</div>
          </div>
        </div>

        <div className="ob-notif-group-label" style={{ marginTop: 14 }}>ВЧОРА</div>

        <div className="ob-notif-item">
          <div className="ob-notif-icon-wrap ob-notif-type-request">
            <Icon name="hand-waving" size={18} />
          </div>
          <div className="ob-notif-body">
            <div className="ob-notif-title">Катя хоче додати вас у друзі</div>
            <div className="ob-notif-text">Запит на дружбу</div>
            <div className="ob-notif-time"><Icon name="clock" size={11} /> вчора</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main — OnboardingGuide
════════════════════════════════════════════ */
const STEPS: { id: string; label: string; comp?: () => React.ReactElement }[] = [
  { id: 'welcome',       label: 'Вітання' },
  { id: 'home',          label: 'Мої запрошення', comp: HomeStep },
  { id: 'create',        label: 'Створення',       comp: CreateStep },
  { id: 'friends',       label: 'Друзі',           comp: FriendsStep },
  { id: 'notifications', label: 'Сповіщення',      comp: NotificationsStep },
];

export function OnboardingGuide({ userName, onComplete }: OnboardingGuideProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const isLast = step === STEPS.length - 1;

  // Lock background page scrolling completely on both PC and mobile
  useEffect(() => {
    const lockClass = 'ob-lock-scroll';
    document.documentElement.classList.add(lockClass);
    document.body.classList.add(lockClass);

    return () => {
      document.documentElement.classList.remove(lockClass);
      document.body.classList.remove(lockClass);
    };
  }, []);

  const goNext = () => {
    if (isLast) { onComplete(); return; }
    setExiting(true);
    setTimeout(() => { setStep(s => s + 1); setExiting(false); }, 220);
  };

  const goPrev = () => {
    if (step === 0) return;
    setExiting(true);
    setTimeout(() => { setStep(s => s - 1); setExiting(false); }, 220);
  };

  return (
    <div className="ob-overlay" onTouchMove={(e) => e.preventDefault()}>
      <div className="ob-modal">
        {/* Progress dots */}
        <div className="ob-progress">
          {STEPS.map((_, i) => (
            <div key={i} className={`ob-dot ${i === step ? 'ob-dot-active' : i < step ? 'ob-dot-done' : ''}`} />
          ))}
        </div>

        {/* Step label */}
        <div className="ob-step-label">
          <span className="ob-step-num">{step + 1} / {STEPS.length}</span>
          <span className="ob-step-name">{STEPS[step].label}</span>
        </div>

        {/* Content */}
        <div className={`ob-content ${exiting ? 'ob-content-exit' : 'ob-content-enter'}`}>
          {step === 0 ? (
            <WelcomeStep name={userName} />
          ) : (() => {
            const C = STEPS[step].comp;
            return C ? <C /> : null;
          })()}
        </div>

        {/* Navigation */}
        <div className="ob-nav">
          {step > 0
            ? <button className="ob-btn-back" onClick={goPrev}><Icon name="arrow-left" size={14} /> Назад</button>
            : <div />
          }
          <button className="ob-btn-next" onClick={goNext}>
            {isLast
              ? <><Icon name="confetti" size={16} /> Почати роботу</>
              : <>Далі <Icon name="arrow-right" size={14} /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
