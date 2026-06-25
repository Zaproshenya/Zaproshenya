import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const dbUrl = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

const TYPE_MAP: Record<string, { l: string; e: string }> = {
  other: { l: 'Інше', e: '✦' },
  birthday: { l: 'День народження', e: '🎂' },
  wedding: { l: 'Весілля', e: '💍' },
  party: { l: 'Вечірка', e: '🎉' },
  meeting: { l: 'Зустріч', e: '🤝' },
  business: { l: 'Робоча зустріч', e: '💼' },
  date: { l: 'Побачення', e: '❤️' },
  cinema: { l: 'Кіно', e: '🍿' },
  trip: { l: 'Подорож', e: '✈️' },
  sport: { l: 'Спорт', e: '⚽' },
  games: { l: 'Ігри', e: '🎮' },
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Обробляємо лише маршрути запрошень (і не картинки)
  if ((pathname.startsWith('/i/') || pathname.startsWith('/g/')) && !pathname.includes('opengraph-image')) {
    
    // Якщо це реальна людина (вже має куку) АБО це внутрішній перехід Next.js (RSC)
    if (request.cookies.has('is_human') || request.headers.has('rsc') || request.headers.has('next-router-prefetch')) {
      return NextResponse.next();
    }

    // Інакше (Бот АБО перший мілісекундний захід людини)
    const isGroup = pathname.startsWith('/g/');
    const id = pathname.split('/')[2];
    
    if (!id) return NextResponse.next();

    let inv = null;
    try {
      const endpoint = isGroup ? 'group-invites' : 'invites';
      const res = await fetch(`${dbUrl}/${endpoint}/${id}.json`, { next: { revalidate: 30 } });
      inv = await res.json();
    } catch (e) {
      console.error("Middleware fetch error", e);
    }

    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'zaproshenya.pages.dev';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const ogImageUrl = `${baseUrl}/${isGroup ? 'g' : 'i'}/${id}/opengraph-image`;
    
    let title = isGroup ? 'Групове запрошення' : 'Запрошення';
    let desc = '';

    if (inv) {
      const t = TYPE_MAP[inv.type] || TYPE_MAP.other;
      if (isGroup) {
        title = `${t.e} ${inv.title || 'Групове запрошення'}`;
        desc = `Тип: ${t.l}`;
      } else {
        title = `${t.e} Запрошення на: ${t.l}`;
        desc = `Для: ${inv.to}`;
      }
      if (inv.date) desc += ` | Коли: ${inv.date} ${inv.time || ''}`;
      if (inv.place) desc += ` | Де: ${inv.place}`;
    }

    const html = `
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Запрошення">
  <meta property="og:type" content="website">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImageUrl}">
</head>
<body style="background-color: #000; margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden;">
  <img src="${ogImageUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="Запрошення" />
  <script>
    // Записуємо невидиму мітку "я людина" на 5 хвилин
    document.cookie = "is_human=1; path=/; max-age=300";
    // Якщо мітка успішно записалась (у браузері увімкнені кукі) — моментально перезавантажуємо сторінку!
    if (document.cookie.indexOf("is_human=1") !== -1) {
      window.location.reload();
    }
  </script>
</body>
</html>
    `.trim();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/i/:id*', '/g/:id*'],
};
