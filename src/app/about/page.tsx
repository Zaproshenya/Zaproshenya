/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';
import { Icon } from '@/components/Icon';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto 80px', padding: '0 20px', animation: 'fadeUp 0.6s var(--ease) both' }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '24px', transition: 'color 0.2s' }}>
        <Icon name="arrow-left" size={16} /> На головну
      </Link>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px 32px', boxShadow: 'var(--shadow)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '2.5rem', color: 'var(--gold)', marginBottom: '8px' }}>
          Запрошення <span style={{ fontStyle: 'normal' }}>✦</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: '32px', fontStyle: 'italic' }}>
          Зустрічі, які справді відбуваються.
        </p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.7', color: 'var(--ink)' }}>
          <p>
            <strong>«Запрошення»</strong> — це безкоштовний, затишний та повністю український веб-додаток, створений для того, щоб спростити планування зустрічей з друзями, близькими та колегами.
          </p>

          <p>
            Ми всі знаємо, як важко буває домовитися про зустріч у звичайних месенджерах. Нескінченні обговорення в чатах на тему <em>«ну давай якось зустрінемось на каву»</em> часто розмиваються у щоденній рутині, і плани залишаються лише планами. 
          </p>

          <div style={{ padding: '20px', background: 'var(--warm)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--gold)', margin: '12px 0' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.25rem', marginBottom: '8px' }}>Наша місія</h3>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              Дати людям інструмент, який допомагає фіксувати конкретні наміри. Запрошення містить чіткі параметри: <strong>що</strong> (тип зустрічі), <strong>коли</strong> (дата й час) та <strong>де</strong> (локація). Отримувач може погодитися, відхилити або запропонувати інший час в один клік — без довгих переписок.
            </p>
          </div>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.75rem', marginTop: '16px', color: 'var(--ink)' }}>
            Чому ми?
          </h2>

          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li>
              <strong>Абсолютно безкоштовно та без реклами:</strong> Сервіс працює без комерційних оголошень, платних підписок чи прихованих платежів.
            </li>
            <li>
              <strong>Приватність та безпека:</strong> Ми дбаємо про ваші дані. Ви можете самостійно керувати списками друзів, бачити тільки тих людей, кого ви додали, та обмежувати коло осіб, які можуть надсилати вам запити.
            </li>
            <li>
              <strong>Гнучке перенесення:</strong> Якщо у вас змінилися плани, ви можете запропонувати альтернативну дату або час прямо в картці запрошення.
            </li>
            <li>
              <strong>Сучасні функції:</strong> Двофакторна автентифікація (2FA) для захисту акаунту та сповіщення в реальному часі про будь-які зміни у ваших зустрічах.
            </li>
          </ul>

          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <Link href="/login" className="btn btn-dark" style={{ padding: '12px 24px' }}>
              Спробувати зараз
            </Link>
            <Link href="/" className="btn btn-outline" style={{ padding: '12px 24px' }}>
              Документація
            </Link>
          </div>
        </section>
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.85rem', color: 'var(--muted)' }}>
        © 2026 Запрошення ✦. Всі права захищені.
      </div>
    </div>
  );
}
