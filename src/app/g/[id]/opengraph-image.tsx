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
        <div style={{ background: '#0d0b0a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
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
        background: 'linear-gradient(135deg, #11151f 0%, #05070a 100%)',
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'sans-serif'
      }}>
        {/* Card / Envelope */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'linear-gradient(180deg, #161c2a 0%, #0a0d15 100%)',
          border: '2px solid #2e3b5a',
          borderRadius: '40px',
          padding: '70px 100px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 2px 10px rgba(255,255,255,0.1)',
          maxWidth: '1000px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Envelope Top Flap Illusion */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
            background: 'linear-gradient(90deg, transparent, #a0bae8, transparent)',
            opacity: 0.8, borderTopLeftRadius: '40px', borderTopRightRadius: '40px'
          }} />

          {/* Emoji */}
          <div style={{ fontSize: '90px', marginBottom: '30px', display: 'flex', textShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
            {t.e}
          </div>

          {/* Type */}
          <div style={{ fontSize: '36px', color: '#96a7d4', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '4px', display: 'flex', fontWeight: 'bold' }}>
            ГРУПОВЕ ЗАПРОШЕННЯ
          </div>

          {/* Title */}
          <div style={{ fontSize: '85px', fontWeight: 'bold', color: '#fff', marginBottom: '50px', lineHeight: 1.1, display: 'flex', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
            {inv.title || 'Зустріч'}
          </div>

          {/* CTA Button Illusion */}
          <div style={{
            display: 'flex',
            background: 'linear-gradient(90deg, #406bd6, #2d54b3)',
            padding: '20px 50px',
            borderRadius: '50px',
            color: '#fff',
            fontSize: '36px',
            fontWeight: 'bold',
            boxShadow: '0 10px 30px rgba(64, 107, 214, 0.4)',
            border: '1px solid #688ff2',
            letterSpacing: '1px'
          }}>
            ✨ Натисніть, щоб відкрити
          </div>

          {/* From */}
          {inv.showSender !== false && inv.senderName && (
            <div style={{ position: 'absolute', bottom: '25px', right: '45px', fontSize: '26px', color: '#637191', display: 'flex', fontStyle: 'italic' }}>
              від: {inv.senderName}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
