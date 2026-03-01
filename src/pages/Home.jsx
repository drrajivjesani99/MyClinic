import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { databases, DB_ID, COLS, Query } from '../lib/appwrite'

export default function Home() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState([])
  const [currentBanner, setCurrentBanner] = useState(0)

  useEffect(() => {
    fetchBanners()
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [banners])

  async function fetchBanners() {
    try {
      const res = await databases.listDocuments(DB_ID, COLS.banners, [
        Query.equal('is_active', true),
        Query.orderAsc('display_order'),
        Query.limit(10)
      ])
      setBanners(res.documents)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="page" style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: 20 }}>
      {/* Header */}
      <div style={{
        background: 'white', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)'
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1A237E' }}>MyClinic</h1>
          <p style={{ fontSize: 12, color: '#888' }}>Your Health, Our Priority</p>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: '#E3F2FD',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
        }}>🏥</div>
      </div>

      {/* Banner Carousel */}
      <div style={{ position: 'relative', margin: '16px', borderRadius: 20, overflow: 'hidden', height: 200 }}>
        {banners.length > 0 ? (
          <>
            <img src={banners[currentBanner]?.image_url} alt="Banner"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 6
            }}>
              {banners.map((_, i) => (
                <div key={i} onClick={() => setCurrentBanner(i)} style={{
                  width: i === currentBanner ? 20 : 6, height: 6,
                  borderRadius: 3, background: i === currentBanner ? 'white' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.3s', cursor: 'pointer'
                }} />
              ))}
            </div>
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%', background: 'linear-gradient(135deg, #E3F2FD, #E8F5E9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
          }}>
            <span style={{ fontSize: 48 }}>🏥</span>
            <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>Welcome to MyClinic</p>
          </div>
        )}
      </div>

      {/* Clinic Cards */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div onClick={() => navigate('/login/homeopathy')} style={{
          background: '#E3F2FD', borderRadius: 20, padding: 20,
          cursor: 'pointer', textAlign: 'center',
          boxShadow: '0 2px 12px rgba(21,101,192,0.1)',
          transition: 'transform 0.2s'
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, background: 'white',
            margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(21,101,192,0.15)'
          }}>
            <img src="/homeo-logo.png" alt="Homeopathy"
              style={{ width: 52, height: 52, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:32px">🌿</span>' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1565C0' }}>Homeopathy Clinic</p>
          <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Patient Login</p>
        </div>

        <div onClick={() => navigate('/login/leanlife')} style={{
          background: '#E8F5E9', borderRadius: 20, padding: 20,
          cursor: 'pointer', textAlign: 'center',
          boxShadow: '0 2px 12px rgba(46,125,50,0.1)'
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, background: 'white',
            margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(46,125,50,0.15)'
          }}>
            <img src="/leanlife-logo.png" alt="LeanLife"
              style={{ width: 52, height: 52, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:32px">🥗</span>' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#2E7D32' }}>LeanLife Nutrition</p>
          <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Patient Login</p>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: '💡 Health Tips', path: '/health-tips', color: '#FF6F00', bg: '#FFF8E1' },
          { label: '🏥 About Us', path: '/about', color: '#6A1B9A', bg: '#F3E5F5' },
          { label: '📞 Contact Us', path: '/contact', color: '#00695C', bg: '#E0F2F1' },
        ].map(item => (
          <div key={item.path} onClick={() => navigate(item.path)} style={{
            background: item.bg, borderRadius: 14, padding: '14px 18px',
            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)'
          }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.label}</span>
            <span style={{ color: item.color, fontSize: 18 }}>→</span>
          </div>
        ))}
      </div>

      {/* Admin Link */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button onClick={() => navigate('/admin')} style={{
          background: 'none', border: 'none', color: '#bbb',
          fontSize: 13, cursor: 'pointer'
        }}>
          Admin
        </button>
      </div>
    </div>
  )
}
