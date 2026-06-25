import { NextRequest, NextResponse } from 'next/server';
import { TYPE_MAP } from '@/lib/utils';

const dbUrl = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const userAgent = req.headers.get('user-agent') || '';
  const isBot = /bot|telegram|viber|whatsapp|facebook|twitter|discord|skype/i.test(userAgent);

  if (!isBot) {
    return NextResponse.redirect(new URL(`/g/${id}`, req.url));
  }

  let inv = null;
  try {
    const res = await fetch(`${dbUrl}/group-invites/${id}.json`, { next: { revalidate: 30 } });
    inv = await res.json();
  } catch (e) {
    console.error("Error fetching group invite for bot preview:", e);
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'zaproshenya.pages.dev';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  const ogImageUrl = `${baseUrl}/g/${id}/opengraph-image`;
  
  const title = inv && inv.type ? `${TYPE_MAP[inv.type]?.e || '✦'} ${inv.title || 'Групове запрошення'}` : 'Групове запрошення';
  const desc = 'Вам надіслано групове запрошення 🌟\n\nНатисніть, щоб відкрити та дізнатися деталі!';

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
  <meta property="og:image:alt" content="Групове Запрошення">
  <meta property="og:type" content="website">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImageUrl}">
  
  <meta http-equiv="refresh" content="0; url=/g/${id}">
</head>
<body>
  <script>window.location.replace("/g/${id}");</script>
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
