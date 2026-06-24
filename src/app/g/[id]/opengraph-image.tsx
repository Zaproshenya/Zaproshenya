import { ImageResponse } from 'next/og';
import { TYPE_MAP } from '@/lib/utils';

export const runtime = 'edge';

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
        background: 'linear-gradient(to bottom right, #1a1512, #0d0b0a)',
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'sans-serif'
      }}>
        {/* Card / Envelope */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'linear-gradient(145deg, #241d18 0%, #17120e 100%)',
          border: '1px solid #33281f',
          borderRadius: '32px',
          padding: '60px 80px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          maxWidth: '900px',
          textAlign: 'center'
        }}>
          {/* Envelope Top Flap Illusion */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: 'linear-gradient(90deg, transparent, #b8860b, transparent)',
            opacity: 0.5, borderTopLeftRadius: '32px', borderTopRightRadius: '32px'
          }} />

          {/* Group Badge */}
          <div style={{
            position: 'absolute', top: '30px', left: '40px',
            background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '20px',
            color: '#fff', fontSize: '20px', display: 'flex'
          }}>
            Групове запрошення
          </div>

          {/* Emoji */}
          <div style={{ fontSize: '80px', marginBottom: '20px', display: 'flex', marginTop: '20px' }}>
            {t.e}
          </div>

          {/* Title */}
          <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#fff', marginBottom: '40px', lineHeight: 1.1, display: 'flex' }}>
            {inv.title || 'Зустріч'}
          </div>

          {/* Details Row */}
          <div style={{ display: 'flex', gap: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
            {inv.date && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', color: '#a38a70', marginBottom: '8px' }}>Коли</span>
                <span style={{ fontSize: '32px', color: '#fff' }}>{inv.date} {inv.time || ''}</span>
              </div>
            )}
            
            {inv.place && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', color: '#a38a70', marginBottom: '8px' }}>Де</span>
                <span style={{ fontSize: '32px', color: '#fff', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inv.place}
                </span>
              </div>
            )}

            {membersCount > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', color: '#a38a70', marginBottom: '8px' }}>Учасники</span>
                <span style={{ fontSize: '32px', color: '#fff' }}>{membersCount}</span>
              </div>
            )}
          </div>

          {/* From */}
          {inv.showSender !== false && inv.senderName && (
            <div style={{ position: 'absolute', bottom: '30px', right: '40px', fontSize: '24px', color: '#8a735c', display: 'flex' }}>
              організатор: {inv.senderName}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
