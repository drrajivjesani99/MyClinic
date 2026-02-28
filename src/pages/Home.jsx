import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Home() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [banners]);

  async function fetchBanners() {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (data?.length) setBanners(data);
    else
      setBanners([
        {
          id: 1,
          image_url:
            'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
        },
        {
          id: 2,
          image_url:
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
        },
        {
          id: 3,
          image_url:
            'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
        },
      ]);
  }

  return (
    <div
      className="page"
      style={{ background: '#fff', minHeight: '100vh', paddingBottom: 60 }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 16px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <img
              src="/homeo-logo.png"
              alt=""
              style={{ width: 28, height: 28, objectFit: 'contain' }}
              onError={(e) => (e.target.style.display = 'none')}
            />
            <img
              src="/leanlife-logo.png"
              alt=""
              style={{ width: 28, height: 28, objectFit: 'contain' }}
              onError={(e) => (e.target.style.display = 'none')}
            />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#1A237E' }}>
            MyClinic
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#999' }}>
          Your Health, Our Priority
        </span>
      </div>

      {/* Carousel */}
      <div
        style={{
          position: 'relative',
          height: 200,
          overflow: 'hidden',
          margin: '0 0 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: `${banners.length * 100}%`,
            height: '100%',
            transform: `translateX(-${
              currentBanner * (100 / banners.length)
            }%)`,
            transition: 'transform 0.5s ease',
          }}
        >
          {banners.map((b) => (
            <img
              key={b.id}
              src={b.image_url}
              alt=""
              style={{
                width: `${100 / banners.length}%`,
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 6,
          }}
        >
          {banners.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentBanner(i)}
              style={{
                width: i === currentBanner ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  i === currentBanner ? 'white' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>

      {/* Clinic Cards */}
      <div
        style={{
          padding: '0 16px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        <div
          onClick={() => navigate('/login/homeopathy')}
          style={{
            background: '#BBDEFB',
            borderRadius: 16,
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 2px 12px rgba(21,101,192,0.12)',
            cursor: 'pointer',
            aspectRatio: '1',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: 16,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(21,101,192,0.15)',
            }}
          >
            <img
              src="/homeo-logo.png"
              alt="Homeopathy"
              style={{ width: 50, height: 50, objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML =
                  '<span style="font-size:32px">🌿</span>';
              }}
            />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#1565C0',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            Homeopathy Clinic
          </span>
        </div>

        <div
          onClick={() => navigate('/login/leanlife')}
          style={{
            background: '#C8E6C9',
            borderRadius: 16,
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 2px 12px rgba(46,125,50,0.12)',
            cursor: 'pointer',
            aspectRatio: '1',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: 16,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(46,125,50,0.15)',
            }}
          >
            <img
              src="/leanlife-logo.png"
              alt="LeanLife"
              style={{ width: 50, height: 50, objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML =
                  '<span style="font-size:32px">🥗</span>';
              }}
            />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#2E7D32',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            LeanLife Nutrition
          </span>
        </div>
      </div>

      {/* Public Buttons */}
      <div
        style={{
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {[
          { label: '👨‍⚕️ About Us', path: '/about' },
          { label: '💡 Health Tips', path: '/health-tips' },
          { label: '📞 Contact Us', path: '/contact' },
        ].map((btn) => (
          <button
            key={btn.path}
            onClick={() => navigate(btn.path)}
            style={{
              padding: '14px',
              border: 'none',
              borderRadius: 12,
              background: '#F3F4F6',
              color: '#374151',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {btn.label}
          </button>
        ))}

        <button
          onClick={() => navigate('/login/homeopathy')}
          style={{
            padding: '16px',
            border: 'none',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
            color: 'white',
            fontSize: 17,
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 4,
            boxShadow: '0 4px 16px rgba(21,101,192,0.3)',
          }}
        >
          🔐 Patient Login
        </button>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          padding: '8px 16px',
          background: 'white',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: 'none',
            border: 'none',
            color: '#bbb',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Admin
        </button>
      </div>
    </div>
  );
}
