import { NextRequest, NextResponse } from 'next/server';
import { TYPE_MAP } from '@/lib/utils';

const dbUrl = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const userAgent = req.headers.get('user-agent') || '';
  const isBot = /bot|telegram|viber|whatsapp|facebook|twitter|discord|skype/i.test(userAgent);

  // Якщо це реальний користувач, миттєво перекидаємо на справжню сторінку запрошення
  if (!isBot) {
    return NextResponse.redirect(new URL(`/i/${id}`, req.url));
  }

  // Для ботів формуємо статичну HTML-сторінку з мета-тегами
  let inv = null;
  try {
    const res = await fetch(`${dbUrl}/invites/${id}.json`, { next: { revalidate: 30 } });
    inv = await res.json();
  } catch (e) {
    console.error("Error fetching invite for bot preview:", e);
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'zaproshenya.pages.dev';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  const ogImageUrl = `${baseUrl}/i/${id}/opengraph-image`;
  
  const title = inv && inv.type ? `${TYPE_MAP[inv.type]?.e || '✦'} Запрошення на: ${TYPE_MAP[inv.type]?.l || 'Подію'}` : 'Запрошення';
  const desc = 'Вам надіслано приватне запрошення 💌\n\nНатисніть, щоб відкрити та дізнатися деталі!';

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
  
  <!-- Fallback redirect just in case a real browser lands here -->
  <meta http-equiv="refresh" content="0; url=/i/${id}">
</head>
<body>
  <script>window.location.replace("/i/${id}");</script>
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
