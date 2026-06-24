import { Metadata } from 'next';
import { TYPE_MAP } from '@/lib/utils';
import ClientGroupInvitePage from './ClientGroupInvitePage';

const dbUrl = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${dbUrl}/group-invites/${id}.json`, { next: { revalidate: 30 } });
    const inv = await res.json();
    if (!inv) return { title: 'Групове запрошення не знайдено' };
    
    const t = TYPE_MAP[inv.type] || TYPE_MAP.other;
    const title = `${t.e} ${inv.title || 'Групове запрошення'}`;
    let desc = `Тип: ${t.l}`;
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
    return { title: 'Групове запрошення ✦' };
  }
}

export default async function GroupInvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientGroupInvitePage id={id} />;
}
