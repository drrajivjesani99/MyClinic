import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { databases, DB_ID, COLS, ID, Query } from '../lib/appwrite'
import { useApp } from '../context/AppContext'
import { getNotifications, markAllAsRead } from '../lib/notifications'

export default function PatientDashboard() {
  const navigate = useNavigate()
  const { patient, logoutPatient } = useApp()
  const [appointments, setAppointments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ preferred_date: '', preferred_time: '', note: '' })
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('upcoming')
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const isHomeo = patient?.clinicType === 'homeopathy'
  const theme = isHomeo
    ? { bg: '#E3F2FD', accent: '#1565C0', btn: '#42A5F5' }
    : { bg: '#E8F5E9', accent: '#2E7D32', btn: '#66BB6A' }

  useEffect(() => {
    if (!patient) { navigate('/'); return }
    fetchAppointments()
    fetchNotifications()
  }, [patient])

  async function fetchAppointments() {
    try {
      const res = await databases.listDocuments(DB_ID, COLS.appointments, [
        Query.equal('patient_id', patient.$id),
        Query.orderDesc('$createdAt'),
        Query.limit(50)
      ])
      setAppointments(res.documents)
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchNotifications() {
    try {
      const notifs = await getNotifications(patient.$id)
      setNotifications(notifs)
      setUnreadCount(notifs.filter(n => !n.is_read).length)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleShowNotifs() {
    setShowNotifs(!showNotifs)
    if (!showNotifs && unreadCount > 0) {
      await markAllAsRead(patient.$id)
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
  }

  async function submitAppointment() {
    if (!form.preferred_date || !form.preferred_time) {
      alert('Please select date and time'); return
    }
    setLoading(true)
    try {
      await databases.createDocument(DB_ID, COLS.appointments, ID.unique(), {
        patient_id: patient.$id,
        patient_name: patient.name,
        phone: patient.phone,
        clinic_type: patient.clinicType,
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        note: form.note || '',
        status: 'pending',
        reminder_sent: false
      })
      setForm({ preferred_date: '', preferred_time: '', note: '' })
      setShowForm(false)
      fetchAppointments()
    } catch (err) {
      console.error(err)
      alert('Error submitting. Please try again.')
    }
    setLoading(false)
  }

  const upcoming = appointments.filter(a =>
    a.status === 'confirmed' && new Date(a.preferred_date) >= new Date()
  )

  function formatDate(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'Just now'
  }

  return (
    <div className="page" style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: 20 }}>

      {/* Header */}
      <div style={{ background: theme.accent, padding: '16px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 13, opacity: 0.85 }}>{patient?.clinicName}</p>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Hi, {patient?.name} 👋</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Bell notification button */}
            <button onClick={handleShowNotifs} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10,
              padding: '8px', cursor: 'pointer', color: 'white',
              fontSize: 18, position: 'relative'
            }}>
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: '#FF5252', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => { logoutPatient(); navigate('/') }} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10,
              padding: '8px 12px', cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 600
            }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifs && (
        <div style={{
          background: 'white', margin: '0 16px', borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)', marginTop: 12,
          overflow: 'hidden', maxHeight: 300, overflowY: 'auto'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>🔔 Notifications</span>
            <button onClick={() => setShowNotifs(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16
            }}>✕</button>
          </div>
          {notifications.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa', padding: '20px', fontSize: 14 }}>
              No notifications yet
            </p>
          ) : (
            notifications.map(n => (
              <div key={n.$id} style={{
                padding: '12px 16px', borderBottom: '1px solid #f8f8f8',
                background: n.is_read ? 'white' : '#F3F4FF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#333', marginBottom: 2 }}>
                      {n.type === 'health_tip' ? '💡' : n.type === 'confirmed' ? '✅' : n.type === 'declined' ? '❌' : '📋'} {n.title}
                    </p>
                    <p style={{ fontSize: 13, color: '#666', lineHeight: 1.4 }}>{n.message}</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#bbb', marginLeft: 8, whiteSpace: 'nowrap' }}>
                    {timeAgo(n.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {/* Next appointment */}
        {upcoming.length > 0 && (
          <div style={{
            background: 'white', borderRadius: 16, padding: 16, marginBottom: 16,
            borderLeft: `4px solid ${theme.accent}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
          }}>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Next Appointment</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: theme.accent }}>
              📅 {formatDate(upcoming[0].preferred_date)} at {upcoming[0].preferred_time}
            </p>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{patient?.clinicName}</p>
          </div>
        )}

        {/* Request button */}
        <button onClick={() => setShowForm(!showForm)} style={{
          width: '100%', padding: '15px', border: 'none', borderRadius: 14,
          background: showForm ? '#eee' : `linear-gradient(135deg, ${theme.accent}, ${theme.btn})`,
          color: showForm ? '#666' : 'white', fontSize: 16, fontWeight: 700,
          cursor: 'pointer', marginBottom: 16,
          boxShadow: showForm ? 'none' : `0 4px 16px ${theme.btn}40`
        }}>
          {showForm ? '✕ Cancel Request' : '+ Request New Appointment'}
        </button>

        {/* Form */}
        {showForm && (
          <div style={{
            background: 'white', borderRadius: 16, padding: 20, marginBottom: 16,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ fontWeight: 700, color: theme.accent, marginBottom: 16, fontSize: 16 }}>
              New Appointment Request
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: '#666', marginBottom: 6, display: 'block' }}>Preferred Date</label>
                <input type="date" className="input"
                  min={new Date().toISOString().split('T')[0]}
                  value={form.preferred_date}
                  onChange={e => setForm({ ...form, preferred_date: e.target.value })}
                  style={{ borderColor: theme.accent + '40' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#666', marginBottom: 6, display: 'block' }}>Preferred Time</label>
                <input type="time" className="input"
                  value={form.preferred_time}
                  onChange={e => setForm({ ...form, preferred_time: e.target.value })}
                  style={{ borderColor: theme.accent + '40' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#666', marginBottom: 6, display: 'block' }}>Note (Optional)</label>
                <textarea className="input" rows={3}
                  placeholder="Any specific concern or note..."
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  style={{ borderColor: theme.accent + '40', resize: 'none' }} />
              </div>
              <button onClick={submitAppointment} disabled={loading} style={{
                padding: '14px', border: 'none', borderRadius: 12,
                background: loading ? '#ccc' : theme.btn,
                color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer'
              }}>
                {loading ? 'Submitting...' : '📤 Submit Request'}
              </button>
            </div>
          </div>
        )}

        {/* Appointments list */}
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
            {['upcoming', 'all'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '12px', border: 'none',
                background: tab === t ? theme.bg : 'white',
                color: tab === t ? theme.accent : '#888',
                fontWeight: tab === t ? 700 : 400, fontSize: 14, cursor: 'pointer',
                borderBottom: tab === t ? `3px solid ${theme.accent}` : '3px solid transparent'
              }}>
                {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `All (${appointments.length})`}
              </button>
            ))}
          </div>
          <div style={{ padding: '12px' }}>
            {(tab === 'upcoming' ? upcoming : appointments).length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa', padding: '24px', fontSize: 14 }}>
                No appointments yet
              </p>
            ) : (
              (tab === 'upcoming' ? upcoming : appointments).map(appt => (
                <div key={appt.$id} style={{
                  padding: '14px', borderRadius: 12, marginBottom: 10,
                  background: '#f8f9fa', border: '1px solid #eee'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#333' }}>
                        📅 {formatDate(appt.preferred_date)}
                      </p>
                      <p style={{ fontSize: 13, color: '#666', marginTop: 2 }}>⏰ {appt.preferred_time}</p>
                      {appt.note && <p style={{ fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic' }}>"{appt.note}"</p>}
                    </div>
                    <span className={`badge badge-${appt.status}`}>
                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                    </span>
                  </div>
                  {appt.status === 'declined' && appt.decline_reason && (
                    <p style={{ fontSize: 12, color: '#C62828', marginTop: 8, background: '#FFEBEE', padding: '6px 10px', borderRadius: 8 }}>
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
  )
}
