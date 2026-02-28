import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AboutUs() {
  const navigate = useNavigate();
  const [info, setInfo] = useState({ homeopathy: {}, leanlife: {} });

  useEffect(() => {
    fetchInfo();
  }, []);

  async function fetchInfo() {
    const { data } = await supabase.from('clinic_info').select('*');
    if (data) {
      const obj = {};
      data.forEach((d) => {
        obj[d.clinic_type] = d;
      });
      setInfo(obj);
    }
  }

  function ClinicSection({ type }) {
    const d = info[type] || {};
    const isHomeo = type === 'homeopathy';
    const theme = isHomeo
      ? { bg: '#E3F2FD', accent: '#1565C0' }
      : { bg: '#E8F5E9', accent: '#2E7D32' };
    const timings =
      typeof d.timings === 'string'
        ? JSON.parse(d.timings || '{}')
        : d.timings || {};

    return (
      <div
        style={{
          background: theme.bg,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${theme.accent}20`,
            }}
          >
            <img
              src={isHomeo ? '/homeo-logo.png' : '/leanlife-logo.png'}
              alt=""
              style={{ width: 48, height: 48, objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<span style="font-size:28px">${
                  isHomeo ? '🌿' : '🥗'
                }</span>`;
              }}
            />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.accent }}>
              {isHomeo ? 'Homeopathy Clinic' : 'LeanLife Nutrition'}
            </h3>
            {d.doctor_name && (
              <p style={{ fontSize: 14, color: '#555', marginTop: 2 }}>
                {d.doctor_name}
              </p>
            )}
            {d.qualification && (
              <p style={{ fontSize: 12, color: '#777' }}>{d.qualification}</p>
            )}
          </div>
        </div>

        {d.description && (
          <p
            style={{
              fontSize: 14,
              color: '#555',
              lineHeight: 1.6,
              marginBottom: 14,
              background: 'white',
              padding: 14,
              borderRadius: 12,
            }}
          >
            {d.description}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {d.address && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <p style={{ fontSize: 14, color: '#555', flex: 1 }}>
                {d.address}
              </p>
            </div>
          )}
          {d.phone && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>📞</span>
              <a
                href={`tel:${d.phone}`}
                style={{
                  fontSize: 14,
                  color: theme.accent,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {d.phone}
              </a>
            </div>
          )}
        </div>

        {Object.keys(timings).length > 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 14,
              marginTop: 14,
            }}
          >
            <p
              style={{
                fontWeight: 700,
                color: theme.accent,
                marginBottom: 10,
                fontSize: 14,
              }}
            >
              🕐 Working Hours
            </p>
            {Object.entries(timings).map(([day, hours]) => (
              <div
                key={day}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid #f5f5f5',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>
                  {day}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: hours === 'Closed' ? '#C62828' : '#555',
                  }}
                >
                  {hours}
                </span>
              </div>
            ))}
          </div>
        )}

        {d.maps_url && (
          <a
            href={d.maps_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              marginTop: 14,
              padding: '12px',
              background: theme.accent,
              color: 'white',
              borderRadius: 12,
              textAlign: 'center',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            📍 Open in Google Maps
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      className="page"
      style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: 20 }}
    >
      <div
        className="header"
        style={{ background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
      >
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#333"
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>
          About Us
        </h2>
      </div>
      <div style={{ padding: '16px' }}>
        <ClinicSection type="homeopathy" />
        <ClinicSection type="leanlife" />
      </div>
    </div>
  );
}
