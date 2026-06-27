/* eslint-disable react/no-unescaped-entities */

'use client';
import Link from 'next/link';
import './landing.css';
import { useEffect, useState, useRef } from 'react';
import { Icon } from '@/components/Icon';

export default function LandingPage() {
  useEffect(() => {
    const revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('is-visible'));
    }
  }, []);

  // Features section state
  const [activeFeature, setActiveFeature] = useState(0);
  
  // Feature interactive states
  const [inviteStatus, setInviteStatus] = useState<'yes' | 'no' | null>(null);
  const [joinedGroup, setJoinedGroup] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: number; text: string; time: string; type: string; title: string }>>([
    { id: 1, text: 'Максим запросив вас на зустріч "Кава"', time: 'Щойно', type: 'invite', title: 'Нове запрошення' },
    { id: 2, text: 'Ольга хоче додати вас у друзі', time: '5 хв тому', type: 'friend-request', title: 'Запит у друзі' }
  ]);
  const [friendsList, setFriendsList] = useState([
    { name: 'Денис', uniqueId: 'ZAP-F8H2D1', login: 'denys', online: true },
    { name: 'Ольга', uniqueId: 'ZAP-M3K9W2', login: 'olya_fine', online: true }
  ]);
  const [friendSearch, setFriendSearch] = useState('');
  const [friendMenuOpen, setFriendMenuOpen] = useState<string | null>(null);
  const [rescheduleAccepted, setRescheduleAccepted] = useState(false);
  const [tfaEnabled, setTfaEnabled] = useState(false);

  // How it works state
  const [activeStep, setActiveStep] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Stepper interactive states (Step 1 Registration)
  const [regForm, setRegForm] = useState({ name: '', login: '', pass: '', terms: false });
  const [registeredProfile, setRegisteredProfile] = useState<{ name: string; login: string; uniqueId: string } | null>(null);
  
  // Step 2 Search
  const [stepperSearch, setStepperSearch] = useState('');
  const [stepperRequestSent, setStepperRequestSent] = useState(false);
  
  // Step 3 Send
  const [stepperInviteTo, setStepperInviteTo] = useState('');
  const [stepperInviteMsg, setStepperInviteMsg] = useState('');
  const [stepperInviteType, setStepperInviteType] = useState('coffee');
  const [stepperInviteDate, setStepperInviteDate] = useState('');
  const [stepperInviteTime, setStepperInviteTime] = useState('');
  const [stepperInvitePlace, setStepperInvitePlace] = useState('');
  
  // Step 4 Result
  const [stepperResponseState, setStepperResponseState] = useState<'pending' | 'accepted' | 'declined'>('pending');

  // Scroll pinning effect
  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;
      
      // If mobile view, disable scroll hijacking/pinning calculations
      if (window.innerWidth <= 768) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const top = -rect.top;
      const height = rect.height - window.innerHeight;

      if (top < 0) {
        setActiveStep(0);
        return;
      }
      if (top > height) {
        setActiveStep(3);
        return;
      }

      const progress = top / height;
      const step = Math.min(3, Math.floor(progress * 4));
      setActiveStep(step);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
    if (window.innerWidth <= 768) return;

    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const elementTop = rect.top + scrollTop;
    const scrollHeight = rect.height - window.innerHeight;
    const targetScroll = elementTop + (stepIndex / 3) * scrollHeight;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  // Event types state
  const [selectedType, setSelectedType] = useState('coffee');

  const FEATURE_ICONS = [
    // Envelope-card
    <svg key="f0" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="custom-svg-icon">
      <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
      <path d="M2 7l10 7 10-7" />
      <path d="M12 17h.01" strokeWidth="3" />
    </svg>,
    // Users
    <svg key="f1" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="custom-svg-icon">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>,
    // Bell
    <svg key="f2" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="custom-svg-icon">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>,
    // Friends
    <svg key="f3" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="custom-svg-icon">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="16" y1="11" x2="22" y2="11" />
    </svg>,
    // Reschedule / Circular arrows
    <svg key="f4" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="custom-svg-icon">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
      <circle cx="12" cy="12" r="3" />
    </svg>,
    // Shield-lock
    <svg key="f5" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="custom-svg-icon">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="11" r="2" />
      <path d="M12 13v3" />
    </svg>
  ];

  const EVENT_TYPES = [
    { id: 'date', emoji: '🌹', name: 'Побачення', bg: 'linear-gradient(135deg, #fffbfb 0%, #ffebeb 100%)', border: '#ffcdd2', text: 'Вечеря у приємному місці? Дуже чекаю на зустріч!', place: 'Затишний ресторан', time: '19:00', date: 'П\'ятниця, 27 червня' },
    { id: 'walk', emoji: '🍃', name: 'Прогулянка', bg: 'linear-gradient(135deg, #fffdfa 0%, #edf7f1 100%)', border: '#c8e6c9', text: 'Гарна погода! Прогуляємось парком, вип\'ємо лимонаду?', place: 'Парк Шевченка', time: '15:00', date: 'Неділя, 29 червня' },
    { id: 'birthday', emoji: '🎂', name: 'День народження', bg: 'linear-gradient(135deg, #fffafa 0%, #fef3eb 100%)', border: '#ffe0b2', text: 'Запрошую тебе на святкування мого дня народження! Буде торт і веселощі!', place: 'Лофт-простір, вул. Зелена', time: '17:00', date: 'Субота, 5 липня' },
    { id: 'party', emoji: '🥂', name: 'Вечірка', bg: 'linear-gradient(135deg, #fffdf8 0%, #fbf3e0 100%)', border: '#ffe0b2', text: 'Збираємось на тусовку вихідного дня! З собою мати гарний настрій!', place: 'Будинок біля озера', time: '18:00', date: 'Субота, 28 червня' },
    { id: 'cinema', emoji: '🎬', name: 'Кіно', bg: 'linear-gradient(135deg, #fafafa 0%, #f1f1f1 100%)', border: '#e0e0e0', text: 'Сходимо на новий фільм? Квитки вже забронював!', place: 'Кінотеатр Multiplex', time: '20:00', date: 'Четвер, 2 липня' },
    { id: 'coffee', emoji: '☕', name: 'Кава', bg: 'linear-gradient(135deg, #fffbfa 0%, #f6ebe6 100%)', border: '#d7ccc8', text: 'Зустрінемось на каву? Давно не бачились, маю купу новин!', place: 'Kyiv Coffee, Хрещатик', time: '11:00', date: 'Субота, 21 червня' },
    { id: 'travel', emoji: '✈️', name: 'Подорож', bg: 'linear-gradient(135deg, #faffff 0%, #ebf8fe 100%)', border: '#b3e5fc', text: 'Вирушаємо у невелику мандрівку на вихідні? Погнали!', place: 'Карпати (Яремче)', time: '08:00', date: 'П\'ятниця, 4 липня' },
    { id: 'other', emoji: '✨', name: 'Інше', bg: 'linear-gradient(135deg, #faf8ff 0%, #f3ebff 100%)', border: '#d1c4e9', text: 'Привіт! Маю цікаву пропозицію зустрітися, давай обговоримо!', place: 'Затишне кафе в центрі', time: '16:00', date: 'Середа, 1 липня' }
  ];

  const selectedTypeData = EVENT_TYPES.find(t => t.id === selectedType) || EVENT_TYPES[0];

  const renderFeaturePreview = () => {
    switch (activeFeature) {
      case 0:
        return (
          <div className="phone-screen">
            <div className="phone-notch"></div>
            <div className="phone-status">12:00</div>
            <div className="phone-content" style={{ padding: '8px' }}>
              <div className="invite-envelope" style={{ minHeight: 'auto', borderRadius: '16px', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <div className="envelope-top" style={{ padding: '12px 12px 20px', borderRadius: '16px 16px 0 0' }}>
                  <span className="envelope-emoji" style={{ fontSize: '1.5rem', animation: 'none' }}>☕</span>
                  <div className="envelope-type" style={{ fontSize: '0.5rem', marginBottom: '4px' }}>Кава</div>
                  <div className="envelope-to" style={{ fontSize: '1.1rem', marginBottom: '2px' }}>Олена</div>
                  <div className="envelope-from" style={{ fontSize: '0.6rem', paddingBottom: '0' }}>від <strong>Максима</strong></div>
                </div>

                <div className="envelope-body" style={{ padding: '10px' }}>
                  <div className="msg-block" style={{ padding: '6px 8px', marginBottom: '8px', borderRadius: '8px' }}>
                    <p className="msg-text" style={{ fontSize: '0.8rem' }}>Зустрінемось на каву? Маю купу новин!</p>
                  </div>

                  <div className="detail-chips" style={{ gap: '6px', marginBottom: '8px' }}>
                    <div className="detail-chip" style={{ padding: '6px 8px', borderRadius: '6px', gap: '6px' }}>
                      <span className="detail-chip-icon" style={{ fontSize: '0.8rem' }}><Icon name="calendar-blank" size={12}/></span>
                      <div>
                        <div className="detail-chip-label" style={{ fontSize: '0.5rem' }}>Дата</div>
                        <div className="detail-chip-value" style={{ fontSize: '0.7rem' }}>Субота, 15:00</div>
                      </div>
                    </div>
                    <div className="detail-chip" style={{ padding: '6px 8px', borderRadius: '6px', gap: '6px' }}>
                      <span className="detail-chip-icon" style={{ fontSize: '0.8rem' }}><Icon name="map-pin" size={12}/></span>
                      <div>
                        <div className="detail-chip-label" style={{ fontSize: '0.5rem' }}>Місце</div>
                        <div className="detail-chip-value" style={{ fontSize: '0.7rem' }}>Kyiv Coffee</div>
                      </div>
                    </div>
                  </div>

                  {inviteStatus === null ? (
                    <div className="action-section-wrap" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                      <div className="answer-wrap" style={{ gap: '4px' }}>
                        <button className="btn-yes" onClick={() => setInviteStatus('yes')} style={{ fontSize: '0.62rem', padding: '6px 4px', borderRadius: '6px' }}>
                          <Icon name="check" size={10}/> Так, я приду!
                        </button>
                        <button className="btn-no" onClick={() => setInviteStatus('no')} style={{ fontSize: '0.62rem', padding: '6px 4px', borderRadius: '6px' }}>
                          <Icon name="x" size={10}/> Ні
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="result-screen" style={{ padding: '8px 0 4px' }}>
                      {inviteStatus === 'yes' ? (
                        <>
                          <span className="result-icon" style={{ fontSize: '1.8rem', marginBottom: '4px' }}><Icon name="confetti" size={24}/></span>
                          <div className="result-title" style={{ color: 'var(--green)', fontSize: '0.9rem', marginBottom: '2px' }}>Ура! Так!</div>
                          <div className="result-sub" style={{ fontSize: '0.72rem' }}>Ви погодились!</div>
                        </>
                      ) : (
                        <>
                          <span className="result-icon" style={{ fontSize: '1.8rem', marginBottom: '4px' }}><Icon name="heart-crack" size={24}/></span>
                          <div className="result-title" style={{ color: 'var(--red)', fontSize: '0.9rem', marginBottom: '2px' }}>Відмовлено</div>
                          <div className="result-sub" style={{ fontSize: '0.72rem' }}>Ви відмовились.</div>
                        </>
                      )}
                      <button className="btn-ghost" onClick={() => setInviteStatus(null)} style={{ fontSize: '0.65rem', marginTop: '4px', padding: '2px 6px' }}>
                        Скинути відповідь
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="phone-screen">
            <div className="phone-notch"></div>
            <div className="phone-status">12:00</div>
            <div className="phone-content" style={{ padding: '8px' }}>
              <div className="invite-envelope" style={{ minHeight: 'auto', borderRadius: '16px', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <div className="envelope-top" style={{ padding: '12px 12px 16px', borderRadius: '16px 16px 0 0' }}>
                  <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.15)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.55rem', fontWeight: 600, color: '#fff', marginBottom: '6px', alignItems: 'center', gap: '3px' }}>
                    <Icon name="users" size={8}/> Групове
                  </div>
                  <h1 className="envelope-to" style={{ fontSize: '1.1rem', marginBottom: '2px', fontFamily: 'var(--font-heading)' }}>🍕 Настільні ігри</h1>
                  <div className="envelope-from" style={{ fontSize: '0.6rem', paddingBottom: '0' }}>від <strong>Максима</strong></div>
                </div>

                <div className="envelope-body" style={{ padding: '10px' }}>
                  <div className="warm-panel" style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(180,140,60,.12)', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 600, margin: '0 0 6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Учасники ({joinedGroup ? 4 : 3})</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,.03)' }}>
                        <div className="avatar avatar-sm" style={{ width: '18px', height: '18px', fontSize: '0.55rem' }}>О</div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>Олександр</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'var(--green)' }}><Icon name="check-circle" size={10}/> Йде</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,.03)' }}>
                        <div className="avatar avatar-sm" style={{ width: '18px', height: '18px', fontSize: '0.55rem' }}>М</div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>Марія</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'var(--gold)' }}>Думає</span>
                      </div>
                      {joinedGroup && (
                        <div className="attendee-added-anim" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,.03)' }}>
                          <div className="avatar avatar-sm" style={{ width: '18px', height: '18px', fontSize: '0.55rem', background: 'var(--ink)', color: '#fff' }}>В</div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>Ви (гість)</span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'var(--green)' }}><Icon name="check-circle" size={10}/> Йде</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="action-section-wrap" style={{ paddingTop: '0', paddingBottom: '0' }}>
                    {!joinedGroup ? (
                      <button className="btn-yes" onClick={() => setJoinedGroup(true)} style={{ width: '100%', fontSize: '0.72rem', padding: '8px', borderRadius: '8px' }}>
                        <Icon name="check" size={12}/> Приєднатися до зустрічі
                      </button>
                    ) : (
                      <button className="btn-no" onClick={() => setJoinedGroup(false)} style={{ width: '100%', fontSize: '0.72rem', padding: '8px', borderRadius: '8px' }}>
                        Скасувати участь
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="phone-screen">
            <div className="phone-notch"></div>
            <div className="phone-status">12:00</div>
            <div className="phone-content" style={{ padding: '12px', background: 'var(--paper)', display: 'block' }}>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 400, fontStyle: 'italic', marginBottom: '10px' }}>Сповіщення</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div key={n.id} className="notif-item unread" style={{ padding: '8px 10px', borderRadius: '10px', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'start' }}>
                    <div className={`notif-icon-wrap type-${n.type}`} style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-dim)', color: 'var(--gold)', flexShrink: 0 }}>
                      <Icon name={n.type === 'friend-request' ? 'user-plus' : 'envelope-open'} size={14}/>
                    </div>
                    <div className="notif-body" style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div className="notif-title" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)' }}>{n.title}</div>
                      <div className="notif-text" style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: '1.3', margin: '1px 0' }}>{n.text}</div>
                      <div className="notif-time" style={{ fontSize: '0.62rem', color: 'var(--muted)', opacity: 0.8 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn btn-dark btn-sm" style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '0.72rem', borderRadius: '8px' }} onClick={() => {
                const newId = notifications.length + 1;
                setNotifications([
                  { id: newId, text: 'Дмитро прийняв ваше запрошення на "Каву"', time: 'Щойно', type: 'invite', title: 'Згода на зустріч' },
                  ...notifications
                ]);
              }}>
                Імітувати нове сповіщення
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="phone-screen">
            <div className="phone-notch"></div>
            <div className="phone-status">12:00</div>
            <div className="phone-content" style={{ padding: '12px', background: 'var(--paper)', display: 'block' }}>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 400, fontStyle: 'italic', marginBottom: '8px' }}>Друзі</h2>

              <div className="friends-search-bar" style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                <div className="friends-search-input-wrap" style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid var(--border)', borderRadius: '6px', padding: '0 6px' }}>
                  <Icon name="magnifying-glass" size={12} color="var(--muted)"/>
                  <input 
                    placeholder="ID чи @логін" 
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    style={{ border: 'none', padding: '4px 6px', fontSize: '0.75rem', width: '100%', outline: 'none' }}
                  />
                </div>
                <button className="btn btn-dark" style={{ padding: '4px 10px', fontSize: '0.7rem', width: 'auto', borderRadius: '6px' }}>Знайти</button>
              </div>

              {friendSearch.toLowerCase() === 'andrii' && (
                <div className="search-result-card search-found" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', marginBottom: '8px' }}>
                  <div className="avatar avatar-sm" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>А</div>
                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Андрій</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>@andrii • ZAP-X9K2H4</div>
                  </div>
                  <button className="btn btn-dark" style={{ padding: '4px 8px', fontSize: '0.62rem', width: 'auto', borderRadius: '4px' }} onClick={() => {
                    if (!friendsList.some(f => f.login === 'andrii')) {
                      setFriendsList([...friendsList, { name: 'Андрій', uniqueId: 'ZAP-X9K2H4', login: 'andrii', online: true }]);
                    }
                    setFriendSearch('');
                  }}>
                    Додати
                  </button>
                </div>
              )}

              <div className="friend-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {friendsList.map((f) => (
                  <div key={f.login} className="friend-row" style={{ padding: '6px 8px', borderRadius: '8px', background: 'var(--card)', border: '1px solid rgba(0,0,0,.03)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      <div className="avatar avatar-sm" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>{f.name[0]}</div>
                      {f.online && <span className="friend-online-dot" style={{ width: '6px', height: '6px', border: '1px solid #fff' }}></span>}
                    </div>
                    <div className="friend-row-info" style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div className="friend-row-name" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {f.name}
                        <span style={{ fontSize: '0.6rem', color: 'var(--muted)', marginLeft: '4px', fontFamily: 'monospace' }}>{f.uniqueId}</span>
                      </div>
                      <div className="friend-row-status" style={{ fontSize: '0.62rem', color: 'var(--green)' }}>В мережі</div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button className="friend-menu-btn" style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer' }} onClick={(e) => {
                        e.stopPropagation();
                        setFriendMenuOpen(friendMenuOpen === f.login ? null : f.login);
                      }}>
                        <Icon name="dots-three-vertical" size={16}/>
                      </button>
                      
                      {friendMenuOpen === f.login && (
                        <div className="friend-menu" style={{ position: 'absolute', top: '100%', right: '0', zIndex: 10, background: '#fff', border: '1px solid var(--border)', borderRadius: '6px', boxShadow: 'var(--shadow)', padding: '4px', minWidth: '120px' }}>
                          <button className="friend-menu-item" style={{ width: '100%', padding: '4px 8px', fontSize: '0.65rem', border: 'none', background: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setFriendMenuOpen(null)}>
                            <Icon name="user" size={10}/> Профіль
                          </button>
                          <button className="friend-menu-item" style={{ width: '100%', padding: '4px 8px', fontSize: '0.65rem', border: 'none', background: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setFriendMenuOpen(null)}>
                            <Icon name="paper-plane-tilt" size={10}/> Запросити
                          </button>
                          <button className="friend-menu-item danger" style={{ width: '100%', padding: '4px 8px', fontSize: '0.65rem', border: 'none', background: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--red)' }} onClick={() => {
                            setFriendsList(friendsList.filter(item => item.login !== f.login));
                            setFriendMenuOpen(null);
                          }}>
                            <Icon name="user-minus" size={10}/> Видалити
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic' }}>Спробуйте ввести "andrii" в пошук!</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="phone-screen">
            <div className="phone-notch"></div>
            <div className="phone-status">12:00</div>
            <div className="phone-content" style={{ padding: '8px' }}>
              <div className="invite-envelope" style={{ minHeight: 'auto', borderRadius: '16px', boxShadow: 'none', border: '1px solid var(--border)' }}>
                <div className="envelope-top" style={{ padding: '12px 12px 20px', borderRadius: '16px 16px 0 0' }}>
                  <span className="envelope-emoji" style={{ fontSize: '1.5rem', animation: 'none' }}>🎬</span>
                  <div className="envelope-type" style={{ fontSize: '0.5rem', marginBottom: '4px' }}>Кіно</div>
                  <div className="envelope-to" style={{ fontSize: '1.1rem', marginBottom: '2px' }}>Дмитро</div>
                  <div className="envelope-from" style={{ fontSize: '0.6rem', paddingBottom: '0' }}>від <strong>Максима</strong></div>
                </div>

                <div className="envelope-body" style={{ padding: '10px' }}>
                  <div className="msg-block" style={{ padding: '6px 8px', marginBottom: '8px', borderRadius: '8px' }}>
                    <p className="msg-text" style={{ fontSize: '0.8rem' }}>Йдемо на вечірній сеанс? Квитки вже у мене!</p>
                  </div>

                  <div className="detail-chips" style={{ gap: '6px', marginBottom: '8px' }}>
                    <div className="detail-chip" style={{ padding: '6px 8px', borderRadius: '6px', gap: '6px' }}>
                      <span className="detail-chip-icon" style={{ fontSize: '0.8rem' }}><Icon name="calendar-blank" size={12}/></span>
                      <div>
                        <div className="detail-chip-label" style={{ fontSize: '0.5rem' }}>Дата</div>
                        <div className="detail-chip-value" style={{ fontSize: '0.7rem' }}>{!rescheduleAccepted ? 'Субота, 18:00' : 'Неділя, 19:30'}</div>
                      </div>
                    </div>
                    <div className="detail-chip" style={{ padding: '6px 8px', borderRadius: '6px', gap: '6px' }}>
                      <span className="detail-chip-icon" style={{ fontSize: '0.8rem' }}><Icon name="map-pin" size={12}/></span>
                      <div>
                        <div className="detail-chip-label" style={{ fontSize: '0.5rem' }}>Місце</div>
                        <div className="detail-chip-value" style={{ fontSize: '0.7rem' }}>Multiplex</div>
                      </div>
                    </div>
                  </div>

                  {!rescheduleAccepted ? (
                    <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-border)', borderRadius: '10px', padding: '8px', textAlign: 'center', marginTop: '4px' }}>
                      <div style={{ display: 'inline-block', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', background: 'var(--gold)', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>Перенесення</div>
                      <p style={{ fontSize: '0.72rem', margin: '3px 0 6px' }}>Пропонують: <strong>Неділя, 19:30</strong></p>
                      <button className="btn-yes" onClick={() => setRescheduleAccepted(true)} style={{ width: '100%', fontSize: '0.65rem', padding: '6px', borderRadius: '6px' }}>
                        Прийняти новий час
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(45,122,79,0.06)', border: '1px solid rgba(45,122,79,0.2)', borderRadius: '10px', padding: '8px', textAlign: 'center', marginTop: '4px' }}>
                      <div style={{ display: 'inline-block', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', background: 'var(--green)', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>Змінено</div>
                      <p style={{ fontSize: '0.72rem', margin: '3px 0 4px', color: 'var(--green)' }}>Час погоджено! ✅</p>
                      <button className="btn-ghost" onClick={() => setRescheduleAccepted(false)} style={{ fontSize: '0.65rem', textDecoration: 'underline' }}>
                        Скинути
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="phone-screen">
            <div className="phone-notch"></div>
            <div className="phone-status">12:00</div>
            <div className="phone-content" style={{ padding: '12px', background: 'var(--paper)', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>М</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Максим</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>ZAP-X7H2K9</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '3px', background: tfaEnabled ? 'var(--green-bg)' : 'var(--warm)', padding: '2px 6px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 600, color: tfaEnabled ? 'var(--green)' : 'var(--muted)', border: '1px solid var(--border)' }}>
                  <span>{tfaEnabled ? 'Максимум 🛡️' : 'Базова ⚡'}</span>
                </div>
              </div>

              <div className="profile-section" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px', marginBottom: '8px' }}>
                <div className="profile-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div className="profile-field-label" style={{ fontSize: '0.55rem', color: 'var(--muted)' }}>Ім'я</div>
                    <div className="profile-field-value" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Максим</div>
                  </div>
                  <button className="btn-outline btn-sm" style={{ padding: '2px 6px', fontSize: '0.6rem', borderRadius: '4px' }}>Змінити</button>
                </div>

                <div className="profile-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div className="profile-field-label" style={{ fontSize: '0.55rem', color: 'var(--muted)' }}>Логін</div>
                    <div className="profile-field-value" style={{ fontSize: '0.75rem', fontWeight: 600 }}>@maxim_zap</div>
                  </div>
                  <button className="btn-outline btn-sm" style={{ padding: '2px 6px', fontSize: '0.6rem', borderRadius: '4px' }}>Змінити</button>
                </div>

                <div className="profile-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div className="profile-field-label" style={{ fontSize: '0.55rem', color: 'var(--muted)' }}>Унікальний ID</div>
                    <div className="profile-field-value" style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'monospace' }}>ZAP-X7H2K9</div>
                  </div>
                  <button className="btn-outline btn-sm" style={{ padding: '2px 6px', fontSize: '0.6rem', borderRadius: '4px' }}>Копіювати</button>
                </div>
              </div>

              <div className="profile-section" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px' }}>
                <div className="profile-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div className="profile-field-label" style={{ fontSize: '0.55rem', color: 'var(--muted)' }}>Двофакторна автентифікація</div>
                    <div className="profile-field-value" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                      {tfaEnabled ? 'Увімкнено (2FA активна)' : 'Вимкнено'}
                    </div>
                  </div>
                  <button 
                    className="btn-outline btn-sm" 
                    style={{ padding: '2px 6px', fontSize: '0.6rem', borderRadius: '4px', color: tfaEnabled ? 'var(--red)' : 'var(--gold)', borderColor: tfaEnabled ? 'rgba(192,57,43,.3)' : 'var(--border)' }}
                    onClick={() => setTfaEnabled(!tfaEnabled)}
                  >
                    {tfaEnabled ? 'Вимкнути' : 'Налаштувати'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStepShowcase = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="stepper-showcase-item">
            <div className="stepper-visual">
              <div className="stepper-card-mock" style={{ minWidth: '290px' }}>
                <div className="card-mock-title" style={{ marginBottom: '8px' }}>Реєстрація профілю</div>
                
                {registeredProfile === null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Ім'я</label>
                      <input 
                        type="text" 
                        value={regForm.name} 
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        placeholder="Олена" 
                        style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Логін</label>
                      <input 
                        type="text" 
                        value={regForm.login} 
                        onChange={(e) => setRegForm({ ...regForm, login: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') })}
                        placeholder="elena_w" 
                        style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>Пароль</label>
                      <input 
                        type="password" 
                        value={regForm.pass} 
                        onChange={(e) => setRegForm({ ...regForm, pass: e.target.value })}
                        placeholder="••••••" 
                        style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px' }}
                      />
                    </div>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', marginTop: '2px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={regForm.terms} 
                        onChange={(e) => setRegForm({ ...regForm, terms: e.target.checked })}
                        style={{ width: 'auto', cursor: 'pointer' }}
                      />
                      <span>Згоден з умовами</span>
                    </label>

                    <button 
                      className="btn btn-dark" 
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                        let id = '';
                        for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
                        setRegisteredProfile({ name: regForm.name || 'Олена', login: regForm.login || 'elena_w', uniqueId: 'ZAP-' + id });
                      }}
                      disabled={!regForm.terms || regForm.name.length < 2 || regForm.login.length < 3 || regForm.pass.length < 6}
                      style={{ padding: '8px', fontSize: '0.72rem', borderRadius: '8px', marginTop: '4px' }}
                    >
                      Зареєструватися
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--green)', fontSize: '1.5rem', lineHeight: '1' }}>🎉</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--green)' }}>Акаунт створено!</div>
                    
                    <div className="warm-panel" style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(180,140,60,.1)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Ім'я:</span>
                        <strong style={{ color: 'var(--ink)' }}>{registeredProfile.name}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Логін:</span>
                        <strong style={{ color: 'var(--ink)' }}>@{registeredProfile.login}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Ваш ID:</span>
                        <strong style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{registeredProfile.uniqueId}</strong>
                      </div>
                    </div>

                    <button 
                      className="btn-reset-preview" 
                      onClick={() => setRegisteredProfile(null)}
                      style={{ fontSize: '0.68rem', margin: '4px auto 0' }}
                    >
                      Створити інший
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="stepper-text-info">
              <h3>Крок 1. Створення профілю</h3>
              <p>Реєстрація займає менше хвилини. Ви можете використовувати акаунт Google або звичайну пошту.</p>
              <p>Після входу ви отримуєте свій унікальний ZAP-ID (видається рандомно у форматі ZAP-XXXXXX) та логін. Саме за ними друзі зможуть знаходити вас.</p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="stepper-showcase-item">
            <div className="stepper-visual">
              <div className="stepper-card-mock" style={{ minWidth: '290px' }}>
                <div className="card-mock-title" style={{ marginBottom: '8px' }}>Пошук друзів</div>
                
                <div className="friends-search-bar" style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  <div className="friends-search-input-wrap" style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid var(--border)', borderRadius: '6px', padding: '0 6px' }}>
                    <Icon name="magnifying-glass" size={12} color="var(--muted)"/>
                    <input 
                      placeholder="Введіть 'оля'..." 
                      value={stepperSearch} 
                      onChange={(e) => {
                        setStepperSearch(e.target.value);
                        setStepperRequestSent(false);
                      }}
                      style={{ border: 'none', padding: '4px 6px', fontSize: '0.75rem', width: '100%', outline: 'none' }}
                    />
                  </div>
                  <button className="btn btn-dark" style={{ padding: '4px 10px', fontSize: '0.7rem', width: 'auto', borderRadius: '6px' }}>Знайти</button>
                </div>

                {stepperSearch.toLowerCase().includes('оля') && (
                  <div className="search-result-card search-found" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'var(--card)', border: '1px solid var(--border)', marginBottom: '8px' }}>
                    <div className="avatar avatar-sm" style={{ width: '22px', height: '22px', fontSize: '0.65rem' }}>О</div>
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Ольга</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>@olya_fine • ZAP-M3K9W2</div>
                    </div>
                    {!stepperRequestSent ? (
                      <button className="btn btn-dark" style={{ padding: '4px 8px', fontSize: '0.62rem', width: 'auto', borderRadius: '4px' }} onClick={() => setStepperRequestSent(true)}>
                        Додати
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.62rem', color: 'var(--green)', fontWeight: 600 }}>Запит 📨</span>
                    )}
                  </div>
                )}

                <div className="friend-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="friend-row" style={{ padding: '6px 8px', borderRadius: '8px', background: '#fff', border: '1px solid rgba(0,0,0,.03)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      <div className="avatar avatar-sm" style={{ width: '22px', height: '22px', fontSize: '0.65rem' }}>Д</div>
                      <span className="friend-online-dot" style={{ width: '5px', height: '5px', border: '1px solid #fff' }}></span>
                    </div>
                    <div className="friend-row-info" style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div className="friend-row-name" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                        Денис
                        <span style={{ fontSize: '0.58rem', color: 'var(--muted)', marginLeft: '4px', fontFamily: 'monospace' }}>ZAP-F8H2D1</span>
                      </div>
                    </div>
                    <button className="friend-menu-btn" style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer' }}>
                      <Icon name="dots-three-vertical" size={14}/>
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: '8px', fontStyle: 'italic', textAlign: 'center' }}>Введіть "оля" для імітації пошуку!</p>
              </div>
            </div>
            <div className="stepper-text-info">
              <h3>Крок 2. Формування кола друзів</h3>
              <p>Додаток забезпечує високий рівень приватності: ви взаємодієте тільки з тими, кого самі додали в друзі.</p>
              <p>Знайдіть друзів за їхнім логіном чи ZAP-ID, надішліть їм запит і, щойно вони підтвердять його, ви зможете планувати спільні зустрічі в один клік.</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="stepper-showcase-item">
            <div className="stepper-visual">
              <div className="stepper-card-mock" style={{ minWidth: '290px' }}>
                <div className="card-mock-title" style={{ marginBottom: '8px' }}>Нове запрошення</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <div className="form-section" style={{ border: 'none', padding: 0, margin: 0, background: 'none' }}>
                    <div className="form-section-body" style={{ padding: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '4px' }}>
                        <label className="lbl" style={{ fontSize: '0.6rem', marginBottom: '2px' }}>Кому</label>
                        <input 
                          placeholder="Ім'я друга" 
                          value={stepperInviteTo}
                          onChange={(e) => setStepperInviteTo(e.target.value)}
                          style={{ padding: '4px 6px', fontSize: '0.72rem', borderRadius: '4px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '4px' }}>
                        <label className="lbl" style={{ fontSize: '0.6rem', marginBottom: '2px' }}>Повідомлення</label>
                        <textarea 
                          placeholder="Що планується?" 
                          value={stepperInviteMsg}
                          onChange={(e) => setStepperInviteMsg(e.target.value)}
                          style={{ padding: '4px 6px', fontSize: '0.72rem', borderRadius: '4px', minHeight: '40px', lineHeight: '1.3' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '4px' }}>
                        <label className="lbl" style={{ fontSize: '0.6rem', marginBottom: '2px' }}>Тип події</label>
                        <div className="type-picker" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {['coffee', 'date', 'birthday', 'cinema'].map((typeVal) => {
                            const em = typeVal === 'coffee' ? '☕' : typeVal === 'date' ? '🌹' : typeVal === 'birthday' ? '🎂' : '🎬';
                            return (
                              <button
                                key={typeVal}
                                type="button"
                                className={`type-option ${stepperInviteType === typeVal ? 'selected' : ''}`}
                                onClick={() => setStepperInviteType(typeVal)}
                                style={{ padding: '3px 6px', fontSize: '0.62rem', borderRadius: '4px' }}
                              >
                                <span>{em}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="datetime-row" style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        <div style={{ flex: 1 }}>
                          <label className="lbl" style={{ fontSize: '0.6rem', marginBottom: '2px' }}>Коли</label>
                          <input 
                            placeholder="Субота"
                            value={stepperInviteDate}
                            onChange={(e) => setStepperInviteDate(e.target.value)}
                            style={{ padding: '4px 6px', fontSize: '0.72rem', borderRadius: '4px' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="lbl" style={{ fontSize: '0.6rem', marginBottom: '2px' }}>Час</label>
                          <input 
                            placeholder="19:00"
                            value={stepperInviteTime}
                            onChange={(e) => setStepperInviteTime(e.target.value)}
                            style={{ padding: '4px 6px', fontSize: '0.72rem', borderRadius: '4px' }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label className="lbl" style={{ fontSize: '0.6rem', marginBottom: '2px' }}>Місце</label>
                        <input 
                          placeholder="Де зустрічаємось" 
                          value={stepperInvitePlace}
                          onChange={(e) => setStepperInvitePlace(e.target.value)}
                          style={{ padding: '4px 6px', fontSize: '0.72rem', borderRadius: '4px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="stepper-text-info">
              <h3>Крок 3. Створення запрошення</h3>
              <p>Забудьте про довгі узгодження деталей у групових чатах.</p>
              <p>Оберіть тип зустрічі, зручний день, час та місце. Надішліть запрошення конкретному другу або цілій компанії друзів — все створюється за кілька секунд.</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="stepper-showcase-item">
            <div className="stepper-visual">
              <div className="stepper-card-mock" style={{ minWidth: '290px' }}>
                <div className="card-mock-title" style={{ marginBottom: '8px' }}>Картка запрошення</div>
                
                <div className="invite-envelope" style={{ minHeight: 'auto', borderRadius: '16px', boxShadow: 'none', border: '1px solid var(--border)' }}>
                  <div className="envelope-top" style={{ padding: '12px 12px 16px', borderRadius: '16px 16px 0 0' }}>
                    <span className="envelope-emoji" style={{ fontSize: '1.25rem', animation: 'none' }}>🍕</span>
                    <div className="envelope-type" style={{ fontSize: '0.5rem', marginBottom: '4px' }}>Піца</div>
                    <div className="envelope-to" style={{ fontSize: '1.1rem', marginBottom: '2px' }}>Дмитро</div>
                    <div className="envelope-from" style={{ fontSize: '0.6rem', paddingBottom: '0' }}>від <strong>Олени</strong></div>
                  </div>

                  <div className="envelope-body" style={{ padding: '10px' }}>
                    <div className="msg-block" style={{ padding: '6px 8px', marginBottom: '8px', borderRadius: '8px' }}>
                      <p className="msg-text" style={{ fontSize: '0.8rem' }}>Зберемося на піцу в суботу ввечері?</p>
                    </div>

                    <div className="detail-chips" style={{ gap: '6px', marginBottom: '8px' }}>
                      <div className="detail-chip" style={{ padding: '6px 8px', borderRadius: '6px', gap: '6px' }}>
                        <span className="detail-chip-icon" style={{ fontSize: '0.8rem' }}><Icon name="calendar-blank" size={12}/></span>
                        <div>
                          <div className="detail-chip-label" style={{ fontSize: '0.5rem' }}>Дата</div>
                          <div className="detail-chip-value" style={{ fontSize: '0.7rem' }}>Субота, 19:00</div>
                        </div>
                      </div>
                      <div className="detail-chip" style={{ padding: '6px 8px', borderRadius: '6px', gap: '6px' }}>
                        <span className="detail-chip-icon" style={{ fontSize: '0.8rem' }}><Icon name="map-pin" size={12}/></span>
                        <div>
                          <div className="detail-chip-label" style={{ fontSize: '0.5rem' }}>Місце</div>
                          <div className="detail-chip-value" style={{ fontSize: '0.7rem' }}>Піцерія у центрі</div>
                        </div>
                      </div>
                    </div>

                    {stepperResponseState === 'pending' ? (
                      <div className="action-section-wrap" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
                        <div className="answer-wrap" style={{ gap: '4px' }}>
                          <button className="btn-yes" onClick={() => setStepperResponseState('accepted')} style={{ fontSize: '0.62rem', padding: '6px 4px', borderRadius: '6px' }}>
                            <Icon name="check" size={10}/> Так, я приду!
                          </button>
                          <button className="btn-no" onClick={() => setStepperResponseState('declined')} style={{ fontSize: '0.62rem', padding: '6px 4px', borderRadius: '6px' }}>
                            <Icon name="x" size={10}/> Ні
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="result-screen" style={{ padding: '8px 0 4px' }}>
                        {stepperResponseState === 'accepted' ? (
                          <>
                            <span className="result-icon" style={{ fontSize: '1.8rem', marginBottom: '4px' }}><Icon name="confetti" size={24}/></span>
                            <div className="result-title" style={{ color: 'var(--green)', fontSize: '0.9rem', marginBottom: '2px' }}>Ура! Так!</div>
                            <div className="result-sub" style={{ fontSize: '0.72rem' }}>Дмитро прийде!</div>
                          </>
                        ) : (
                          <>
                            <span className="result-icon" style={{ fontSize: '1.8rem', marginBottom: '4px' }}><Icon name="heart-crack" size={24}/></span>
                            <div className="result-title" style={{ color: 'var(--red)', fontSize: '0.9rem', marginBottom: '2px' }}>Відмовлено</div>
                            <div className="result-sub" style={{ fontSize: '0.72rem' }}>Дмитро не зможе.</div>
                          </>
                        )}
                        <button className="btn-ghost" onClick={() => setStepperResponseState('pending')} style={{ fontSize: '0.65rem', marginTop: '4px', padding: '2px 6px' }}>
                          Скинути
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="stepper-text-info">
              <h3>Крок 4. Чіткий результат</h3>
              <p>Отримувач бачить гарну картку з усіма деталями зустрічі та може відреагувати на неї в один тап.</p>
              <p>Ви миттєво отримуєте сповіщення з остаточним рішенням: згодою, відмовою або пропозицією перенести зустріч на інший час.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <main>
        
    <section className="hero" aria-label="Головний блок">

      {/**/}
      <div className="hero-content">
        <div className="hero-eyebrow">Безкоштовно &nbsp;·&nbsp; Українською</div>
        <h1 className="hero-title">
          Зустрічі,<br />які справді<br /><em>відбуваються</em>
        </h1>
        <p className="hero-desc">
          Надсилайте красиві запрошення з датою, часом і місцем. Отримуйте чіткі відповіді — без «ну давай якось» у чаті.
        </p>
        <div className="hero-ctas">
          <Link href="/login" className="btn-primary">
            Спробувати безкоштовно
          </Link>
          <a href="#features" className="btn-outline">
            Дізнатись більше
          </a>
        </div>
        <div className="hero-trust">
          <div className="trust-item">
            <span className="trust-icon"><i className="ph ph-check-circle"></i></span>
            Без кредитної картки
          </div>
          <div className="trust-item">
            <span className="trust-icon"><i className="ph ph-check-circle"></i></span>
            Без реклами
          </div>
          <div className="trust-item">
            <span className="trust-icon"><i className="ph ph-check-circle"></i></span>
            Реєстрація за хвилину
          </div>
        </div>
      </div>

      {/**/}
      <div className="hero-visual" aria-hidden="true">
        <div className="card-scene" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="card-ghost" style={{ inset: '8px -12px -8px 12px' }}></div>
          <div className="landing-demo-card" style={{ width: '100%', position: 'relative', zIndex: 2 }}>
            <div className="invite-envelope" style={{animation: 'float 4.5s ease-in-out infinite', margin: '0 auto', boxShadow: 'var(--shadow-lg)', width: '100%'}}>
              <div className="envelope-top">
                <span className="envelope-emoji">☕</span>
                <div className="envelope-type">Кава</div>
                <div className="envelope-to">Олена</div>
                <div className="envelope-from">від <strong>Максима</strong></div>
              </div>

              <div className="envelope-body">
                <div className="msg-block">
                  <p className="msg-text">Зустрінемось на каву? Давно не бачились, маю купу новин!</p>
                </div>

                <div className="detail-chips">
                  <div className="detail-chip">
                    <span className="detail-chip-icon"><Icon name="calendar-blank" size={16}/></span>
                    <div><div className="detail-chip-label">Дата</div><div className="detail-chip-value">Субота, 21 червня</div></div>
                  </div>
                  <div className="detail-chip">
                    <span className="detail-chip-icon"><Icon name="clock" size={16}/></span>
                    <div><div className="detail-chip-label">Час</div><div className="detail-chip-value">11:00</div></div>
                  </div>
                  <div className="detail-chip full">
                    <span className="detail-chip-icon"><Icon name="map-pin" size={16}/></span>
                    <div><div className="detail-chip-label">Місце</div><div className="detail-chip-value">Kyiv Coffee, Хрещатик</div></div>
                  </div>
                </div>

                <div className="action-section-wrap">
                  <div className="answer-wrap" style={{justifyContent: 'center', pointerEvents: 'none'}}>
                    <button className="btn-yes" tabIndex={-1}><Icon name="check" size={14}/> Так, я приду!</button>
                    <button className="btn-reschedule" tabIndex={-1}><Icon name="calendar-blank" size={14}/> Перенести</button>
                    <button className="btn-no" tabIndex={-1}><Icon name="x" size={14}/> Ні, не зможу</button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>


    {/**/}
    <section className="section-wrap features" id="features" aria-label="Можливості">
      <div className="section-head" data-reveal>
        <span className="eyebrow">Можливості</span>
        <h2 className="section-title">Все для зручних домовленостей</h2>
        <p className="section-desc">
          Більше ніяких «ну давай колись» в месенджерах. Зрозумілий формат — запрошення, відповідь, зустріч.
        </p>
      </div>
      
      <div className="features-explorer">
        <div className="explorer-tabs">
          <button 
            className={`explorer-tab-btn ${activeFeature === 0 ? 'active' : ''}`}
            onClick={() => setActiveFeature(0)}
          >
            <div className="explorer-tab-icon">{FEATURE_ICONS[0]}</div>
            <div style={{ textAlign: 'left' }}>
              <div className="explorer-tab-title">Особисті запрошення</div>
              <div className="explorer-tab-desc">Персональні картки з датою, часом та місцем зустрічі.</div>
            </div>
          </button>
          
          <button 
            className={`explorer-tab-btn ${activeFeature === 1 ? 'active' : ''}`}
            onClick={() => setActiveFeature(1)}
          >
            <div className="explorer-tab-icon">{FEATURE_ICONS[1]}</div>
            <div style={{ textAlign: 'left' }}>
              <div className="explorer-tab-title">Групові зустрічі</div>
              <div className="explorer-tab-desc">Запрошуйте кількох людей або компанії з відстеженням відповідей.</div>
            </div>
          </button>

          <button 
            className={`explorer-tab-btn ${activeFeature === 2 ? 'active' : ''}`}
            onClick={() => setActiveFeature(2)}
          >
            <div className="explorer-tab-icon">{FEATURE_ICONS[2]}</div>
            <div style={{ textAlign: 'left' }}>
              <div className="explorer-tab-title">Миттєві сповіщення</div>
              <div className="explorer-tab-desc">Push-повідомлення про відповіді або пропозиції перенесення.</div>
            </div>
          </button>

          <button 
            className={`explorer-tab-btn ${activeFeature === 3 ? 'active' : ''}`}
            onClick={() => setActiveFeature(3)}
          >
            <div className="explorer-tab-icon">{FEATURE_ICONS[3]}</div>
            <div style={{ textAlign: 'left' }}>
              <div className="explorer-tab-title">Список друзів</div>
              <div className="explorer-tab-desc">Зберігайте контакти та запрошуйте друзів за одним кліком.</div>
            </div>
          </button>

          <button 
            className={`explorer-tab-btn ${activeFeature === 4 ? 'active' : ''}`}
            onClick={() => setActiveFeature(4)}
          >
            <div className="explorer-tab-icon">{FEATURE_ICONS[4]}</div>
            <div style={{ textAlign: 'left' }}>
              <div className="explorer-tab-title">Перенесення</div>
              <div className="explorer-tab-desc">Можливість швидко домовитися про альтернативний час.</div>
            </div>
          </button>

          <button 
            className={`explorer-tab-btn ${activeFeature === 5 ? 'active' : ''}`}
            onClick={() => setActiveFeature(5)}
          >
            <div className="explorer-tab-icon">{FEATURE_ICONS[5]}</div>
            <div style={{ textAlign: 'left' }}>
              <div className="explorer-tab-title">Приватність і безпека</div>
              <div className="explorer-tab-desc">Шифрування, 2FA та повний контроль видимості профілю.</div>
            </div>
          </button>
        </div>

        <div className="explorer-preview">
          {renderFeaturePreview()}
        </div>
      </div>
    </section>


    {/**/}
    <section className="how-timeline-scroll-container" ref={timelineRef} id="how" aria-label="Як це працює">
      <div className="how-timeline-sticky-wrapper">
        <div className="section-wrap" style={{ paddingBottom: 0, paddingTop: '2rem' }}>
          <div className="section-head" data-reveal>
            <span className="eyebrow">Як це працює</span>
            <h2 className="section-title">Від ідеї до зустрічі — чотири кроки</h2>
          </div>

          <div className="how-timeline-container">
            <div className="how-timeline-line-bg">
              <div className="how-timeline-line-fill" style={{ width: `${(activeStep / 3) * 100}%` }}></div>
            </div>
            
            <button className={`how-timeline-node ${activeStep === 0 ? 'active' : ''}`} onClick={() => handleStepClick(0)}>
              <div className="how-timeline-circle">1</div>
              <span className="how-timeline-label">Реєструєшся</span>
            </button>

            <button className={`how-timeline-node ${activeStep === 1 ? 'active' : ''}`} onClick={() => handleStepClick(1)}>
              <div className="how-timeline-circle">2</div>
              <span className="how-timeline-label">Додаєш друзів</span>
            </button>

            <button className={`how-timeline-node ${activeStep === 2 ? 'active' : ''}`} onClick={() => handleStepClick(2)}>
              <div className="how-timeline-circle">3</div>
              <span className="how-timeline-label">Надсилаєш</span>
            </button>

            <button className={`how-timeline-node ${activeStep === 3 ? 'active' : ''}`} onClick={() => handleStepClick(3)}>
              <div className="how-timeline-circle">4</div>
              <span className="how-timeline-label">Результат</span>
            </button>
          </div>

          <div className="stepper-showcase-container">
            {renderStepShowcase()}
          </div>
        </div>
      </div>
    </section>


    {/**/}
    <section className="section-wrap types-section" aria-label="Типи подій">
      <div className="section-head" data-reveal>
        <span className="eyebrow">Типи подій</span>
        <h2 className="section-title">На будь-який привід</h2>
        <p className="section-desc">
          Від ранкової кави до дня народження — обери формат і надсилай запрошення.
        </p>
      </div>

      <div className="event-playground-wrap">
        <div className="event-types-left">
          {EVENT_TYPES.map((type) => (
            <button 
              key={type.id} 
              className={`type-pill-interactive ${selectedType === type.id ? 'active' : ''}`}
              style={{
                '--hover-bg': type.bg,
                '--hover-border': type.border
              } as React.CSSProperties}
              onClick={() => setSelectedType(type.id)}
            >
              <span className="type-emoji">{type.emoji}</span>
              <span className="type-name">{type.name}</span>
            </button>
          ))}
        </div>
        
        <div className="event-preview-right">
          <div className="preview-invite-envelope" style={{ background: selectedTypeData.bg, border: `1.5px solid ${selectedTypeData.border}` }}>
            <div className="envelope-top-interactive">
              <span className="envelope-emoji">{selectedTypeData.emoji}</span>
              <div className="envelope-type">{selectedTypeData.name}</div>
              <div className="envelope-to">Олена</div>
              <div className="envelope-from">від <strong>Максима</strong></div>
            </div>

            <div className="envelope-body-interactive">
              <div className="msg-block-interactive">
                <p className="msg-text-interactive">{selectedTypeData.text}</p>
              </div>

              <div className="detail-chips-interactive">
                <div className="detail-chip-interactive">
                  <span className="detail-chip-icon"><Icon name="calendar-blank" size={16}/></span>
                  <div>
                    <div className="detail-chip-label">Дата</div>
                    <div className="detail-chip-value">{selectedTypeData.date}</div>
                  </div>
                </div>
                <div className="detail-chip-interactive">
                  <span className="detail-chip-icon"><Icon name="clock" size={16}/></span>
                  <div>
                    <div className="detail-chip-label">Час</div>
                    <div className="detail-chip-value">{selectedTypeData.time}</div>
                  </div>
                </div>
                <div className="detail-chip-interactive full">
                  <span className="detail-chip-icon"><Icon name="map-pin" size={16}/></span>
                  <div>
                    <div className="detail-chip-label">Місце</div>
                    <div className="detail-chip-value">{selectedTypeData.place}</div>
                  </div>
                </div>
              </div>

              <div className="action-section-wrap">
                <div className="answer-wrap" style={{ gap: '6px', justifyContent: 'center', pointerEvents: 'none', width: '100%' }}>
                  <button className="btn-yes" tabIndex={-1}><Icon name="check" size={14}/> Так, я приду!</button>
                  <button className="btn-reschedule" tabIndex={-1}><Icon name="calendar-blank" size={14}/> Перенести</button>
                  <button className="btn-no" tabIndex={-1}><Icon name="x" size={14}/> Ні, не зможу</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>


    {/**/}
    <section className="cta-section" aria-label="Приєднатись">
      <div className="cta-blob cta-blob-1"></div>
      <div className="cta-blob cta-blob-2"></div>
      <div className="cta-inner">
        <div className="cta-eyebrow" data-reveal>Безкоштовно навжди</div>
        <h2 className="cta-title" data-reveal>
          Почни зустрічатись<br /><em>простіше сьогодні</em>
        </h2>
        <p className="cta-desc" data-reveal>
          Без кредитної картки, без реклами, повністю українською. Тільки ти і твої зустрічі.
        </p>
        <a href="#"  className="btn-cta" data-reveal>
          Приєднатись безкоштовно →
        </a>
        <p className="cta-small" data-reveal>Реєстрація займає менше хвилини</p>
      </div>
    </section>
  
      </main>
      <footer role="contentinfo">
        <Link href="/" className="footer-logo">
          Запрошення <span className="footer-star">✦</span>
        </Link>
        <nav className="footer-links" aria-label="Посилання в футері">
          <Link href="/about">Про додаток</Link>
          <Link href="/privacy">Конфіденційність</Link>
          <Link href="/terms">Умови використання</Link>
        </nav>
        <p className="footer-copy">© 2026 Запрошення ✦. Всі права захищені.</p>
      </footer>
    </>
  );
}
