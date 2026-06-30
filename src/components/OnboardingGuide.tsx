'use client';
import React, { useState, useEffect } from 'react';

/* ── Types ── */
interface OnboardingGuideProps {
  userName: string;
  onComplete: () => void;
}

/* ── Animated step components ── */

/* Step 1 — Welcome */
function WelcomeStep({ name }: { name: string }) {
  return (
    <div className="ob-welcome">
      <div className="ob-welcome-logo">✦</div>
      <h2 className="ob-welcome-title">Ласкаво просимо,<br /><span className="ob-welcome-name">{name}!</span></h2>
      <p className="ob-welcome-desc">
        Запрошення ✦ — це зручний спосіб організовувати зустрічі та надсилати запрошення друзям.
        Давайте разом познайомимося з основними функціями.
      </p>
      <div className="ob-welcome-features">
        <div className="ob-welcome-feature">
          <span className="ob-welcome-feature-icon">📋</span>
          <span>Мої запрошення</span>
        </div>
        <div className="ob-welcome-feature">
          <span className="ob-welcome-feature-icon">✍️</span>
          <span>Створення</span>
        </div>
        <div className="ob-welcome-feature">
          <span className="ob-welcome-feature-icon">👥</span>
          <span>Друзі</span>
        </div>
        <div className="ob-welcome-feature">
          <span className="ob-welcome-feature-icon">🔔</span>
          <span>Сповіщення</span>
        </div>
      </div>
    </div>
  );
}

/* Step 2 — Home (Мої запрошення) */
function HomeStep() {
  const [statusIdx, setStatusIdx] = useState(0);
  const statuses = ['pending', 'accepted', 'declined', 'reschedule'];
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending:    { label: '⏳ Очікує',  color: 'var(--gold)' },
    accepted:   { label: '✓ Прийнято', color: 'var(--green)' },
    declined:   { label: '✕ Відхилено', color: 'var(--red)' },
    reschedule: { label: '↺ Перенос',  color: 'var(--gold)' },
  };
  const invites = [
    { emoji: '☕', name: 'Аня',    type: 'Кава',      date: '1 лип · 15:00',  statusKey: 0 },
    { emoji: '🎉', name: 'Макс',   type: 'Вечірка',   date: '5 лип · 20:00',  statusKey: 1 },
    { emoji: '🍕', name: 'Олена',  type: 'Вечеря',    date: '10 лип · 19:00', statusKey: 2 },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setStatusIdx(i => (i + 1) % statuses.length);
    }, 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="ob-screen">
      {/* Mock topbar */}
      <div className="ob-topbar">
        <span className="ob-topbar-logo">Запрошення ✦</span>
        <div className="ob-topbar-nav">
          <span className="ob-nb ob-nb-active">🏠 Мої</span>
          <span className="ob-nb">＋ Нове</span>
        </div>
      </div>
      {/* Mock content */}
      <div className="ob-wrap">
        <div className="ob-home-header">
          <h2 className="ob-home-title">Мої запрошення</h2>
          <div className="ob-btn-create-fab"><span>＋</span> Нове</div>
        </div>
        {/* Stats chips */}
        <div className="ob-stats-row">
          {[
            { key: 'all',        label: 'Всі',        num: 3, cls: '' },
            { key: 'pending',    label: 'Очікують',   num: 1, cls: 'stat-pending ob-stat-active' },
            { key: 'accepted',   label: 'Прийняті',   num: 1, cls: 'stat-accepted' },
            { key: 'declined',   label: 'Відхилені',  num: 1, cls: 'stat-declined' },
          ].map(s => (
            <div key={s.key} className={`ob-stat-chip ${s.cls}`}>
              <span className="ob-stat-num">{s.num}</span>
              <span className="ob-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div className="ob-home-tabs">
          <div className="ob-home-tab ob-home-tab-active">✈ Відправлені</div>
          <div className="ob-home-tab">👥 Від друзів</div>
        </div>
        {/* Cards */}
        {invites.map((inv, i) => {
          const effectiveStatusIdx = (statusIdx + i) % statuses.length;
          const st = statuses[effectiveStatusIdx];
          const sl = statusLabels[st];
          return (
            <div key={i} className={`ob-inv-card ob-status-${st}`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="ob-inv-emoji">{inv.emoji}</div>
              <div className="ob-inv-body">
                <div className="ob-inv-title">{inv.name}</div>
                <div className="ob-inv-meta">
                  <span className="ob-inv-meta-type">{inv.type}</span>
                  <span className="ob-inv-meta-date">📅 {inv.date}</span>
                </div>
              </div>
              <div className="ob-inv-right">
                <span className="ob-badge" style={{ color: sl.color, borderColor: sl.color, background: `${sl.color}18` }}>
                  {sl.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Step 3 — Create */
const CREATE_FIELDS = [
  { label: 'Кому',  value: 'Андрій',                placeholder: "Ім'я отримувача" },
  { label: 'Дата',  value: '12.07.2025',              placeholder: 'дд.мм.рррр' },
  { label: 'Час',   value: '18:30',                   placeholder: 'гг:хх' },
  { label: 'Місце', value: 'Кав\'ярня "Синій птах"',  placeholder: 'Де зустрічаємось?' },
  { label: 'Текст', value: 'Привіт! Запрошую на каву 😊', placeholder: 'Ваше повідомлення' },
];

function CreateStep() {
  const [phase, setPhase] = useState<'typing' | 'done'>('typing');
  const [fieldIdx, setFieldIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [shownFields, setShownFields] = useState<string[]>(['', '', '', '', '']);
  const [selectedType, setSelectedType] = useState<'coffee' | 'party' | 'dinner'>('coffee');
  const types = [
    { v: 'coffee', e: '☕', l: 'Кава' },
    { v: 'party',  e: '🎉', l: 'Вечірка' },
    { v: 'dinner', e: '🍕', l: 'Вечеря' },
    { v: 'date',   e: '💑', l: 'Побачення' },
  ];

  useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(() => {
        setPhase('typing');
        setFieldIdx(0);
        setCharIdx(0);
        setShownFields(['', '', '', '', '']);
        setSelectedType('coffee');
      }, 2200);
      return () => clearTimeout(t);
    }

    const target = CREATE_FIELDS[fieldIdx]?.value || '';
    if (charIdx < target.length) {
      const t = setTimeout(() => {
        setShownFields(prev => {
          const next = [...prev];
          next[fieldIdx] = target.slice(0, charIdx + 1);
          return next;
        });
        setCharIdx(c => c + 1);
      }, 55);
      return () => clearTimeout(t);
    } else {
      // Move to next field
      if (fieldIdx < CREATE_FIELDS.length - 1) {
        const t = setTimeout(() => {
          setFieldIdx(fi => fi + 1);
          setCharIdx(0);
        }, 420);
        return () => clearTimeout(t);
      } else {
        // All fields filled — show done
        const t = setTimeout(() => setPhase('done'), 600);
        return () => clearTimeout(t);
      }
    }
  }, [phase, fieldIdx, charIdx]);

  // Cycle selected type
  useEffect(() => {
    const typeList = ['coffee', 'party', 'dinner', 'coffee'] as const;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % (typeList.length - 1);
      setSelectedType(typeList[i]);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="ob-screen">
      <div className="ob-topbar">
        <span className="ob-topbar-logo">Запрошення ✦</span>
        <div className="ob-topbar-nav">
          <span className="ob-nb">🏠 Мої</span>
          <span className="ob-nb ob-nb-active">＋ Нове</span>
        </div>
      </div>
      <div className="ob-wrap">
        <div className="ob-create-header">
          <h2 className="ob-create-title">Нове запрошення</h2>
          <p className="ob-create-subtitle">Заповніть деталі — посилання буде готове миттєво</p>
        </div>
        {/* Mode tabs */}
        <div className="ob-mode-tabs">
          <div className="ob-mode-tab ob-mode-tab-active">👤 Персональне</div>
          <div className="ob-mode-tab">👥 Групове</div>
        </div>
        {/* Type picker */}
        <div className="ob-form-section">
          <div className="ob-form-section-header">
            <div className="ob-form-section-icon">🎭</div>
            <span className="ob-form-section-label">Тип події</span>
          </div>
          <div className="ob-form-section-body">
            <div className="ob-type-picker">
              {types.map(t => (
                <div key={t.v} className={`ob-type-option ${selectedType === t.v ? 'ob-selected' : ''}`}>
                  <span className="ob-type-emoji">{t.e}</span>
                  <span>{t.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Fields */}
        <div className="ob-form-section">
          <div className="ob-form-section-header">
            <div className="ob-form-section-icon">👤</div>
            <span className="ob-form-section-label">Деталі</span>
          </div>
          <div className="ob-form-section-body">
            {CREATE_FIELDS.slice(0, 4).map((f, i) => (
              <div key={i} className="ob-field">
                <label className="ob-field-label">{f.label}</label>
                <div className={`ob-input-mock ${fieldIdx === i && phase === 'typing' ? 'ob-input-active' : ''}`}>
                  <span>{shownFields[i] || <span className="ob-input-placeholder">{f.placeholder}</span>}</span>
                  {fieldIdx === i && phase === 'typing' && <span className="ob-cursor">|</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Submit */}
        <div className={`ob-create-submit ${phase === 'done' ? 'ob-submit-pulse' : ''}`}>
          {phase === 'done' ? '🎉 Запрошення створено!' : 'Надіслати запрошення →'}
        </div>
      </div>
    </div>
  );
}

/* Step 4 — Friends */
function FriendsStep() {
  const [searchPhase, setSearchPhase] = useState<'empty' | 'typing' | 'found' | 'added'>('empty');
  const [searchText, setSearchText] = useState('');
  const TARGET = '@andriy_k';
  const friends = [
    { name: 'Катя',   status: 'online',     letter: 'К' },
    { name: 'Богдан', status: '5 хв тому',  letter: 'Б' },
  ];

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (searchPhase === 'empty') {
      t = setTimeout(() => setSearchPhase('typing'), 800);
    } else if (searchPhase === 'typing') {
      if (searchText.length < TARGET.length) {
        t = setTimeout(() => setSearchText(TARGET.slice(0, searchText.length + 1)), 100);
      } else {
        t = setTimeout(() => setSearchPhase('found'), 500);
      }
    } else if (searchPhase === 'found') {
      t = setTimeout(() => setSearchPhase('added'), 1400);
    } else if (searchPhase === 'added') {
      t = setTimeout(() => {
        setSearchPhase('empty');
        setSearchText('');
      }, 2000);
    }
    return () => clearTimeout(t);
  }, [searchPhase, searchText]);

  return (
    <div className="ob-screen">
      <div className="ob-topbar">
        <span className="ob-topbar-logo">Запрошення ✦</span>
        <div className="ob-topbar-nav">
          <span className="ob-nb ob-nb-active">👥 Друзі</span>
          <span className="ob-nb">🔔</span>
        </div>
      </div>
      <div className="ob-wrap">
        <div className="ob-page-header">
          <h2 className="ob-page-title">Друзі</h2>
          <p className="ob-page-subtitle">Додавайте друзів та надсилайте запрошення напряму</p>
        </div>
        {/* Search bar */}
        <div className="ob-friends-search">
          <div className="ob-search-input-wrap">
            <span className="ob-search-icon">🔍</span>
            <div className="ob-search-input-mock">
              {searchText || <span className="ob-input-placeholder">ID (ZAP-XXXX) або @логін</span>}
              {searchPhase === 'typing' && <span className="ob-cursor">|</span>}
            </div>
          </div>
          <div className="ob-btn-find">Знайти</div>
        </div>
        {/* Search result */}
        {searchPhase === 'found' && (
          <div className="ob-search-result ob-anim-pop">
            <div className="ob-avatar">А</div>
            <div style={{ flex: 1 }}>
              <div className="ob-result-name">Андрій Коваль</div>
              <div className="ob-result-id">@andriy_k · ZAP-4721</div>
            </div>
            <div className="ob-btn-add">＋ Додати</div>
          </div>
        )}
        {searchPhase === 'added' && (
          <div className="ob-search-result ob-result-added ob-anim-pop">
            <span style={{ color: 'var(--green)', fontSize: '1.1rem' }}>✓</span>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>Запит надіслано!</span>
          </div>
        )}
        {/* Tabs */}
        <div className="ob-mode-tabs" style={{ marginTop: '16px' }}>
          <div className="ob-mode-tab ob-mode-tab-active">👥 Друзі <span className="ob-tab-count">{friends.length}</span></div>
          <div className="ob-mode-tab">✋ Запити</div>
          <div className="ob-mode-tab">✈ Запрошення</div>
        </div>
        {/* Friends list */}
        <div className="ob-friend-list">
          {friends.map((f, i) => (
            <div key={i} className="ob-friend-row">
              <div style={{ position: 'relative' }}>
                <div className="ob-avatar ob-avatar-sm">{f.letter}</div>
                {f.status === 'online' && <span className="ob-online-dot"></span>}
              </div>
              <div className="ob-friend-info">
                <div className="ob-friend-name">{f.name}</div>
                <div className={`ob-friend-status ${f.status === 'online' ? 'ob-friend-online' : ''}`}>{f.status}</div>
              </div>
              <div className="ob-friend-menu-btn">⋮</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Step 5 — Notifications */
function NotificationsStep() {
  const [notifState, setNotifState] = useState<'idle' | 'arriving' | 'shown' | 'accepted'>('idle');
  const [bellPulse, setBellPulse] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setNotifState('idle');
      setBellPulse(false);
      setTimeout(() => setBellPulse(true), 600);
      setTimeout(() => setNotifState('arriving'), 1000);
      setTimeout(() => setNotifState('shown'), 1600);
      setTimeout(() => setNotifState('accepted'), 3000);
      setTimeout(cycle, 4800);
    };
    const t = setTimeout(cycle, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="ob-screen">
      <div className="ob-topbar">
        <span className="ob-topbar-logo">Запрошення ✦</span>
        <div className="ob-topbar-nav">
          <span className="ob-nb">🏠 Мої</span>
          <span className="ob-nb ob-nb-active" style={{ position: 'relative' }}>
            🔔
            {bellPulse && <span className="ob-notif-badge ob-badge-pulse">1</span>}
          </span>
        </div>
      </div>
      <div className="ob-wrap">
        <div className="ob-page-header">
          <h2 className="ob-page-title">Сповіщення</h2>
          <p className="ob-page-subtitle">Всі події в одному місці</p>
        </div>
        {/* Notif items */}
        <div className="ob-notif-group-label">СЬОГОДНІ</div>
        {/* New incoming invite */}
        {(notifState === 'arriving' || notifState === 'shown' || notifState === 'accepted') && (
          <div className={`ob-notif-item ob-notif-unread ${notifState === 'arriving' ? 'ob-anim-slide-in' : ''} ${notifState === 'accepted' ? 'ob-notif-processed' : ''}`}>
            <div className="ob-notif-icon-wrap ob-notif-type-invite">✈</div>
            <div className="ob-notif-body">
              <div className="ob-notif-title">Нове запрошення від Олени!</div>
              <div className="ob-notif-text">Кава · 15 лип о 14:00 · Парк Шевченка</div>
              {notifState === 'shown' && (
                <div className="ob-notif-actions ob-anim-fade-in">
                  <div className="ob-btn-accept">✓ Прийняти</div>
                  <div className="ob-btn-decline">✕ Відхилити</div>
                </div>
              )}
              {notifState === 'accepted' && (
                <div className="ob-status-text ob-anim-fade-in">✓ Прийнято</div>
              )}
              <div className="ob-notif-time">🕐 щойно</div>
            </div>
            {notifState !== 'accepted' && <div className="ob-notif-unread-dot"></div>}
          </div>
        )}
        {/* Static older notif */}
        <div className="ob-notif-item">
          <div className="ob-notif-icon-wrap ob-notif-type-friend">👤</div>
          <div className="ob-notif-body">
            <div className="ob-notif-title">Богдан прийняв запрошення</div>
            <div className="ob-notif-text">Вечірка · 5 лип о 20:00</div>
            <div className="ob-notif-time">🕐 2 год тому</div>
          </div>
        </div>
        <div className="ob-notif-group-label" style={{ marginTop: 16 }}>ВЧОРА</div>
        <div className="ob-notif-item">
          <div className="ob-notif-icon-wrap ob-notif-type-request">🤝</div>
          <div className="ob-notif-body">
            <div className="ob-notif-title">Катя хоче додати вас у друзі</div>
            <div className="ob-notif-text">Запит на дружбу</div>
            <div className="ob-notif-time">🕐 вчора</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main OnboardingGuide component ── */
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
    if (isLast) {
      onComplete();
      return;
    }
    setExiting(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setExiting(false);
    }, 220);
  };

  const goPrev = () => {
    if (step === 0) return;
    setExiting(true);
    setTimeout(() => {
      setStep(s => s - 1);
      setExiting(false);
    }, 220);
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
          {step > 0 ? (
            <button className="ob-btn-back" onClick={goPrev}>← Назад</button>
          ) : (
            <div />
          )}
          <button className="ob-btn-next" onClick={goNext}>
            {isLast ? '🎉 Почати роботу' : 'Далі →'}
          </button>
        </div>
      </div>
    </div>
  );
}
