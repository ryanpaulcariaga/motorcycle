import { ImageResponse } from 'next/og';

export const alt = 'MotoCompare - Motorcycle Specs & Comparison';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background:
            'linear-gradient(135deg, #21140d 0%, #3b2416 58%, #8a551c 100%)',
          color: '#fff',
          display: 'flex',
          height: '100%',
          padding: '80px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              color: '#e5a93d',
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 8,
              textTransform: 'uppercase',
            }}
          >
            MotoCompare
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            Motorcycle Specs
            <br />
            &amp; Comparison
          </div>
          <div style={{ color: '#e7d8c8', fontSize: 28 }}>
            Find the right ride.
          </div>
        </div>
      </div>
    ),
    size
  );
}
