/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';
import { Icon } from '@/components/Icon';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto 80px', padding: '0 20px', animation: 'fadeUp 0.6s var(--ease) both' }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '24px', transition: 'color 0.2s' }}>
        <Icon name="arrow-left" size={16} /> На головну
      </Link>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px 32px', boxShadow: 'var(--shadow)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '2.2rem', color: 'var(--ink)', marginBottom: '8px' }}>
          Умови використання
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '32px' }}>
          Останнє оновлення: 26 червня 2026 року
        </p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.7', color: 'var(--ink)', fontSize: '0.95rem' }}>
          <p>
            Ласкаво просимо на сайт <strong>zaproshenya.site</strong> (далі — «Сайт» або «Сервіс»). Використовуючи наш Сервіс, ви погоджуєтеся дотримуватися цих Умов використання. Будь ласка, уважно прочитайте їх.
          </p>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', marginTop: '16px', color: 'var(--gold)' }}>
            1. Загальні положення
          </h3>
          <p>
            Сервіс «Запрошення» надає користувачам можливість створювати та надсилати картки-запрошення на зустрічі. Послуги надаються безкоштовно за принципом «як є». Ми не несемо відповідальності за будь-які технічні збої, втрату доступу чи невідповідність сервісу вашим очікуванням.
          </p>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', marginTop: '16px', color: 'var(--gold)' }}>
            2. Реєстрація та безпека акаунту
          </h3>
          <p>
            Для використання всіх функцій Сервісу необхідно зареєструвати акаунт. Ви несете особисту відповідальність за збереження конфіденційності свого пароля та логіна.
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Реєстрація є добровільною. Ви можете використовувати реальну пошту або створити віртуальний акаунт.</li>
            <li>Реєстрація з реальною електронною поштою дозволяє увімкнути двофакторну автентифікацію для захисту акаунту та відновлювати пароль у разі його втрати.</li>
            <li>Заборонено передавати свій акаунт третім особам або використовувати логіни, що імітують адміністрацію чи технічну підтримку сайту.</li>
          </ul>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', marginTop: '16px', color: 'var(--gold)' }}>
            3. Правила поведінки та заборонений вміст
          </h3>
          <p>
            Ми прагнемо створити безпечне середовище для дружнього спілкування. На Сайті суворо заборонено:
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Надсилати спам, масові невідомі запити на дружбу або небажані запрошення.</li>
            <li>Створювати образливий вміст, використовувати нецензурну лексику в іменах профілю, описах або локаціях зустрічей.</li>
            <li>Переслідувати, погрожувати, ображати чи шантажувати інших користувачів.</li>
            <li>Використовувати сервіс для будь-якої незаконної діяльності.</li>
          </ul>
          <p>
            Адміністрація сайту залишає за собою право тимчасово обмежити доступ або повністю видалити акаунт користувача у разі порушення цих правил без попереднього попередження.
          </p>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', marginTop: '16px', color: 'var(--gold)' }}>
            4. Видалення акаунту
          </h3>
          <p>
            Ви маєте право видалити свій акаунт у будь-який момент через налаштування профілю. Після підтвердження видалення всі ваші персональні дані (ім'я, логін, список друзів, історія запрошень та надіслані запити) будуть назавжди стерті з бази даних без можливості відновлення.
          </p>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontStyle: 'italic', fontSize: '1.4rem', marginTop: '16px', color: 'var(--gold)' }}>
            5. Зміна умов
          </h3>
          <p>
            Адміністрація може оновлювати ці Умови використання. Ми рекомендуємо періодично переглядати цю сторінку. Продовжуючи користуватися Сайтом після внесення змін, ви погоджуєтеся з оновленими Умовами.
          </p>
        </section>
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.85rem', color: 'var(--muted)' }}>
        © 2026 Запрошення ✦. Всі права захищені.
      </div>
    </div>
  );
}
