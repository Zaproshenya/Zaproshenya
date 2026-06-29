/* eslint-disable react/no-unescaped-entities */

'use client';
import Link from 'next/link';
import './landing.css';
import { useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { LandingPageConfig } from '@/lib/landing-pages';

const DEFAULT_CONFIG: LandingPageConfig = {
  slug: '',
  metaTitle: 'Запрошення ✦ Безкоштовне створення запрошень',
  metaDesc: 'Надсилайте красиві запрошення з датою, часом і місцем. Отримуйте чіткі відповіді — без «ну давай якось» у чаті.',
  heroTitlePrefix: 'Безкоштовне\nстворення',
  heroTitleHighlight: 'запрошень',
  heroDesc: 'Надсилайте красиві запрошення з датою, часом і місцем. Отримуйте чіткі відповіді — без «ну давай якось» у чаті.',
  emoji: '✉️',
  eventType: 'Зустріч',
  demoText: 'Зустрінемось на каву? Давно не бачились, маю купу новин!',
  demoLabel: 'Дата',
  demoValue: 'Субота, 21 червня',
};

export default function LandingPage({ config }: { config?: LandingPageConfig }) {
  const cfg = config || DEFAULT_CONFIG;
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

  return (
    <>
      <main>
        
    <section className="hero" aria-label="Головний блок">

      {/**/}
      <div className="hero-content">
        <div className="hero-eyebrow">Безкоштовно &nbsp;·&nbsp; Українською</div>
        <h1 className="hero-title">
          {cfg.heroTitlePrefix.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < cfg.heroTitlePrefix.split('\n').length - 1 && <br />}
            </span>
          ))}
          <br />
          <em>{cfg.heroTitleHighlight}</em>
        </h1>
        <p className="hero-desc">
          {cfg.heroDesc}
        </p>
        <div className="hero-ctas">
          <Link href="/login" className="btn-landing-primary">
            Спробувати безкоштовно
          </Link>
          <a href="#features" className="btn-landing-outline">
            Дізнатись більше
          </a>
          <a href="https://send.monobank.ua/jar/5se11GGQ5i" target="_blank" rel="noreferrer" className="btn-landing-support">
            <Icon name="heart" size={16}/> Підтримати проєкт
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
                <span className="envelope-emoji">{cfg.emoji}</span>
                <div className="envelope-type">{cfg.eventType}</div>
                <div className="envelope-to">Олена</div>
                <div className="envelope-from">від <strong>Максима</strong></div>
              </div>

              <div className="envelope-body">
                <div className="msg-block">
                  <p className="msg-text">{cfg.demoText}</p>
                </div>

                <div className="detail-chips">
                  <div className="detail-chip">
                    <span className="detail-chip-icon"><Icon name="calendar-blank" size={16}/></span>
                    <div><div className="detail-chip-label">{cfg.demoLabel}</div><div className="detail-chip-value">{cfg.demoValue}</div></div>
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
      <div className="features-grid" style={{"maxWidth":"1100px","margin":"0 auto"}}>
        <div className="feat-card" data-reveal data-delay="1">
          <div className="feat-icon"><i className="ph ph-envelope-simple"></i></div>
          <div className="feat-title">Особисті запрошення</div>
          <p className="feat-desc">Надсилайте персональні запрошення з датою, часом та місцем зустрічі. Отримуйте підтвердження або пропозицію перенесення — все в одному місці.</p>
        </div>
        <div className="feat-card" data-reveal data-delay="2">
          <div className="feat-icon"><i className="ph ph-users"></i></div>
          <div className="feat-title">Групові зустрічі</div>
          <p className="feat-desc">Запрошуйте кількох людей одразу. Публічні та приватні групи, відстеження відповіді кожного учасника в реальному часі.</p>
        </div>
        <div className="feat-card" data-reveal data-delay="3">
          <div className="feat-icon"><i className="ph ph-bell-ringing"></i></div>
          <div className="feat-title">Миттєві сповіщення</div>
          <p className="feat-desc">Push-сповіщення та повідомлення в додатку. Дізнавайтесь відразу, коли хтось відповів на ваше запрошення або запропонував інший час.</p>
        </div>
        <div className="feat-card" data-reveal data-delay="1">
          <div className="feat-icon"><i className="ph ph-user"></i></div>
          <div className="feat-title">Список друзів</div>
          <p className="feat-desc">Зберігайте контакти та запрошуйте за одним кліком. Пошук за ZAP-ID або логіном.</p>
        </div>
        <div className="feat-card" data-reveal data-delay="2">
          <div className="feat-icon"><i className="ph ph-clock-countdown"></i></div>
          <div className="feat-title">Перенесення</div>
          <p className="feat-desc">Не виходить у призначений час? Запропонуй альтернативний варіант прямо в запрошенні — без зайвих переписок.</p>
        </div>
        <div className="feat-card" data-reveal data-delay="3">
          <div className="feat-icon"><i className="ph ph-shield-check"></i></div>
          <div className="feat-title">Приватність і безпека</div>
          <p className="feat-desc">Шифрування AES-GCM, гнучкі налаштування видимості. Самостійно обирайте, хто може бачити ваші запрошення.</p>
        </div>
      </div>
    </section>


    {/**/}
    <section className="section-wrap" id="how" aria-label="Як це працює">
      <div className="section-head" data-reveal>
        <span className="eyebrow">Як це працює</span>
        <h2 className="section-title">Від ідеї до зустрічі — чотири кроки</h2>
      </div>
      <div className="steps-grid">
        <div className="step" data-reveal data-delay="1">
          <div className="step-num">1</div>
          <div className="step-title">Реєструєшся</div>
          <p className="step-desc">Створи акаунт за хвилину. Отримай унікальний ZAP-ID, за яким тебе можна знайти.</p>
        </div>
        <div className="step" data-reveal data-delay="2">
          <div className="step-num">2</div>
          <div className="step-title">Додаєш друзів</div>
          <p className="step-desc">Знаходь людей за логіном або ZAP-ID. Надсилай запити та приймай друзів.</p>
        </div>
        <div className="step" data-reveal data-delay="3">
          <div className="step-num">3</div>
          <div className="step-title">Надсилаєш запрошення</div>
          <p className="step-desc">Вибери тип зустрічі, дату, час і місце. Готово — одним натисканням.</p>
        </div>
        <div className="step" data-reveal data-delay="4">
          <div className="step-num">4</div>
          <div className="step-title">Отримуєш відповідь</div>
          <p className="step-desc">Друг приймає, відхиляє або пропонує інший час. Чітко і зрозуміло — без зайвих слів.</p>
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
      <div className="types-grid" data-reveal>
        <div className="type-pill">
          <span className="type-emoji">🌹</span>
          <span className="type-name">Побачення</span>
        </div>
        <div className="type-pill">
          <span className="type-emoji">🍃</span>
          <span className="type-name">Прогулянка</span>
        </div>
        <div className="type-pill">
          <span className="type-emoji">🎂</span>
          <span className="type-name">День народження</span>
        </div>
        <div className="type-pill">
          <span className="type-emoji">🥂</span>
          <span className="type-name">Вечірка</span>
        </div>
        <div className="type-pill">
          <span className="type-emoji">🎬</span>
          <span className="type-name">Кіно</span>
        </div>
        <div className="type-pill">
          <span className="type-emoji">☕</span>
          <span className="type-name">Кава</span>
        </div>
        <div className="type-pill">
          <span className="type-emoji">✈️</span>
          <span className="type-name">Подорож</span>
        </div>
        <div className="type-pill">
          <span className="type-emoji">✨</span>
          <span className="type-name">Інше</span>
        </div>
      </div>
    </section>


    <section className="section-wrap support-section" id="support" aria-label="Підтримати проєкт" style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center' }}>
      <div className="section-head" data-reveal style={{ marginBottom: '20px' }}>
        <span className="eyebrow" style={{ color: 'var(--red)' }}>✦ Підтримка ✦</span>
        <h2 className="section-title" style={{ fontSize: '1.8rem', marginTop: '10px' }}>Сподобався проєкт?</h2>
        <p className="section-desc" style={{ maxWidth: '600px', margin: '10px auto' }}>
          «Запрошення» — це повністю безкоштовний некомерційний додаток без реклами та платних підписок. Ви можете підтримати розвиток проєкту добровільним донатом через Monobank.
        </p>
      </div>
      <div data-reveal data-delay="1" style={{ marginTop: '24px' }}>
        <a href="https://send.monobank.ua/jar/5se11GGQ5i" target="_blank" rel="noreferrer" className="btn-landing-support">
          <Icon name="heart" size={16}/> Підтримати розвиток
        </a>
      </div>
    </section>

    {/* ── Популярні категорії запрошень (для SEO) ── */}
    <section className="section-wrap categories-section" aria-label="Популярні категорії запрошень" style={{ maxWidth: '1100px', margin: '0 auto', paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="section-head" data-reveal style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span className="eyebrow">Швидкий старт</span>
        <h2 className="section-title" style={{ fontSize: '1.8rem', marginTop: '10px' }}>Популярні категорії запрошень</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', maxWidth: '1000px', margin: '0 auto' }}>
        <Link href="/stvoriti-zaproshennya-na-vesillya" className="category-link-card">
          <span style={{ marginRight: '8px', fontSize: '1.25rem' }}>💍</span> Весільні запрошення
        </Link>
        <Link href="/stvoriti-zaproshennya-na-den-narodzhennya" className="category-link-card">
          <span style={{ marginRight: '8px', fontSize: '1.25rem' }}>🎂</span> День народження
        </Link>
        <Link href="/stvoriti-zaproshennya-na-pobachennya" className="category-link-card">
          <span style={{ marginRight: '8px', fontSize: '1.25rem' }}>🌹</span> Романтичне побачення
        </Link>
        <Link href="/stvoriti-zaproshennya-na-vechirku" className="category-link-card">
          <span style={{ marginRight: '8px', fontSize: '1.25rem' }}>🥂</span> Вечірки та свята
        </Link>
        <Link href="/stvoriti-zaproshennya-na-kavu" className="category-link-card">
          <span style={{ marginRight: '8px', fontSize: '1.25rem' }}>☕</span> Зустрічі на каву
        </Link>
        <Link href="/stvoriti-zaproshennya-na-zustrich" className="category-link-card">
          <span style={{ marginRight: '8px', fontSize: '1.25rem' }}>🤝</span> Ділові & особисті зустрічі
        </Link>
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
        <Link href="/login" className="btn-cta" data-reveal>
          Приєднатись безкоштовно →
        </Link>
        <p className="cta-small" data-reveal>Реєстрація займає менше хвилини</p>
      </div>
    </section>
  
      </main>
      <footer className="landing-footer" role="contentinfo">
        <Link href="/" className="footer-logo">
          Запрошення <span className="footer-star">✦</span>
        </Link>
        <nav className="footer-links" aria-label="Посилання в футері">
          <Link href="/about">Про додаток</Link>
          <a href="https://send.monobank.ua/jar/5se11GGQ5i" target="_blank" rel="noreferrer" style={{color: 'var(--red)'}}>Підтримати проєкт</a>
          <Link href="/privacy">Конфіденційність</Link>
          <Link href="/terms">Умови використання</Link>
        </nav>
        <p className="footer-copy">© 2026 Запрошення ✦. Всі права захищені.</p>
      </footer>
    </>
  );
}
