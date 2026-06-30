'use client';
import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/Icon';

/* ── Types ── */
interface OnboardingGuideProps {
  userName: string;
  onComplete: () => void;
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
          { icon: 'plus-circle',     label: 'Створення' },
          { icon: 'users',           label: 'Друзі' },
          { icon: 'bell',            label: 'Сповіщення' },
        ].map(f => (
          <div key={f.icon} className="ob-welcome-feature">
            <span className="ob-welcome-feature-icon">
              <Icon name={f.icon} size={18} />
            </span>
            <span>{f.label}</span>
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

  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setStatusIdx(i => (i + 1) % statuses.length);
    }, 1400);
    return () => clearInterval(t);
  }, []);

  const handleCopy = (i: number) => {
    setCopied(i);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="ob-screen">
      {/* Mock topbar */}
      <div className="ob-topbar">
        <span className="ob-topbar-logo">Запрошення ✦</span>
        <div className="ob-topbar-nav">
          <span className="ob-nb ob-nb-active">
            <Icon name="house" size={14} /> Мої
          </span>
          <span className="ob-nb">
            <Icon name="plus" size={14} /> Нове
          </span>
        </div>
      </div>

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

        {/* Invite cards — identical to real home-inv-card */}
        {invites.map((inv, i) => {
          const st = statuses[(statusIdx + i) % statuses.length];
          const sm = statusMeta[st];
          const isCopied = copied === i;
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
                {/* Copy button — like real home-copy-btn */}
                <button
                  className={`ob-copy-btn ${isCopied ? 'ob-copy-ok' : ''}`}
                  title="Копіювати посилання"
                  onClick={() => handleCopy(i)}
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
   STEP 3 — Create
   Правильний порядок: Кому → Повідомлення → Дата/Час → Місце
════════════════════════════════════════════ */
const CREATE_STAGES = [
  { field: 'to',    label: 'Кому',        placeholder: "Ім'я отримувача",          value: 'Андрій',               icon: 'user' },
  { field: 'msg',   label: 'Повідомлення', placeholder: 'Ваше повідомлення',        value: 'Привіт! Запрошую 😊',  icon: 'chat-circle-dots' },
  { field: 'date',  label: 'Дата',         placeholder: 'дд.мм.рррр',               value: '12.07.2025',           icon: 'calendar-blank' },
  { field: 'time',  label: 'Час',          placeholder: 'гг:хх',                    value: '18:30',                icon: 'clock' },
  { field: 'place', label: 'Місце',        placeholder: 'Де зустрічаємось?',        value: 'Кав\'ярня "Синій птах"', icon: 'map-pin' },
] as const;

const EVENT_TYPES = [
  { v: 'coffee', e: '☕', l: 'Кава' },
  { v: 'party',  e: '🎉', l: 'Вечірка' },
  { v: 'dinner', e: '🍕', l: 'Вечеря' },
  { v: 'date',   e: '💑', l: 'Побачення' },
];

function CreateStep() {
  const [fieldIdx, setFieldIdx]   = useState(0);
  const [charIdx, setCharIdx]     = useState(0);
  const [phase, setPhase]         = useState<'typing' | 'done'>('typing');
  const [vals, setVals]           = useState<string[]>(CREATE_STAGES.map(() => ''));
  const [typeIdx, setTypeIdx]     = useState(0);

  // Cycle selected event type
  useEffect(() => {
    const t = setInterval(() => setTypeIdx(i => (i + 1) % EVENT_TYPES.length), 1600);
    return () => clearInterval(t);
  }, []);

  // Typing animation
  useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(() => {
        setPhase('typing');
        setFieldIdx(0);
        setCharIdx(0);
        setVals(CREATE_STAGES.map(() => ''));
      }, 2000);
      return () => clearTimeout(t);
    }

    const target = CREATE_STAGES[fieldIdx].value;
    if (charIdx < target.length) {
      const t = setTimeout(() => {
        setVals(prev => {
          const next = [...prev];
          next[fieldIdx] = target.slice(0, charIdx + 1);
          return next;
        });
        setCharIdx(c => c + 1);
      }, 60);
      return () => clearTimeout(t);
    } else if (fieldIdx < CREATE_STAGES.length - 1) {
      const t = setTimeout(() => { setFieldIdx(fi => fi + 1); setCharIdx(0); }, 380);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase('done'), 500);
      return () => clearTimeout(t);
    }
  }, [phase, fieldIdx, charIdx]);

  return (
    <div className="ob-screen">
      <div className="ob-topbar">
        <span className="ob-topbar-logo">Запрошення ✦</span>
        <div className="ob-topbar-nav">
          <span className="ob-nb"><Icon name="house" size={14} /> Мої</span>
          <span className="ob-nb ob-nb-active"><Icon name="plus" size={14} /> Нове</span>
        </div>
      </div>

      <div className="ob-wrap">
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

        {/* Type picker */}
        <div className="ob-form-section">
          <div className="ob-form-section-header">
            <div className="ob-form-section-icon"><Icon name="confetti" size={13} /></div>
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

        {/* Recipient + Message section */}
        <div className="ob-form-section">
          <div className="ob-form-section-header">
            <div className="ob-form-section-icon"><Icon name="user" size={13} /></div>
            <span className="ob-form-section-label">Отримувач</span>
          </div>
          <div className="ob-form-section-body">
            {CREATE_STAGES.slice(0, 2).map((f, i) => (
              <div key={f.field} className="ob-field">
                <label className="ob-field-label">
                  <Icon name={f.icon} size={11} /> {f.label}
                </label>
                <div className={`ob-input-mock ${fieldIdx === i && phase === 'typing' ? 'ob-input-active' : ''}`}>
                  <span>{vals[i] || <span className="ob-input-placeholder">{f.placeholder}</span>}</span>
                  {fieldIdx === i && phase === 'typing' && <span className="ob-cursor">|</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date/Time/Place section */}
        <div className="ob-form-section">
          <div className="ob-form-section-header">
            <div className="ob-form-section-icon"><Icon name="calendar-blank" size={13} /></div>
            <span className="ob-form-section-label">Деталі зустрічі</span>
          </div>
          <div className="ob-form-section-body">
            {/* Date + Time in a row */}
            <div className="ob-datetime-row">
              {CREATE_STAGES.slice(2, 4).map((f, ri) => {
                const i = ri + 2;
                return (
                  <div key={f.field} className="ob-field">
                    <label className="ob-field-label">
                      <Icon name={f.icon} size={11} /> {f.label}
                    </label>
                    <div className={`ob-input-mock ${fieldIdx === i && phase === 'typing' ? 'ob-input-active' : ''}`}>
                      <span>{vals[i] || <span className="ob-input-placeholder">{f.placeholder}</span>}</span>
                      {fieldIdx === i && phase === 'typing' && <span className="ob-cursor">|</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Place */}
            {(() => {
              const f = CREATE_STAGES[4];
              const i = 4;
              return (
                <div className="ob-field">
                  <label className="ob-field-label">
                    <Icon name={f.icon} size={11} /> {f.label}
                  </label>
                  <div className={`ob-input-mock ${fieldIdx === i && phase === 'typing' ? 'ob-input-active' : ''}`}>
                    <span>{vals[i] || <span className="ob-input-placeholder">{f.placeholder}</span>}</span>
                    {fieldIdx === i && phase === 'typing' && <span className="ob-cursor">|</span>}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Submit */}
        <div className={`ob-create-submit ${phase === 'done' ? 'ob-submit-pulse' : ''}`}>
          {phase === 'done'
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
      <div className="ob-topbar">
        <span className="ob-topbar-logo">Запрошення ✦</span>
        <div className="ob-topbar-nav">
          <span className="ob-nb ob-nb-active"><Icon name="users" size={14} /> Друзі</span>
          <span className="ob-nb"><Icon name="bell" size={14} /></span>
        </div>
      </div>

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
  const [notifState, setNotifState] = useState<'idle' | 'arriving' | 'shown' | 'accepted'>('idle');
  const [bellPulse, setBellPulse] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setNotifState('idle');
      setBellPulse(false);
      setTimeout(() => setBellPulse(true), 600);
      setTimeout(() => setNotifState('arriving'), 900);
      setTimeout(() => setNotifState('shown'), 1500);
      setTimeout(() => setNotifState('accepted'), 3000);
      setTimeout(cycle, 4600);
    };
    const t = setTimeout(cycle, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="ob-screen">
      <div className="ob-topbar">
        <span className="ob-topbar-logo">Запрошення ✦</span>
        <div className="ob-topbar-nav">
          <span className="ob-nb"><Icon name="house" size={14} /> Мої</span>
          <span className="ob-nb ob-nb-active" style={{ position: 'relative' }}>
            <Icon name="bell" size={14} />
            {bellPulse && <span className="ob-notif-badge ob-badge-pulse">1</span>}
          </span>
        </div>
      </div>

      <div className="ob-wrap">
        <div className="ob-page-header">
          <h2 className="ob-page-title">Сповіщення</h2>
          <p className="ob-page-subtitle">Всі події в одному місці</p>
        </div>

        <div className="ob-notif-group-label">СЬОГОДНІ</div>

        {/* Incoming invite notif */}
        {(notifState === 'arriving' || notifState === 'shown' || notifState === 'accepted') && (
          <div className={`ob-notif-item ob-notif-unread ${notifState === 'arriving' ? 'ob-anim-slide-in' : ''} ${notifState === 'accepted' ? 'ob-notif-processed' : ''}`}>
            <div className="ob-notif-icon-wrap ob-notif-type-invite">
              <Icon name="paper-plane-tilt" size={18} />
            </div>
            <div className="ob-notif-body">
              <div className="ob-notif-title">Нове запрошення від Олени!</div>
              <div className="ob-notif-text">Кава · 15 лип о 14:00 · Парк Шевченка</div>
              {notifState === 'shown' && (
                <div className="ob-notif-actions ob-anim-fade-in">
                  <div className="ob-btn-accept"><Icon name="check" size={12} /> Прийняти</div>
                  <div className="ob-btn-decline"><Icon name="x" size={12} /> Відхилити</div>
                </div>
              )}
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
    <div className="ob-overlay">
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
