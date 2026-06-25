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
  const userAgent = request.headers.get('user-agent') || '';
  const isBot = /bot|telegram|viber|whatsapp|facebook|twitter|discord|skype|vkShare/i.test(userAgent);
  const pathname = request.nextUrl.pathname;

  if (isBot && (pathname.startsWith('/i/') || pathname.startsWith('/g/')) && !pathname.includes('opengraph-image')) {
    
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
<body>
  <!-- Bot preview HTML from Middleware -->
</body>
</html>
    `.trim();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/i/:id*', '/g/:id*'],
};
