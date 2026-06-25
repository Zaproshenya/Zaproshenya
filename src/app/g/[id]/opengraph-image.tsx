import { ImageResponse } from 'next/og';
import { TYPE_MAP } from '@/lib/utils';

// Standard OG image size
export const alt = 'Групове Запрошення';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const dbUrl = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let inv: any = null;
  try {
    const res = await fetch(`${dbUrl}/group-invites/${id}.json`, { next: { revalidate: 30 } });
    inv = await res.json();
  } catch (e) {
    console.error(e);
  }

  if (!inv) {
    return new ImageResponse(
      (
        <div style={{ background: '#0a0604', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <h1>Групове запрошення не знайдено</h1>
        </div>
      ),
      { ...size }
    );
  }

  const t = TYPE_MAP[inv.type] || TYPE_MAP.other;
  const membersCount = inv.members ? Object.keys(inv.members).length : 0;

  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(to bottom, #161109, #0a0604)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 60px',
        boxSizing: 'border-box',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}>
        {/* Top Gold Stripe */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '8px',
          background: 'linear-gradient(to right, transparent, #c9922a, #f5d98b, #c9922a, transparent)',
        }} />

        {/* Category Header */}
        <span style={{
          fontSize: '22px',
          color: '#c9922a',
          textTransform: 'uppercase',
          letterSpacing: '8px',
          fontWeight: 'bold',
          marginBottom: '20px',
        }}>
          • ГРУПОВЕ ЗАПРОШЕННЯ •
        </span>

        {/* Main Emoji */}
        <span style={{ fontSize: '90px', marginBottom: '15px' }}>{t.e}</span>

        {/* Main Title */}
        <span style={{
          fontSize: '76px',
          color: '#ffffff',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          textAlign: 'center',
          lineHeight: '1.2',
          marginBottom: '15px',
        }}>
          {inv.title || 'Зустріч'}
        </span>

        {/* Sender Name */}
        {inv.showSender !== false && inv.senderName && (
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '24px', color: '#a38a70', marginBottom: '35px' }}>
            <span style={{ marginRight: '8px' }}>від</span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{inv.senderName}</span>
          </div>
        )}

        {/* CTA Button */}
        <div style={{
          display: 'flex',
          background: 'linear-gradient(to right, #9e7f4f, #c5a880)',
          padding: '16px 50px',
          borderRadius: '50px',
          color: '#1a0f07',
          fontSize: '26px',
          fontWeight: 'bold',
          border: '1px solid #d4b88d',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          letterSpacing: '1px',
          marginTop: '10px',
        }}>
          ✨ Натисніть, щоб побачити більше
        </div>
      </div>
    ),
    { ...size }
  );
}
