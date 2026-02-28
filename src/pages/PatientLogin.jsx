import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

export default function PatientLogin() {
  const { clinicType } = useParams();
  const navigate = useNavigate();
  const { loginPatient } = useApp();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [showSelect, setShowSelect] = useState(false);

  const isHomeo = clinicType === 'homeopathy';
  const theme = isHomeo
    ? { bg: '#E3F2FD', accent: '#1565C0', btn: '#42A5F5', card: '#BBDEFB' }
    : { bg: '#E8F5E9', accent: '#2E7D32', btn: '#66BB6A', card: '#C8E6C9' };
  const clinicName = isHomeo ? 'Homeopathy Clinic' : 'LeanLife Nutrition';

  async function handleLogin() {
    if (!phone || !code) {
      setError('Please enter phone and access code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', phone)
        .eq('access_code', code)
        .eq('is_active', true)
        .in('clinic_type', [clinicType, 'both']);

      if (err || !data?.length) {
        setError('Invalid phone number or access code');
        setLoading(false);
        return;
      }

      if (data.length === 1) {
        loginPatient({ ...data[0], clinicType, clinicName });
        navigate('/dashboard');
      } else {
        setPatients(data);
        setShowSelect(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  function selectPatient(p) {
    loginPatient({ ...p, clinicType, clinicName });
    navigate('/dashboard');
  }

  return (
    <div className="page" style={{ background: theme.bg, minHeight: '100vh' }}>
      <div className="header" style={{ background: theme.bg }}>
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.accent}
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: theme.accent }}>
            {clinicName}
          </h2>
          <p style={{ fontSize: 12, color: '#666' }}>Patient Login</p>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 24,
              background: 'white',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px ${theme.accent}20`,
            }}
          >
            <img
              src={isHomeo ? '/homeo-logo.png' : '/leanlife-logo.png'}
              alt={clinicName}
              style={{ width: 65, height: 65, objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<span style="font-size:40px">${
                  isHomeo ? '🌿' : '🥗'
                }</span>`;
              }}
            />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: theme.accent }}>
            {clinicName}
          </h3>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
            Enter your credentials to continue
          </p>
        </div>

        {!showSelect ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              className="input"
              type="tel"
              placeholder="Phone Number (e.g. +919876543210)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ borderColor: theme.accent + '40' }}
            />
            <input
              className="input"
              type="password"
              placeholder="Access Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ borderColor: theme.accent + '40' }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && (
              <div
                style={{
                  background: '#FFEBEE',
                  color: '#C62828',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 14,
                }}
              >
                ⚠️ {error}
              </div>
            )}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                padding: '15px',
                border: 'none',
                borderRadius: 12,
                background: loading ? '#ccc' : theme.btn,
                color: 'white',
                fontSize: 17,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8,
                boxShadow: `0 4px 16px ${theme.btn}40`,
              }}
            >
              {loading ? 'Logging in...' : '🔐 Login'}
            </button>
          </div>
        ) : (
          <div>
            <h3
              style={{
                fontWeight: 700,
                color: theme.accent,
                marginBottom: 16,
                fontSize: 16,
              }}
            >
              Select Patient
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  style={{
                    padding: '16px',
                    border: `2px solid ${theme.card}`,
                    borderRadius: 12,
                    background: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 600,
                    color: theme.accent,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 24 }}>👤</span>
                  {p.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSelect(false)}
              style={{
                marginTop: 16,
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
