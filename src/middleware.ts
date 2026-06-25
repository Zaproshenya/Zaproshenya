import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const isBot = /bot|telegram|viber|whatsapp|facebook|twitter|discord|skype|vkShare/i.test(userAgent);

  const pathname = request.nextUrl.pathname;

  // Якщо це бот і запит йде до сторінки запрошення
  if (isBot && (pathname.startsWith('/i/') || pathname.startsWith('/g/'))) {
    // Не перехоплюємо самі картинки та вже перенаправлені запити до /p
    if (!pathname.includes('opengraph-image') && !pathname.endsWith('/p')) {
      // Робимо невидимий для бота rewrite на спеціальний маршрут з мета-тегами
      return NextResponse.rewrite(new URL(`${pathname}/p`, request.url));
    }
  }

  // Для звичайних людей нічого не робимо, пускаємо на стандартну сторінку
  return NextResponse.next();
}

export const config = {
  matcher: ['/i/:id*', '/g/:id*'],
};
