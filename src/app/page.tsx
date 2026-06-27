/* eslint-disable react/no-unescaped-entities */

'use client';
import Link from 'next/link';
import './landing.css';
import { useEffect, useState } from 'react';
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
  const [notifications, setNotifications] = useState<Array<{ id: number; text: string; time: string }>>([
    { id: 1, text: '🔔 Максим запросив вас на зустріч "Кава"', time: 'Щойно' },
    { id: 2, text: '💬 Ольга пропонує перенести зустріч "Кіно" на 19:30', time: '5 хв тому' }
  ]);
  const [friendsList, setFriendsList] = useState([
    { name: 'Денис', tag: 'denys', added: true },
    { name: 'Ольга', tag: 'olga', added: true }
  ]);
  const [friendSearch, setFriendSearch] = useState('');
  const [rescheduleAccepted, setRescheduleAccepted] = useState(false);
  const [privacyToggles, setPrivacyToggles] = useState({ tfa: false, private: false, hide: false });

  // How it works state
  const [activeStep, setActiveStep] = useState(0);
  const [isHoveredStep, setIsHoveredStep] = useState(false);
  
  // Stepper interactive states
  const [stepperLogin, setStepperLogin] = useState('');
  const [stepperSearch, setStepperSearch] = useState('');
  const [stepperRequestSent, setStepperRequestSent] = useState(false);
  const [stepperInviteType, setStepperInviteType] = useState('☕ Кава');
  const [stepperInviteDate, setStepperInviteDate] = useState('Субота');
  const [stepperResponseState, setStepperResponseState] = useState<'pending' | 'accepted'>('pending');

  useEffect(() => {
    if (activeStep === 3) {
      setStepperResponseState('pending');
      const timer = setTimeout(() => {
        setStepperResponseState('accepted');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [activeStep]);

  useEffect(() => {
    if (isHoveredStep) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHoveredStep]);

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
            <div className="phone-header">
              <div className="phone-notch"></div>
              <div className="phone-status">12:00</div>
            </div>
            <div className="phone-content">
              <div className="preview-card-wrap">
                <div className="preview-card-emoji">☕</div>
                <div className="preview-card-title">Кава</div>
                <div className="preview-card-info">
                  <p style={{ margin: '0 0 4px' }}><strong>Коли:</strong> Субота, 15:00</p>
                  <p style={{ margin: 0 }}><strong>Де:</strong> Kyiv Coffee</p>
                </div>
                <div className="preview-card-message">
                  "Зустрінемось на каву? Маю купу новин!"
                </div>
                
                {inviteStatus === null ? (
                  <div className="preview-card-actions">
                    <button className="btn-yes-preview" onClick={() => setInviteStatus('yes')}>Так, приду! ✅</button>
                    <button className="btn-no-preview" onClick={() => setInviteStatus('no')}>Ні ❌</button>
                  </div>
                ) : inviteStatus === 'yes' ? (
                  <div className="preview-card-status-success">
                    <p style={{ margin: 0 }}>Ви приймете участь! 🎉</p>
                    <button className="btn-reset-preview" onClick={() => setInviteStatus(null)}>Скинути</button>
                  </div>
                ) : (
                  <div className="preview-card-status-declined">
                    <p style={{ margin: 0 }}>Ви відхилили зустріч ❌</p>
                    <button className="btn-reset-preview" onClick={() => setInviteStatus(null)}>Скинути</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="phone-screen">
            <div className="phone-header">
              <div className="phone-notch"></div>
              <div className="phone-status">12:00</div>
            </div>
            <div className="phone-content">
              <div className="preview-group-wrap">
                <div>
                  <div className="preview-group-title">🍕 Настільні ігри</div>
                  <div className="preview-group-subtitle">Учасники ({joinedGroup ? 4 : 3})</div>
                  <div className="preview-attendees-list">
                    <div className="attendee-item">
                      <div className="attendee-avatar">О</div>
                      <div className="attendee-info">
                        <span className="attendee-name">Олександр</span>
                        <span className="attendee-status status-yes">Прийде ✅</span>
                      </div>
                    </div>
                    <div className="attendee-item">
                      <div className="attendee-avatar">М</div>
                      <div className="attendee-info">
                        <span className="attendee-name">Марія</span>
                        <span className="attendee-status status-pending">Думає ⏳</span>
                      </div>
                    </div>
                    <div className="attendee-item">
                      <div className="attendee-avatar">І</div>
                      <div className="attendee-info">
                        <span className="attendee-name">Ірина</span>
                        <span className="attendee-status status-pending">Думає ⏳</span>
                      </div>
                    </div>
                    {joinedGroup && (
                      <div className="attendee-item attendee-added-anim">
                        <div className="attendee-avatar attendee-avatar-user">Ви</div>
                        <div className="attendee-info">
                          <span className="attendee-name">Ви</span>
                          <span className="attendee-status status-yes">Прийдете ✅</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!joinedGroup ? (
                  <button className="btn-join-group" onClick={() => setJoinedGroup(true)}>
                    Приєднатися до групи
                  </button>
                ) : (
                  <button className="btn-leave-group" onClick={() => setJoinedGroup(false)}>
                    Скасувати участь
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="phone-screen">
            <div className="phone-header">
              <div className="phone-notch"></div>
              <div className="phone-status">12:00</div>
            </div>
            <div className="phone-content notification-content">
              <div className="lockscreen-date">Субота, 27 червня</div>
              <div className="lockscreen-time">12:00</div>
              
              <div className="notifications-list-container">
                {notifications.map((notif) => (
                  <div key={notif.id} className="notification-card-item">
                    <div className="notif-header">
                      <span className="notif-app">Запрошення ✦</span>
                      <span className="notif-time">{notif.time}</span>
                    </div>
                    <div className="notif-body">{notif.text}</div>
                  </div>
                ))}
              </div>

              <button className="btn-trigger-notif" onClick={() => {
                const newId = notifications.length + 1;
                setNotifications([
                  { id: newId, text: '🔔 Дмитро погодився на вашу пропозицію зустрічі', time: 'Щойно' },
                  ...notifications
                ]);
              }}>
                Надіслати сповіщення
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="phone-screen">
            <div className="phone-header">
              <div className="phone-notch"></div>
              <div className="phone-status">12:00</div>
            </div>
            <div className="phone-content">
              <div className="preview-friends-wrap">
                <div className="friends-search-box">
                  <input 
                    type="text" 
                    placeholder="Пошук за логіном..." 
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    className="friends-search-input"
                  />
                </div>
                
                <div className="friends-list">
                  {friendsList
                    .filter(f => f.name.toLowerCase().includes(friendSearch.toLowerCase()) || f.tag.toLowerCase().includes(friendSearch.toLowerCase()))
                    .map((friend, idx) => (
                      <div key={idx} className="friend-row-item">
                        <div className="friend-avatar">{friend.name[0]}</div>
                        <div className="friend-details">
                          <span className="friend-name">{friend.name}</span>
                          <span className="friend-tag">@{friend.tag}</span>
                        </div>
                        <button className="friend-invite-action" style={{ border: 'none' }}>Запросити</button>
                      </div>
                    ))
                  }
                </div>

                {friendSearch.toLowerCase() === 'andrii' && !friendsList.some(f => f.tag === 'andrii') && (
                  <div className="friend-search-found">
                    <div className="friend-row-item">
                      <div className="friend-avatar friend-avatar-new">А</div>
                      <div className="friend-details">
                        <span className="friend-name">Андрій</span>
                        <span className="friend-tag">@andrii</span>
                      </div>
                      <button className="btn-add-friend-action" onClick={() => {
                        setFriendsList([...friendsList, { name: 'Андрій', tag: 'andrii', added: true }]);
                        setFriendSearch('');
                      }}>
                        Додати
                      </button>
                    </div>
                  </div>
                )}

                <p className="friends-hint">Введіть "andrii" для додавання</p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="phone-screen">
            <div className="phone-header">
              <div className="phone-notch"></div>
              <div className="phone-status">12:00</div>
            </div>
            <div className="phone-content">
              <div className="preview-card-wrap">
                <div className="preview-card-emoji">🎬</div>
                <div className="preview-card-title">Кіно</div>
                <div className="preview-card-info">
                  <p style={{ margin: '0 0 4px' }}><strong>Коли:</strong> {!rescheduleAccepted ? 'Субота, 18:00' : 'Неділя, 19:30'}</p>
                  <p style={{ margin: 0 }}><strong>Де:</strong> Multiplex</p>
                </div>
                
                {!rescheduleAccepted ? (
                  <div className="reschedule-proposal-alert">
                    <div className="proposal-badge">Запит перенесення</div>
                    <p style={{ margin: '4px 0 8px' }}>Пропонують: <strong>Неділя, 19:30</strong></p>
                    <button className="btn-accept-proposal" onClick={() => setRescheduleAccepted(true)}>
                      Прийняти новий час
                    </button>
                  </div>
                ) : (
                  <div className="reschedule-success-alert">
                    <div className="success-badge">Успішно змінено! 🎉</div>
                    <p style={{ margin: '4px 0 8px' }}>Час змінено на <strong>Неділя, 19:30</strong></p>
                    <button className="btn-reset-reschedule" onClick={() => setRescheduleAccepted(false)}>
                      Скинути
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="phone-screen">
            <div className="phone-header">
              <div className="phone-notch"></div>
              <div className="phone-status">12:00</div>
            </div>
            <div className="phone-content">
              <div className="preview-security-wrap">
                <div className="security-status-badge">
                  <span className="security-status-icon">🛡️</span>
                  <span className="security-status-text">
                    Безпека: {' '}
                    <strong>
                      {(!privacyToggles.tfa && !privacyToggles.private && !privacyToggles.hide) && 'Базова'}
                      {((privacyToggles.tfa || privacyToggles.private || privacyToggles.hide) && !(privacyToggles.tfa && privacyToggles.private && privacyToggles.hide)) && 'Покращена ⚡'}
                      {(privacyToggles.tfa && privacyToggles.private && privacyToggles.hide) && 'Максимальна! 🌟'}
                    </strong>
                  </span>
                </div>
                
                <div className="security-toggles">
                  <div className="security-toggle-row">
                    <div className="toggle-label">
                      <span>Двофакторна автентифікація</span>
                      <span className="toggle-desc">OTP коди при вході</span>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={privacyToggles.tfa}
                        onChange={(e) => setPrivacyToggles({...privacyToggles, tfa: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="security-toggle-row">
                    <div className="toggle-label">
                      <span>Приватний профіль</span>
                      <span className="toggle-desc">Тільки для ваших друзів</span>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={privacyToggles.private}
                        onChange={(e) => setPrivacyToggles({...privacyToggles, private: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="security-toggle-row">
                    <div className="toggle-label">
                      <span>Приховати з пошуку</span>
                      <span className="toggle-desc">Пошук тільки за ZAP-ID</span>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={privacyToggles.hide}
                        onChange={(e) => setPrivacyToggles({...privacyToggles, hide: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
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
              <div className="stepper-card-mock">
                <div className="card-mock-title">Створення профілю</div>
                <div className="card-mock-input-group">
                  <label>Ваш логін</label>
                  <input 
                    type="text" 
                    value={stepperLogin} 
                    onChange={(e) => setStepperLogin(e.target.value.replace(/[^a-z0-9._]/gi, '').toLowerCase())}
                    placeholder="наприклад, ivan" 
                    maxLength={15}
                    className="stepper-input"
                  />
                </div>
                <div className="card-mock-result">
                  <span>Ваш унікальний ZAP-ID:</span>
                  <strong>{stepperLogin ? `ZAP-${stepperLogin.toUpperCase()}-82` : 'ZAP-LOGIN-82'}</strong>
                </div>
                <p className="card-mock-note">Спробуйте ввести свій логін вище!</p>
              </div>
            </div>
            <div className="stepper-text-info">
              <h3>Крок 1. Швидкий старт</h3>
              <p>Реєстрація забирає менше хвилини. Ви можете використовувати акаунт Google або звичайну пошту.</p>
              <p>Після входу ви отримуєте свій унікальний ZAP-ID та логін. Саме за ними ваші друзі зможуть легко знаходити вас у пошуку, щоб надсилати запрошення.</p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="stepper-showcase-item">
            <div className="stepper-visual">
              <div className="stepper-card-mock">
                <div className="card-mock-title">Пошук та додавання</div>
                <div className="card-mock-input-group">
                  <input 
                    type="text" 
                    value={stepperSearch} 
                    onChange={(e) => {
                      setStepperSearch(e.target.value);
                      setStepperRequestSent(false);
                    }}
                    placeholder="Введіть 'оля'..." 
                    className="stepper-input"
                  />
                </div>
                {stepperSearch.toLowerCase().includes('оля') ? (
                  <div className="stepper-search-result-item">
                    <div className="search-res-info">
                      <strong>Ольга</strong>
                      <span>@olya_fine</span>
                    </div>
                    {!stepperRequestSent ? (
                      <button className="btn-send-req" onClick={() => setStepperRequestSent(true)}>
                        Додати друга
                      </button>
                    ) : (
                      <span className="req-sent-badge">Запит надіслано 📨</span>
                    )}
                  </div>
                ) : (
                  <div className="stepper-search-placeholder">
                    Введіть "оля" для пошуку
                  </div>
                )}
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
              <div className="stepper-card-mock">
                <div className="card-mock-title">Нове запрошення</div>
                <div className="stepper-form-simulate">
                  <div className="simulate-row">
                    <label>Тип події:</label>
                    <select value={stepperInviteType} onChange={(e) => setStepperInviteType(e.target.value)}>
                      <option value="☕ Кава">☕ Кава</option>
                      <option value="🍕 Піца">🍕 Піца</option>
                      <option value="🎬 Кіно">🎬 Кіно</option>
                      <option value="🌹 Побачення">🌹 Побачення</option>
                    </select>
                  </div>
                  <div className="simulate-row">
                    <label>День тижня:</label>
                    <select value={stepperInviteDate} onChange={(e) => setStepperInviteDate(e.target.value)}>
                      <option value="Сьогодні">Сьогодні</option>
                      <option value="Завтра">Завтра</option>
                      <option value="Субота">Субота</option>
                      <option value="Неділя">Неділя</option>
                    </select>
                  </div>
                </div>
                <div className="draft-card-preview">
                  <div className="draft-header">Запрошення на: <strong>{stepperInviteType}</strong></div>
                  <div className="draft-body" style={{ margin: '4px 0 0' }}>Коли: <strong>{stepperInviteDate}</strong></div>
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
              <div className="stepper-card-mock">
                <div className="card-mock-title">Відповідь друга</div>
                <div className="response-card-demo">
                  <div className="res-card-top">
                    <span className="res-emoji">🍕</span>
                    <span className="res-title">Піца</span>
                  </div>
                  <div className="res-card-detail">Коли: Субота, 19:00</div>
                  <div className="res-card-status-bar">
                    Статус: {' '}
                    {stepperResponseState === 'pending' ? (
                      <span className="status-pending-pill">Друг думає ⏳</span>
                    ) : (
                      <span className="status-accepted-pill">Ольга прийде! ✅</span>
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
    <section className="section-wrap" id="how" aria-label="Як це працює">
      <div className="section-head" data-reveal>
        <span className="eyebrow">Як це працює</span>
        <h2 className="section-title">Від ідеї до зустрічі — чотири кроки</h2>
      </div>

      <div className="how-timeline-container" onMouseEnter={() => setIsHoveredStep(true)} onMouseLeave={() => setIsHoveredStep(false)}>
        <div className="how-timeline-line-bg">
          <div className="how-timeline-line-fill" style={{ width: `${(activeStep / 3) * 100}%` }}></div>
        </div>
        
        <button className={`how-timeline-node ${activeStep === 0 ? 'active' : ''}`} onClick={() => { setActiveStep(0); setIsHoveredStep(true); }}>
          <div className="how-timeline-circle">1</div>
          <span className="how-timeline-label">Реєструєшся</span>
        </button>

        <button className={`how-timeline-node ${activeStep === 1 ? 'active' : ''}`} onClick={() => { setActiveStep(1); setIsHoveredStep(true); }}>
          <div className="how-timeline-circle">2</div>
          <span className="how-timeline-label">Додаєш друзів</span>
        </button>

        <button className={`how-timeline-node ${activeStep === 2 ? 'active' : ''}`} onClick={() => { setActiveStep(2); setIsHoveredStep(true); }}>
          <div className="how-timeline-circle">3</div>
          <span className="how-timeline-label">Надсилаєш</span>
        </button>

        <button className={`how-timeline-node ${activeStep === 3 ? 'active' : ''}`} onClick={() => { setActiveStep(3); setIsHoveredStep(true); }}>
          <div className="how-timeline-circle">4</div>
          <span className="how-timeline-label">Результат</span>
        </button>
      </div>

      <div className="stepper-showcase-container" onMouseEnter={() => setIsHoveredStep(true)} onMouseLeave={() => setIsHoveredStep(false)}>
        {renderStepShowcase()}
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

              <div className="action-section-wrap-interactive">
                <div className="answer-wrap-interactive" style={{ pointerEvents: 'none' }}>
                  <button className="btn-yes-interactive"><Icon name="check" size={14}/> Так, приду!</button>
                  <button className="btn-reschedule-interactive"><Icon name="calendar-blank" size={14}/> Перенести</button>
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
