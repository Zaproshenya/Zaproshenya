import Link from 'next/link';
import { Icon } from '@/components/Icon';

export const metadata = {
  title: "Помилка 404 | Запрошення ✦",
  description: "Ой! Цю зустріч не знайдено або її ніколи не існувало.",
};

export default function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-glow" aria-hidden="true" />
      
      {/* Background Sparkles */}
      <span className="sparkle sparkle-1" aria-hidden="true">✦</span>
      <span className="sparkle sparkle-2" aria-hidden="true">✦</span>
      <span className="sparkle sparkle-3" aria-hidden="true">✦</span>
      <span className="sparkle sparkle-4" aria-hidden="true">✦</span>

      <div className="notfound-card-scene">
        <div className="notfound-card-bg" aria-hidden="true" />
        <div className="notfound-card">
          <div className="notfound-stamp">Загублено</div>
          
          <div className="notfound-envelope-icon">
            <Icon name="envelope-open" size={40} />
          </div>

          <h1 className="notfound-invite-title">Запрошення №404</h1>

          <div className="notfound-details">
            <div className="notfound-detail-item">
              <span className="notfound-detail-icon"><Icon name="calendar-blank" size={16} /></span>
              <span className="notfound-detail-label">Дата:</span>
              <span className="notfound-detail-val">Ніколи-ніколи</span>
            </div>
            
            <div className="notfound-detail-item">
              <span className="notfound-detail-icon"><Icon name="clock" size={16} /></span>
              <span className="notfound-detail-label">Час:</span>
              <span className="notfound-detail-val">Паралельний всесвіт</span>
            </div>

            <div className="notfound-detail-item">
              <span className="notfound-detail-icon"><Icon name="map-pin" size={16} /></span>
              <span className="notfound-detail-label">Місце:</span>
              <span className="notfound-detail-val">Край всесвіту</span>
            </div>
          </div>

          <p className="notfound-message">
            «Привіт! Хотів запросити тебе на цю сторінку, але схоже, що її або перемістили, або ніколи й не створювали. Давай домовимось про іншу зустріч?»
          </p>

          <div className="notfound-actions">
            <Link href="/" className="btn-primary notfound-btn-primary">
              <Icon name="house" size={18} />
              На головну
            </Link>
            
            <Link href="/create" className="btn-outline notfound-btn-secondary">
              <Icon name="plus" size={18} />
              Створити запрошення
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
