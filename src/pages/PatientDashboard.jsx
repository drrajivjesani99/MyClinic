import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import {
  sendPushNotification,
  subscribeToNotifications,
  getPlayerId,
} from '../lib/notifications';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { patient, logoutPatient } = useApp();
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    preferred_date: '',
    preferred_time: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [notifOn, setNotifOn] = useState(
    () => localStorage.getItem('notif_enabled') === 'true'
  );
  const [tab, setTab] = useState('upcoming');

  const isHomeo = patient?.clinicType === 'homeopathy';
  const theme = isHomeo
    ? { bg: '#E3F2FD', accent: '#1565C0', btn: '#42A5F5', card: '#BBDEFB' }
    : { bg: '#E8F5E9', accent: '#2E7D32', btn: '#66BB6A', card: '#C8E6C9' };

  useEffect(() => {
    if (!patient) {
      navigate('/');
      return;
    }
    fetchAppointments();
  }, [patient]);

  async function fetchAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });
    setAppointments(data || []);
  }

  async function toggleNotifications() {
    if (!notifOn) {
      const playerId = await subscribeToNotifications();
      if (playerId) {
        await supabase
          .from('patients')
          .update({ fcm_token: playerId })
          .eq('id', patient.id);
        setNotifOn(true);
        localStorage.setItem('notif_enabled', 'true');
      }
    } else {
      await supabase
        .from('patients')
        .update({ fcm_token: null })
        .eq('id', patient.id);
      setNotifOn(false);
      localStorage.setItem('notif_enabled', 'false');
    }
  }

  async function submitAppointment() {
    if (!form.preferred_date || !form.preferred_time) {
      alert('Please select date and time');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('appointments').insert({
      patient_id: patient.id,
      patient_name: patient.name,
      phone: patient.phone,
      clinic_type: patient.clinicType,
      preferred_date: form.preferred_date,
      preferred_time: form.preferred_time,
      note: form.note,
      status: 'pending',
      reminder_sent: false,
    });
    if (!error) {
      const playerId = await getPlayerId();
      if (playerId) {
        await sendPushNotification({
          playerId,
          title: 'Request Received 📋',
          body: `Your appointment request at ${patient.clinicName} for ${form.preferred_date} at ${form.preferred_time} has been received. We will confirm it shortly.`,
        });
      }
      setForm({ preferred_date: '', preferred_time: '', note: '' });
      setShowForm(false);
      fetchAppointments();
    }
    setLoading(false);
  }

  const upcoming = appointments.filter(
    (a) => a.status === 'confirmed' && new Date(a.preferred_date) >= new Date()
  );
  const all = appointments;

  function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div
      className="page"
      style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: 20 }}
    >
      <div
        style={{ background: theme.accent, padding: '16px', color: 'white' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <p style={{ fontSize: 13, opacity: 0.85 }}>{patient?.clinicName}</p>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>
              Hi, {patient?.name} 👋
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={toggleNotifications}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 10,
                padding: '8px',
                cursor: 'pointer',
                color: 'white',
                fontSize: 18,
              }}
            >
              {notifOn ? '🔔' : '🔕'}
            </button>
            <button
              onClick={() => {
                logoutPatient();
                navigate('/');
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 10,
                padding: '8px 12px',
                cursor: 'pointer',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <p style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
          {notifOn
            ? '🔔 Notifications enabled'
            : '🔕 Tap bell to enable reminders'}
        </p>
      </div>

      <div style={{ padding: '16px' }}>
        {upcoming.length > 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderLeft: `4px solid ${theme.accent}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
              Next Appointment
            </p>
            <p style={{ fontSize: 17, fontWeight: 700, color: theme.accent }}>
              📅 {formatDate(upcoming[0].preferred_date)} at{' '}
              {upcoming[0].preferred_time}
            </p>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              {patient?.clinicName}
            </p>
          </div>
        )}

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            width: '100%',
            padding: '15px',
            border: 'none',
            borderRadius: 14,
            background: showForm
              ? '#eee'
              : `linear-gradient(135deg, ${theme.accent}, ${theme.btn})`,
            color: showForm ? '#666' : 'white',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 16,
            boxShadow: showForm ? 'none' : `0 4px 16px ${theme.btn}40`,
          }}
        >
          {showForm ? '✕ Cancel Request' : '+ Request New Appointment'}
        </button>

        {showForm && (
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                color: theme.accent,
                marginBottom: 16,
                fontSize: 16,
              }}
            >
              New Appointment Request
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: '#666',
                    marginBottom: 6,
                    display: 'block',
                  }}
                >
                  Preferred Date
                </label>
                <input
                  type="date"
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.preferred_date}
                  onChange={(e) =>
                    setForm({ ...form, preferred_date: e.target.value })
                  }
                  style={{ borderColor: theme.accent + '40' }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: '#666',
                    marginBottom: 6,
                    display: 'block',
                  }}
                >
                  Preferred Time
                </label>
                <input
                  type="time"
                  className="input"
                  value={form.preferred_time}
                  onChange={(e) =>
                    setForm({ ...form, preferred_time: e.target.value })
                  }
                  style={{ borderColor: theme.accent + '40' }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    color: '#666',
                    marginBottom: 6,
                    display: 'block',
                  }}
                >
                  Note (Optional)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Any specific concern or note..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  style={{ borderColor: theme.accent + '40', resize: 'none' }}
                />
              </div>
              <button
                onClick={submitAppointment}
                disabled={loading}
                style={{
                  padding: '14px',
                  border: 'none',
                  borderRadius: 12,
                  background: loading ? '#ccc' : theme.btn,
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {loading ? 'Submitting...' : '📤 Submit Request'}
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            background: 'white',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
            {['upcoming', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  background: tab === t ? theme.bg : 'white',
                  color: tab === t ? theme.accent : '#888',
                  fontWeight: tab === t ? 700 : 400,
                  fontSize: 14,
                  cursor: 'pointer',
                  borderBottom:
                    tab === t
                      ? `3px solid ${theme.accent}`
                      : '3px solid transparent',
                }}
              >
                {t === 'upcoming'
                  ? `Upcoming (${upcoming.length})`
                  : `All (${all.length})`}
              </button>
            ))}
          </div>
          <div style={{ padding: '12px' }}>
            {(tab === 'upcoming' ? upcoming : all).length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#aaa',
                  padding: '24px',
                  fontSize: 14,
                }}
              >
                No appointments yet
              </p>
            ) : (
              (tab === 'upcoming' ? upcoming : all).map((appt) => (
                <div
                  key={appt.id}
                  style={{
                    padding: '14px',
                    borderRadius: 12,
                    marginBottom: 10,
                    background: '#f8f9fa',
                    border: '1px solid #eee',
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
                      <p
                        style={{ fontWeight: 700, fontSize: 15, color: '#333' }}
                      >
                        📅 {formatDate(appt.preferred_date)}
                      </p>
                      <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                        ⏰ {appt.preferred_time}
                      </p>
                      {appt.note && (
                        <p
                          style={{
                            fontSize: 12,
                            color: '#888',
                            marginTop: 4,
                            fontStyle: 'italic',
                          }}
                        >
                          "{appt.note}"
                        </p>
                      )}
                    </div>
                    <span className={`badge badge-${appt.status}`}>
                      {appt.status.charAt(0).toUpperCase() +
                        appt.status.slice(1)}
                    </span>
                  </div>
                  {appt.status === 'declined' && appt.decline_reason && (
                    <p
                      style={{
                        fontSize: 12,
                        color: '#C62828',
                        marginTop: 8,
                        background: '#FFEBEE',
                        padding: '6px 10px',
                        borderRadius: 8,
                      }}
                    >
                      Reason: {appt.decline_reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
