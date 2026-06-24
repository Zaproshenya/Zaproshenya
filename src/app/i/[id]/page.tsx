import { Metadata } from 'next';
import { TYPE_MAP } from '@/lib/utils';
import ClientInvitePage from './ClientInvitePage';



const dbUrl = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${dbUrl}/invites/${id}.json`, { next: { revalidate: 30 } });
    const inv = await res.json();
    if (!inv) return { title: 'Запрошення не знайдено' };
    
    const t = TYPE_MAP[inv.type] || TYPE_MAP.other;
    const title = `${t.e} Запрошення на: ${t.l}`;
    let desc = `Для: ${inv.to}`;
    if (inv.date) desc += ` | Коли: ${inv.date} ${inv.time || ''}`;
    if (inv.place) desc += ` | Де: ${inv.place}`;
    
    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
      }
    };
  } catch (e) {
    return { title: 'Запрошення ✦' };
  }
}

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientInvitePage id={id} />;
}
