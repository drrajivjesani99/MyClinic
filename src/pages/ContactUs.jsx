import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { databases, DB_ID, COLS } from '../lib/appwrite'

export default function ContactUs() {
  const navigate = useNavigate()
  const [info, setInfo] = useState({ homeopathy: {}, leanlife: {} })

  useEffect(() => { fetchInfo() }, [])

  async function fetchInfo() {
    try {
      const res = await databases.listDocuments(DB_ID, COLS.clinic_info)
      const obj = { homeopathy: {}, leanlife: {} }
      res.documents.forEach(d => { obj[d.clinic_type] = d })
      setInfo(obj)
    } catch (err) { console.error(err) }
  }

  function ContactCard({ type }) {
    const d = info[type] || {}
    const isHomeo = type === 'homeopathy'
    const theme = isHomeo
      ? { bg: '#E3F2FD', accent: '#1565C0' }
      : { bg: '#E8F5E9', accent: '#2E7D32' }
    const name = isHomeo ? 'Homeopathy Clinic' : 'LeanLife Nutrition'
    const waMsg = encodeURIComponent(`Hello, I would like to book an appointment at ${name}.`)

    return (
      <div style={{ background: theme.bg, borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src={isHomeo ? '/homeo-logo.png' : '/leanlife-logo.png'} alt=""
              style={{ width: 38, height: 38, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span style="font-size:24px">${isHomeo ? '🌿' : '🥗'}</span>` }} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: theme.accent }}>{name}</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {d.phone ? (
            <>
              <a href={`tel:${d.phone}`} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
                background: 'white', borderRadius: 14, textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <span style={{ fontSize: 24 }}>📞</span>
                <div>
                  <p style={{ fontSize: 12, color: '#888' }}>Tap to Call</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: theme.accent }}>{d.phone}</p>
                </div>
              </a>
              <a href={`https://wa.me/${d.phone.replace(/[^0-9]/g, '')}?text=${waMsg}`}
                target="_blank" rel="noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
                  background: '#25D366', borderRadius: 14, textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(37,211,102,0.3)'
                }}>
                <span style={{ fontSize: 24 }}>💬</span>
                <div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Open WhatsApp</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Chat with us</p>
                </div>
              </a>
            </>
          ) : (
            <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: '16px' }}>
              Contact details not available yet
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: 20 }}>
      <div className="header" style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>Contact Us</h2>
      </div>
      <div style={{ padding: '16px' }}>
        <ContactCard type="homeopathy" />
        <ContactCard type="leanlife" />
      </div>
    </div>
  )
}
