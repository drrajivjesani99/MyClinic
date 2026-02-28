import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { databases, DB_ID, COLS } from '../lib/appwrite'
import { useApp } from '../context/AppContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { loginAdmin } = useApp()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!password) { setError('Enter password'); return }
    setLoading(true)
    setError('')
    try {
      const doc = await databases.getDocument(DB_ID, COLS.admin_settings, 'main')
      if (doc.admin_password === password) {
        loginAdmin()
        navigate('/admin/dashboard')
      } else {
        setError('Incorrect password')
      }
    } catch (err) {
      console.error(err)
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="page" style={{ background: '#1A237E', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 16px' }}>
        <button onClick={() => navigate('/')} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10,
          padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: 14
        }}>
          ← Back
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{
          background: 'white', borderRadius: 24, padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A237E' }}>Admin Panel</h2>
            <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>MyClinic Administration</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              className="input"
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            {error && (
              <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: 10, fontSize: 14 }}>
                ⚠️ {error}
              </div>
            )}
            <button onClick={handleLogin} disabled={loading} style={{
              padding: '15px', border: 'none', borderRadius: 12,
              background: loading ? '#ccc' : '#1A237E',
              color: 'white', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
