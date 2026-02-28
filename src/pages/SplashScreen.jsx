import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        maxWidth: 480,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Gradient bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to right, #E3F2FD 0%, #E8F5E9 100%)',
          borderRadius: '60% 60% 0 0 / 40% 40% 0 0',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 40px',
        }}
      >
        {/* Logos */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: '#E3F2FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(21,101,192,0.15)',
            }}
          >
            <img
              src="/homeo-logo.png"
              alt="Homeopathy"
              style={{ width: 60, height: 60, objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML =
                  '<span style="font-size:32px">🌿</span>';
              }}
            />
          </div>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: '#E8F5E9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(46,125,50,0.15)',
            }}
          >
            <img
              src="/leanlife-logo.png"
              alt="LeanLife"
              style={{ width: 60, height: 60, objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML =
                  '<span style="font-size:32px">🥗</span>';
              }}
            />
          </div>
        </div>

        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: '#1A237E',
            letterSpacing: -0.5,
            marginBottom: 8,
          }}
        >
          MyClinic
        </h1>

        <p style={{ fontSize: 16, color: '#666', fontWeight: 400 }}>
          Your Health, Our Priority
        </p>

        <div
          style={{
            marginTop: 48,
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background:
                  i === 0 ? '#1565C0' : i === 1 ? '#42A5F5' : '#66BB6A',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
