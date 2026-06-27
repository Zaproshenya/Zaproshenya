/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';
import { Icon } from '@/components/Icon';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto 80px', padding: '0 20px', animation: 'fadeUp 0.6s var(--ease) both' }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '24px', transition: 'color 0.2s' }}>
        <Icon name="arrow-left" size={16} /> На головну
      </Link>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px 32px', boxShadow: 'var(--shadow)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '2.2rem', color: 'var(--ink)', marginBottom: '8px' }}>
          Політика конфіденційності
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '32px' }}>
          Останнє оновлення: 26 червня 2026 року
        </p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.7', color: 'var(--ink)', fontSize: '0.95rem' }}>
          <p>
            Ця Політика конфіденційності описує, як сервіс <strong>Запрошення</strong> на веб-сайті <strong>zaproshenya.site</strong> збирає, використовує та захищає вашу інформацію. Ми дуже серйозно ставимося до конфіденційності ваших особистих даних.
          </p>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', marginTop: '16px', color: 'var(--gold)' }}>
            1. Які дані ми збираємо
          </h3>
          <p>
            Ми збираємо лише мінімально необхідний набір даних для забезпечення роботи сервісу та взаємодії між друзями:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Дані профілю:</strong> Вказане вами при реєстрації ім'я, унікальний логін та автоматично згенерований ZAP-ID.</li>
            <li><strong>Електронна пошта:</strong> Якщо ви реєструєтеся з реальною поштою або додаєте її для двофакторної автентифікації (2FA), ми зберігаємо її для відновлення пароля та надсилання одноразових кодів входу.</li>
            <li><strong>Аватарка:</strong> Фотографія вашого профілю у разі її завантаження або авторизації через Google.</li>
            <li><strong>Дані зустрічей:</strong> Назва, опис, дата, час, місце зустрічі та коментарі, які ви створюєте в рамках карток-запрошень.</li>
          </ul>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', marginTop: '16px', color: 'var(--gold)' }}>
            2. Як використовуються ваші дані
          </h3>
          <p>
            Ми використовуємо зібрану інформацію виключно для:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Відображення інформації про зустрічі вам та запрошеним вами друзям.</li>
            <li>Пошуку друзів за логіном або ZAP-ID.</li>
            <li>Надсилання кодів безпеки (2FA) для перевірки входу та посилань для відновлення доступу.</li>
            <li>Запобігання спаму, зламам та іншим зловживанням.</li>
          </ul>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', marginTop: '16px', color: 'var(--gold)' }}>
            3. Захист та зберігання даних
          </h3>
          <p>
            Уся інформація зберігається у безпечному хмарному середовищі. Ми використовуємо сучасні стандарти безпеки для запобігання несанкціонованому доступу.
          </p>
          <p>
            Ми <strong>ніколи не продаємо</strong>, не передаємо та не розкриваємо ваші дані стороннім компаніям, рекламодавцям чи іншим третім особам.
          </p>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', marginTop: '16px', color: 'var(--gold)' }}>
            4. Локальне збереження та Cookies
          </h3>
          <p>
            Ми використовуємо технології локального збереження браузера для того, щоб підтримувати вашу сесію активною та кешувати підтверджений статус 2FA протягом однієї сесії. Ми не використовуємо куки для відстеження ваших дій на інших сайтах чи реклами.
          </p>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', marginTop: '16px', color: 'var(--gold)' }}>
            5. Керування даними та видалення
          </h3>
          <p>
            Ви маєте повний контроль над своїми даними:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Ви можете будь-коли змінити своє ім'я, логін чи електронну пошту у налаштуваннях профілю.</li>
            <li>Ви можете самостійно та остаточно видалити свій акаунт. Після видалення всі ваші записи, друзі та історія зустрічей миттєво і назавжди стираються з серверів.</li>
          </ul>
        </section>
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.85rem', color: 'var(--muted)' }}>
        © 2026 Запрошення ✦. Всі права захищені.
      </div>
    </div>
  );
}
