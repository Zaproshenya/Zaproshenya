import { ImageResponse } from 'next/og';
import { TYPE_MAP } from '@/lib/utils';



// Standard OG image size
export const alt = 'Запрошення';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const dbUrl = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let inv: any = null;
  try {
    const res = await fetch(`${dbUrl}/invites/${id}.json`, { next: { revalidate: 30 } });
    inv = await res.json();
  } catch (e) {
    console.error(e);
  }

  if (!inv) {
    return new ImageResponse(
      (
        <div style={{ background: '#0d0b0a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <h1>Запрошення не знайдено</h1>
        </div>
      ),
      { ...size }
    );
  }

  const t = TYPE_MAP[inv.type] || TYPE_MAP.other;

    return new ImageResponse(
      (
        <div style={{
          background: 'linear-gradient(to bottom right, #1f1115, #0a0507)',
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'sans-serif'
        }}>
          {/* Card / Envelope */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(to bottom, #2a161c, #150a0d)',
            border: '2px solid #5a2e3b',
            borderRadius: '40px',
            padding: '40px 60px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            width: '1050px',
            height: '550px',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Envelope Top Flap Illusion */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
              background: '#e8a0ba',
              opacity: 0.8, borderTopLeftRadius: '40px', borderTopRightRadius: '40px'
            }} />

            {/* Top row: Emoji & Type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <span style={{ fontSize: '70px' }}>{t.e}</span>
              <span style={{ fontSize: '32px', color: '#d496a7', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold' }}>
                ПРИВАТНЕ ЗАПРОШЕННЯ
              </span>
            </div>

            {/* To */}
            <div style={{ fontSize: '75px', fontWeight: 'bold', color: '#fff', marginBottom: '30px', lineHeight: 1.1, display: 'flex' }}>
              Для {inv.to}
            </div>

            {/* Details Row */}
            <div style={{ display: 'flex', gap: '60px', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '30px 0', marginBottom: '40px', width: '80%', justifyContent: 'center' }}>
              {inv.date && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', color: '#d496a7', marginBottom: '8px', textTransform: 'uppercase' }}>Коли</span>
                  <span style={{ fontSize: '32px', color: '#fff', fontWeight: 'bold' }}>{inv.date} {inv.time || ''}</span>
                </div>
              )}
              
              {inv.place && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', color: '#d496a7', marginBottom: '8px', textTransform: 'uppercase' }}>Де</span>
                  <span style={{ fontSize: '32px', color: '#fff', fontWeight: 'bold', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.place}
                  </span>
                </div>
              )}
            </div>

            {/* CTA Button Illusion */}
            <div style={{
              display: 'flex',
              background: '#d6406b',
              padding: '15px 40px',
              borderRadius: '50px',
              color: '#fff',
              fontSize: '32px',
              fontWeight: 'bold',
              border: '1px solid #f2688f',
              letterSpacing: '1px'
            }}>
              ✨ Натисніть, щоб дізнатися деталі
            </div>

            {/* From */}
            {inv.showSender !== false && inv.senderName && (
              <div style={{ position: 'absolute', bottom: '25px', right: '45px', fontSize: '26px', color: '#916371', display: 'flex', fontStyle: 'italic' }}>
                від: {inv.senderName}
              </div>
            )}
          </div>
        </div>
      ),
    { ...size }
  );
}
