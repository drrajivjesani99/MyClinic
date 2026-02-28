import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { sendPushNotification } from '../lib/notifications';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, logoutAdmin } = useApp();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({
    patients: 0,
    pending: 0,
    todayConfirmed: 0,
  });
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [banners, setBanners] = useState([]);
  const [clinicInfo, setClinicInfo] = useState({
    homeopathy: {},
    leanlife: {},
  });
  const [settings, setSettings] = useState({});
  const [search, setSearch] = useState('');
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    clinic_type: 'homeopathy',
    access_code: '',
  });
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [declineReason, setDeclineReason] = useState({});
  const [showDecline, setShowDecline] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    fetchAll();
  }, [isAdmin]);

  async function fetchAll() {
    await Promise.all([
      fetchStats(),
      fetchPatients(),
      fetchAppointments(),
      fetchBanners(),
      fetchClinicInfo(),
      fetchSettings(),
    ]);
  }

  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0];
    const [{ count: pc }, { count: pending }, { count: todayC }] =
      await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed')
          .eq('preferred_date', today),
      ]);
    setStats({
      patients: pc || 0,
      pending: pending || 0,
      todayConfirmed: todayC || 0,
    });
  }

  async function fetchPatients() {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    setPatients(data || []);
  }

  async function fetchAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });
    setAppointments(data || []);
  }

  async function fetchBanners() {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .order('display_order');
    setBanners(data || []);
  }

  async function fetchClinicInfo() {
    const { data } = await supabase.from('clinic_info').select('*');
    if (data) {
      const obj = {};
      data.forEach((d) => (obj[d.clinic_type] = d));
      setClinicInfo(obj);
    }
  }

  async function fetchSettings() {
    const { data } = await supabase.from('admin_settings').select('*').single();
    if (data) setSettings(data);
  }

  async function addPatient() {
    if (!newPatient.name || !newPatient.phone || !newPatient.access_code) {
      alert('Fill all fields');
      return;
    }
    await supabase.from('patients').insert(newPatient);
    setNewPatient({
      name: '',
      phone: '',
      clinic_type: 'homeopathy',
      access_code: '',
    });
    fetchPatients();
    fetchStats();
  }

  async function approveAppointment(appt) {
    await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appt.id);
    const { data: pat } = await supabase
      .from('patients')
      .select('fcm_token')
      .eq('id', appt.patient_id)
      .single();
    if (pat?.fcm_token) {
      await sendPushNotification({
        playerId: pat.fcm_token,
        title: 'Appointment Confirmed ✅',
        body: `Your appointment at ${
          appt.clinic_type === 'homeopathy'
            ? 'Homeopathy Clinic'
            : 'LeanLife Nutrition'
        } is confirmed for ${appt.preferred_date} at ${
          appt.preferred_time
        }. See you soon!`,
      });
    }
    fetchAppointments();
    fetchStats();
  }

  async function declineAppointment(appt) {
    const reason = declineReason[appt.id] || '';
    await supabase
      .from('appointments')
      .update({ status: 'declined', decline_reason: reason })
      .eq('id', appt.id);
    const { data: pat } = await supabase
      .from('patients')
      .select('fcm_token')
      .eq('id', appt.patient_id)
      .single();
    if (pat?.fcm_token) {
      await sendPushNotification({
        playerId: pat.fcm_token,
        title: 'Appointment Update ❌',
        body: `Your appointment at ${
          appt.clinic_type === 'homeopathy'
            ? 'Homeopathy Clinic'
            : 'LeanLife Nutrition'
        } has been declined. ${
          reason ? reason + '.' : ''
        } Please contact us to reschedule.`,
      });
    }
    setShowDecline(null);
    fetchAppointments();
    fetchStats();
  }

  async function addBanner() {
    if (!newBannerUrl) return;
    await supabase
      .from('banners')
      .insert({
        image_url: newBannerUrl,
        display_order: banners.length,
        is_active: true,
      });
    setNewBannerUrl('');
    fetchBanners();
  }

  async function deleteBanner(id) {
    await supabase.from('banners').delete().eq('id', id);
    fetchBanners();
  }

  async function saveClinicInfo(type) {
    const info = clinicInfo[type];
    if (info.id) {
      await supabase.from('clinic_info').update(info).eq('id', info.id);
    } else {
      await supabase.from('clinic_info').insert({ ...info, clinic_type: type });
    }
    alert('Saved!');
  }

  async function saveSettings() {
    await supabase
      .from('admin_settings')
      .update(settings)
      .eq('id', settings.id);
    alert('Settings saved!');
  }

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
  );

  const tabs = [
    { id: 'overview', label: '📊' },
    { id: 'patients', label: '👥' },
    { id: 'appointments', label: '📅' },
    { id: 'banners', label: '🖼️' },
    { id: 'clinic', label: '🏥' },
    { id: 'settings', label: '⚙️' },
  ];

  return (
    <div
      className="page"
      style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: 20 }}
    >
      <div
        style={{
          background: '#1A237E',
          padding: '16px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Admin Panel</h2>
          <p style={{ fontSize: 12, opacity: 0.7 }}>MyClinic Management</p>
        </div>
        <button
          onClick={() => {
            logoutAdmin();
            navigate('/');
          }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: 10,
            padding: '8px 14px',
            color: 'white',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          background: 'white',
          display: 'flex',
          borderBottom: '1px solid #eee',
          overflowX: 'auto',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              minWidth: 50,
              padding: '12px 8px',
              border: 'none',
              background: tab === t.id ? '#E8EAF6' : 'white',
              color: tab === t.id ? '#1A237E' : '#888',
              fontSize: 18,
              cursor: 'pointer',
              borderBottom:
                tab === t.id ? '3px solid #1A237E' : '3px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {tab === 'overview' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>
              Dashboard Overview
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 12,
              }}
            >
              {[
                {
                  label: 'Total Patients',
                  value: stats.patients,
                  color: '#1565C0',
                  bg: '#E3F2FD',
                  icon: '👥',
                },
                {
                  label: 'Pending',
                  value: stats.pending,
                  color: '#E65100',
                  bg: '#FFF3E0',
                  icon: '⏳',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: s.bg,
                    borderRadius: 16,
                    padding: 16,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div
                    style={{ fontSize: 32, fontWeight: 800, color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                background: '#E8F5E9',
                borderRadius: 16,
                padding: 16,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 28 }}>✅</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#2E7D32' }}>
                {stats.todayConfirmed}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Today's Confirmed Appointments
              </div>
            </div>
          </div>
        )}

        {tab === 'patients' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>
              Register New Patient
            </h3>
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <input
                  className="input"
                  placeholder="Patient Name"
                  value={newPatient.name}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, name: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Phone Number"
                  value={newPatient.phone}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, phone: e.target.value })
                  }
                />
                <select
                  className="input"
                  value={newPatient.clinic_type}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      clinic_type: e.target.value,
                    })
                  }
                >
                  <option value="homeopathy">Homeopathy</option>
                  <option value="leanlife">LeanLife</option>
                  <option value="both">Both</option>
                </select>
                <input
                  className="input"
                  placeholder="Access Code"
                  value={newPatient.access_code}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      access_code: e.target.value,
                    })
                  }
                />
                <button
                  onClick={addPatient}
                  style={{
                    padding: '13px',
                    border: 'none',
                    borderRadius: 12,
                    background: '#1A237E',
                    color: 'white',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Register Patient
                </button>
              </div>
            </div>
            <input
              className="input"
              placeholder="🔍 Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            {filtered.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 8,
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: '#888' }}>
                    {p.phone} · {p.clinic_type}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 20,
                    background: p.is_active ? '#C8E6C9' : '#FFCDD2',
                    color: p.is_active ? '#2E7D32' : '#C62828',
                  }}
                >
                  {p.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'appointments' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>
              All Appointments
            </h3>
            {appointments.map((appt) => (
              <div
                key={appt.id}
                style={{
                  background: 'white',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>
                      {appt.patient_name}
                    </p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      {appt.clinic_type === 'homeopathy'
                        ? '🌿 Homeopathy'
                        : '🥗 LeanLife'}
                    </p>
                    <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                      📅 {appt.preferred_date} · ⏰ {appt.preferred_time}
                    </p>
                    {appt.note && (
                      <p
                        style={{
                          fontSize: 12,
                          color: '#999',
                          fontStyle: 'italic',
                          marginTop: 4,
                        }}
                      >
                        "{appt.note}"
                      </p>
                    )}
                  </div>
                  <span className={`badge badge-${appt.status}`}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </span>
                </div>
                {appt.status === 'pending' && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => approveAppointment(appt)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: 10,
                        background: '#C8E6C9',
                        color: '#2E7D32',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() =>
                        setShowDecline(showDecline === appt.id ? null : appt.id)
                      }
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: 10,
                        background: '#FFCDD2',
                        color: '#C62828',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      ❌ Decline
                    </button>
                  </div>
                )}
                {showDecline === appt.id && (
                  <div style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder="Reason (optional)"
                      value={declineReason[appt.id] || ''}
                      onChange={(e) =>
                        setDeclineReason({
                          ...declineReason,
                          [appt.id]: e.target.value,
                        })
                      }
                      style={{ marginBottom: 8 }}
                    />
                    <button
                      onClick={() => declineAppointment(appt)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: 'none',
                        borderRadius: 10,
                        background: '#C62828',
                        color: 'white',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Confirm Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'banners' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>
              Banner Slides
            </h3>
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              }}
            >
              <input
                className="input"
                placeholder="Paste image URL here..."
                value={newBannerUrl}
                onChange={(e) => setNewBannerUrl(e.target.value)}
                style={{ marginBottom: 10 }}
              />
              <button
                onClick={addBanner}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: 12,
                  background: '#1A237E',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                + Add Banner
              </button>
            </div>
            {banners.map((b) => (
              <div
                key={b.id}
                style={{
                  background: 'white',
                  borderRadius: 14,
                  overflow: 'hidden',
                  marginBottom: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <img
                  src={b.image_url}
                  alt=""
                  style={{ width: '100%', height: 120, objectFit: 'cover' }}
                />
                <div
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: '#888',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.image_url}
                  </span>
                  <button
                    onClick={() => deleteBanner(b.id)}
                    style={{
                      background: '#FFEBEE',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 12px',
                      color: '#C62828',
                      cursor: 'pointer',
                      marginLeft: 8,
                      fontWeight: 700,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'clinic' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>
              Clinic Information
            </h3>
            {['homeopathy', 'leanlife'].map((type) => (
              <div
                key={type}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  borderTop: `4px solid ${
                    type === 'homeopathy' ? '#1565C0' : '#2E7D32'
                  }`,
                }}
              >
                <h4
                  style={{
                    color: type === 'homeopathy' ? '#1565C0' : '#2E7D32',
                    fontWeight: 700,
                    marginBottom: 14,
                    fontSize: 16,
                  }}
                >
                  {type === 'homeopathy'
                    ? '🌿 Homeopathy Clinic'
                    : '🥗 LeanLife Nutrition'}
                </h4>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {[
                    { key: 'doctor_name', label: 'Doctor/Counselor Name' },
                    { key: 'qualification', label: 'Qualification' },
                    { key: 'address', label: 'Address' },
                    { key: 'phone', label: 'Phone Number' },
                    { key: 'maps_url', label: 'Google Maps URL' },
                    { key: 'cover_photo_url', label: 'Cover Photo URL' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label
                        style={{
                          fontSize: 12,
                          color: '#666',
                          marginBottom: 4,
                          display: 'block',
                        }}
                      >
                        {field.label}
                      </label>
                      <input
                        className="input"
                        value={clinicInfo[type]?.[field.key] || ''}
                        onChange={(e) =>
                          setClinicInfo({
                            ...clinicInfo,
                            [type]: {
                              ...clinicInfo[type],
                              [field.key]: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: '#666',
                        marginBottom: 4,
                        display: 'block',
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      className="input"
                      rows={3}
                      value={clinicInfo[type]?.description || ''}
                      onChange={(e) =>
                        setClinicInfo({
                          ...clinicInfo,
                          [type]: {
                            ...clinicInfo[type],
                            description: e.target.value,
                          },
                        })
                      }
                      style={{ resize: 'none' }}
                    />
                  </div>
                  <button
                    onClick={() => saveClinicInfo(type)}
                    style={{
                      padding: '12px',
                      border: 'none',
                      borderRadius: 12,
                      background: type === 'homeopathy' ? '#1565C0' : '#2E7D32',
                      color: 'white',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Save {type === 'homeopathy' ? 'Homeopathy' : 'LeanLife'}{' '}
                    Info
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'settings' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>
              Settings
            </h3>
            <div
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {[
                  {
                    key: 'admin_password',
                    label: 'Admin Password',
                    type: 'password',
                  },
                  {
                    key: 'homeopathy_whatsapp',
                    label: 'Homeopathy WhatsApp Number',
                  },
                  {
                    key: 'leanlife_whatsapp',
                    label: 'LeanLife WhatsApp Number',
                  },
                  { key: 'callmebot_api_key', label: 'CallMeBot API Key' },
                  { key: 'onesignal_app_id', label: 'OneSignal App ID' },
                  { key: 'onesignal_api_key', label: 'OneSignal REST API Key' },
                ].map((field) => (
                  <div key={field.key}>
                    <label
                      style={{
                        fontSize: 12,
                        color: '#666',
                        marginBottom: 4,
                        display: 'block',
                      }}
                    >
                      {field.label}
                    </label>
                    <input
                      className="input"
                      type={field.type || 'text'}
                      value={settings[field.key] || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          [field.key]: e.target.value,
                        })
                      }
                    />
                  </div>
                ))}
                <button
                  onClick={saveSettings}
                  style={{
                    padding: '13px',
                    border: 'none',
                    borderRadius: 12,
                    background: '#1A237E',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                >
                  💾 Save All Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
