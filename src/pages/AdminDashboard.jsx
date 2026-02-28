import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { databases, DB_ID, COLS, ID, Query } from '../lib/appwrite'
import { useApp } from '../context/AppContext'
import { sendInAppNotification, sendNotificationToAll } from '../lib/notifications'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { isAdmin, logoutAdmin } = useApp()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState({ patients: 0, pending: 0, todayConfirmed: 0 })
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [banners, setBanners] = useState([])
  const [clinicInfo, setClinicInfo] = useState({ homeopathy: {}, leanlife: {} })
  const [settings, setSettings] = useState({})
  const [flashcards, setFlashcards] = useState([])
  const [search, setSearch] = useState('')
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', clinic_type: 'homeopathy', access_code: '' })
  const [newBannerUrl, setNewBannerUrl] = useState('')
  const [declineReason, setDeclineReason] = useState({})
  const [showDecline, setShowDecline] = useState(null)
  const [newCard, setNewCard] = useState({ title: '', front_description: '', back_content: '', front_image_url: '', clinic_type: 'homeopathy' })
  const [showAddCard, setShowAddCard] = useState(false)

  useEffect(() => {
    if (!isAdmin) { navigate('/admin'); return }
    fetchAll()
  }, [isAdmin])

  async function fetchAll() {
    await Promise.all([fetchStats(), fetchPatients(), fetchAppointments(), fetchBanners(), fetchClinicInfo(), fetchSettings(), fetchFlashcards()])
  }

  async function fetchStats() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [pc, pending, todayC] = await Promise.all([
        databases.listDocuments(DB_ID, COLS.patients, [Query.limit(1)]),
        databases.listDocuments(DB_ID, COLS.appointments, [Query.equal('status', 'pending'), Query.limit(1)]),
        databases.listDocuments(DB_ID, COLS.appointments, [Query.equal('status', 'confirmed'), Query.equal('preferred_date', today), Query.limit(1)])
      ])
      setStats({ patients: pc.total, pending: pending.total, todayConfirmed: todayC.total })
    } catch (err) { console.error(err) }
  }

  async function fetchPatients() {
    try {
      const res = await databases.listDocuments(DB_ID, COLS.patients, [Query.orderDesc('$createdAt'), Query.limit(100)])
      setPatients(res.documents)
    } catch (err) { console.error(err) }
  }

  async function fetchAppointments() {
    try {
      const res = await databases.listDocuments(DB_ID, COLS.appointments, [Query.orderDesc('$createdAt'), Query.limit(100)])
      setAppointments(res.documents)
    } catch (err) { console.error(err) }
  }

  async function fetchBanners() {
    try {
      const res = await databases.listDocuments(DB_ID, COLS.banners, [Query.orderAsc('display_order')])
      setBanners(res.documents)
    } catch (err) { console.error(err) }
  }

  async function fetchClinicInfo() {
    try {
      const res = await databases.listDocuments(DB_ID, COLS.clinic_info)
      const obj = { homeopathy: {}, leanlife: {} }
      res.documents.forEach(d => { obj[d.clinic_type] = d })
      setClinicInfo(obj)
    } catch (err) { console.error(err) }
  }

  async function fetchSettings() {
    try {
      const doc = await databases.getDocument(DB_ID, COLS.admin_settings, 'main')
      setSettings(doc)
    } catch (err) { console.error(err) }
  }

  async function fetchFlashcards() {
    try {
      const res = await databases.listDocuments(DB_ID, COLS.flashcards, [Query.orderAsc('display_order')])
      setFlashcards(res.documents)
    } catch (err) { console.error(err) }
  }

  async function addPatient() {
    if (!newPatient.name || !newPatient.phone || !newPatient.access_code) {
      alert('Fill all fields'); return
    }
    try {
      await databases.createDocument(DB_ID, COLS.patients, ID.unique(), {
        ...newPatient, is_active: true
      })
      setNewPatient({ name: '', phone: '', clinic_type: 'homeopathy', access_code: '' })
      fetchPatients(); fetchStats()
    } catch (err) { console.error(err) }
  }

  async function approveAppointment(appt) {
    try {
      await databases.updateDocument(DB_ID, COLS.appointments, appt.$id, { status: 'confirmed' })
      await sendInAppNotification({
        patientId: appt.patient_id,
        title: 'Appointment Confirmed ✅',
        message: `Your appointment at ${appt.clinic_type === 'homeopathy' ? 'Homeopathy Clinic' : 'LeanLife Nutrition'} is confirmed for ${appt.preferred_date} at ${appt.preferred_time}. See you soon!`,
        type: 'confirmed'
      })
      fetchAppointments(); fetchStats()
    } catch (err) { console.error(err) }
  }

  async function declineAppointment(appt) {
    const reason = declineReason[appt.$id] || ''
    try {
      await databases.updateDocument(DB_ID, COLS.appointments, appt.$id, { status: 'declined', decline_reason: reason })
      await sendInAppNotification({
        patientId: appt.patient_id,
        title: 'Appointment Update ❌',
        message: `Your appointment at ${appt.clinic_type === 'homeopathy' ? 'Homeopathy Clinic' : 'LeanLife Nutrition'} has been declined. ${reason ? reason + '.' : ''} Please contact us to reschedule.`,
        type: 'declined'
      })
      setShowDecline(null)
      fetchAppointments(); fetchStats()
    } catch (err) { console.error(err) }
  }

  async function addBanner() {
    if (!newBannerUrl) return
    try {
      await databases.createDocument(DB_ID, COLS.banners, ID.unique(), {
        image_url: newBannerUrl, display_order: banners.length, is_active: true
      })
      setNewBannerUrl('')
      fetchBanners()
    } catch (err) { console.error(err) }
  }

  async function deleteBanner(id) {
    try {
      await databases.deleteDocument(DB_ID, COLS.banners, id)
      fetchBanners()
    } catch (err) { console.error(err) }
  }

  async function saveClinicInfo(type) {
    try {
      const info = clinicInfo[type]
      const { $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, ...data } = info
      if ($id) {
        await databases.updateDocument(DB_ID, COLS.clinic_info, $id, data)
      } else {
        await databases.createDocument(DB_ID, COLS.clinic_info, ID.unique(), { ...data, clinic_type: type })
      }
      alert('Saved!')
    } catch (err) { console.error(err); alert('Error saving') }
  }

  async function saveSettings() {
    try {
      const { $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, $sequence, ...data } = settings
      await databases.updateDocument(DB_ID, COLS.admin_settings, 'main', data)
      alert('Settings saved!')
    } catch (err) { console.error(err); alert('Error saving') }
  }

  async function addFlashcard() {
    if (!newCard.title || !newCard.back_content) { alert('Title and back content required'); return }
    try {
      await databases.createDocument(DB_ID, COLS.flashcards, ID.unique(), {
        ...newCard,
        display_order: flashcards.length,
        is_active: true,
        front_image_url: newCard.front_image_url || '',
        front_description: newCard.front_description || ''
      })
      // Send notification to all patients
      await sendNotificationToAll({
        title: '💡 New Health Tip Added!',
        message: `Check out the new health tip: "${newCard.title}" in the Health Tips section.`,
        type: 'health_tip'
      })
      setNewCard({ title: '', front_description: '', back_content: '', front_image_url: '', clinic_type: 'homeopathy' })
      setShowAddCard(false)
      fetchFlashcards()
      alert('Health tip added and patients notified!')
    } catch (err) { console.error(err) }
  }

  async function deleteFlashcard(id) {
    try {
      await databases.deleteDocument(DB_ID, COLS.flashcards, id)
      fetchFlashcards()
    } catch (err) { console.error(err) }
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  )

  const tabs = [
    { id: 'overview', label: '📊' },
    { id: 'patients', label: '👥' },
    { id: 'appointments', label: '📅' },
    { id: 'banners', label: '🖼️' },
    { id: 'tips', label: '💡' },
    { id: 'clinic', label: '🏥' },
    { id: 'settings', label: '⚙️' },
  ]

  return (
    <div className="page" style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: 20 }}>
      <div style={{ background: '#1A237E', padding: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Admin Panel</h2>
          <p style={{ fontSize: 12, opacity: 0.7 }}>MyClinic Management</p>
        </div>
        <button onClick={() => { logoutAdmin(); navigate('/') }} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
          padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: 13
        }}>Logout</button>
      </div>

      <div style={{ background: 'white', display: 'flex', borderBottom: '1px solid #eee', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, minWidth: 44, padding: '12px 6px', border: 'none',
            background: tab === t.id ? '#E8EAF6' : 'white',
            color: tab === t.id ? '#1A237E' : '#888',
            fontSize: 18, cursor: 'pointer',
            borderBottom: tab === t.id ? '3px solid #1A237E' : '3px solid transparent'
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>Dashboard Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Total Patients', value: stats.patients, color: '#1565C0', bg: '#E3F2FD', icon: '👥' },
                { label: 'Pending', value: stats.pending, color: '#E65100', bg: '#FFF3E0', icon: '⏳' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#E8F5E9', borderRadius: 16, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28 }}>✅</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#2E7D32' }}>{stats.todayConfirmed}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Today's Confirmed</div>
            </div>
          </div>
        )}

        {/* PATIENTS */}
        {tab === 'patients' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>Register New Patient</h3>
            <div style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="input" placeholder="Patient Name" value={newPatient.name}
                  onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} />
                <input className="input" placeholder="Phone Number" value={newPatient.phone}
                  onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
                <select className="input" value={newPatient.clinic_type}
                  onChange={e => setNewPatient({ ...newPatient, clinic_type: e.target.value })}>
                  <option value="homeopathy">Homeopathy</option>
                  <option value="leanlife">LeanLife</option>
                  <option value="both">Both</option>
                </select>
                <input className="input" placeholder="Access Code" value={newPatient.access_code}
                  onChange={e => setNewPatient({ ...newPatient, access_code: e.target.value })} />
                <button onClick={addPatient} style={{
                  padding: '13px', border: 'none', borderRadius: 12,
                  background: '#1A237E', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer'
                }}>+ Register Patient</button>
              </div>
            </div>
            <input className="input" placeholder="🔍 Search patients..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ marginBottom: 12 }} />
            {filtered.map(p => (
              <div key={p.$id} style={{
                background: 'white', borderRadius: 12, padding: '12px 16px', marginBottom: 8,
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: '#888' }}>{p.phone} · {p.clinic_type}</p>
                </div>
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 20,
                  background: p.is_active ? '#C8E6C9' : '#FFCDD2',
                  color: p.is_active ? '#2E7D32' : '#C62828'
                }}>{p.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            ))}
          </div>
        )}

        {/* APPOINTMENTS */}
        {tab === 'appointments' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>All Appointments</h3>
            {appointments.map(appt => (
              <div key={appt.$id} style={{
                background: 'white', borderRadius: 14, padding: 14, marginBottom: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{appt.patient_name}</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      {appt.clinic_type === 'homeopathy' ? '🌿 Homeopathy' : '🥗 LeanLife'}
                    </p>
                    <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                      📅 {appt.preferred_date} · ⏰ {appt.preferred_time}
                    </p>
                    {appt.note && <p style={{ fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 4 }}>"{appt.note}"</p>}
                  </div>
                  <span className={`badge badge-${appt.status}`}>
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </span>
                </div>
                {appt.status === 'pending' && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button onClick={() => approveAppointment(appt)} style={{
                      flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                      background: '#C8E6C9', color: '#2E7D32', fontWeight: 700, cursor: 'pointer', fontSize: 14
                    }}>✅ Approve</button>
                    <button onClick={() => setShowDecline(showDecline === appt.$id ? null : appt.$id)} style={{
                      flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                      background: '#FFCDD2', color: '#C62828', fontWeight: 700, cursor: 'pointer', fontSize: 14
                    }}>❌ Decline</button>
                  </div>
                )}
                {showDecline === appt.$id && (
                  <div style={{ marginTop: 10 }}>
                    <input className="input" placeholder="Reason (optional)"
                      value={declineReason[appt.$id] || ''}
                      onChange={e => setDeclineReason({ ...declineReason, [appt.$id]: e.target.value })}
                      style={{ marginBottom: 8 }} />
                    <button onClick={() => declineAppointment(appt)} style={{
                      width: '100%', padding: '10px', border: 'none', borderRadius: 10,
                      background: '#C62828', color: 'white', fontWeight: 700, cursor: 'pointer'
                    }}>Confirm Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* BANNERS */}
        {tab === 'banners' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>Banner Slides</h3>
            <div style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <input className="input" placeholder="Paste image URL here..." value={newBannerUrl}
                onChange={e => setNewBannerUrl(e.target.value)} style={{ marginBottom: 10 }} />
              <button onClick={addBanner} style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: 12,
                background: '#1A237E', color: 'white', fontWeight: 700, cursor: 'pointer'
              }}>+ Add Banner</button>
            </div>
            {banners.map(b => (
              <div key={b.$id} style={{
                background: 'white', borderRadius: 14, overflow: 'hidden', marginBottom: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <img src={b.image_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.image_url}
                  </span>
                  <button onClick={() => deleteBanner(b.$id)} style={{
                    background: '#FFEBEE', border: 'none', borderRadius: 8,
                    padding: '6px 12px', color: '#C62828', cursor: 'pointer', marginLeft: 8, fontWeight: 700
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HEALTH TIPS */}
        {tab === 'tips' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>Health Tips / Flashcards</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
              💡 When you add a new health tip all patients will receive an in-app notification automatically!
            </p>
            <button onClick={() => setShowAddCard(!showAddCard)} style={{
              width: '100%', padding: '13px', border: 'none', borderRadius: 12,
              background: showAddCard ? '#eee' : '#1A237E',
              color: showAddCard ? '#666' : 'white', fontWeight: 700, cursor: 'pointer', marginBottom: 16
            }}>
              {showAddCard ? '✕ Cancel' : '+ Add New Health Tip'}
            </button>

            {showAddCard && (
              <div style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input className="input" placeholder="Title *" value={newCard.title}
                    onChange={e => setNewCard({ ...newCard, title: e.target.value })} />
                  <select className="input" value={newCard.clinic_type}
                    onChange={e => setNewCard({ ...newCard, clinic_type: e.target.value })}>
                    <option value="homeopathy">Homeopathy</option>
                    <option value="leanlife">LeanLife</option>
                    <option value="both">Both</option>
                  </select>
                  <input className="input" placeholder="Front Image URL (optional)" value={newCard.front_image_url}
                    onChange={e => setNewCard({ ...newCard, front_image_url: e.target.value })} />
                  <textarea className="input" rows={2} placeholder="Front description (optional)"
                    value={newCard.front_description}
                    onChange={e => setNewCard({ ...newCard, front_description: e.target.value })}
                    style={{ resize: 'none' }} />
                  <textarea className="input" rows={4} placeholder="Back content (detailed info) *"
                    value={newCard.back_content}
                    onChange={e => setNewCard({ ...newCard, back_content: e.target.value })}
                    style={{ resize: 'none' }} />
                  <button onClick={addFlashcard} style={{
                    padding: '13px', border: 'none', borderRadius: 12,
                    background: '#2E7D32', color: 'white', fontWeight: 700, cursor: 'pointer'
                  }}>
                    💡 Add Health Tip + Notify All Patients
                  </button>
                </div>
              </div>
            )}

            {flashcards.map(card => (
              <div key={card.$id} style={{
                background: 'white', borderRadius: 14, padding: 14, marginBottom: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{card.title}</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      {card.clinic_type === 'homeopathy' ? '🌿 Homeopathy' : card.clinic_type === 'leanlife' ? '🥗 LeanLife' : '🌿🥗 Both'}
                    </p>
                    {card.front_description && (
                      <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{card.front_description}</p>
                    )}
                  </div>
                  <button onClick={() => deleteFlashcard(card.$id)} style={{
                    background: '#FFEBEE', border: 'none', borderRadius: 8,
                    padding: '6px 12px', color: '#C62828', cursor: 'pointer', fontWeight: 700, fontSize: 12
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CLINIC INFO */}
        {tab === 'clinic' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>Clinic Information</h3>
            {['homeopathy', 'leanlife'].map(type => (
              <div key={type} style={{
                background: 'white', borderRadius: 16, padding: 16, marginBottom: 16,
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                borderTop: `4px solid ${type === 'homeopathy' ? '#1565C0' : '#2E7D32'}`
              }}>
                <h4 style={{ color: type === 'homeopathy' ? '#1565C0' : '#2E7D32', fontWeight: 700, marginBottom: 14, fontSize: 16 }}>
                  {type === 'homeopathy' ? '🌿 Homeopathy Clinic' : '🥗 LeanLife Nutrition'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { key: 'doctor_name', label: 'Doctor/Counselor Name' },
                    { key: 'qualification', label: 'Qualification' },
                    { key: 'address', label: 'Address' },
                    { key: 'phone', label: 'Phone Number' },
                    { key: 'maps_url', label: 'Google Maps URL' },
                    { key: 'cover_photo_url', label: 'Cover Photo URL' },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>{field.label}</label>
                      <input className="input" value={clinicInfo[type]?.[field.key] || ''}
                        onChange={e => setClinicInfo({
                          ...clinicInfo,
                          [type]: { ...clinicInfo[type], [field.key]: e.target.value }
                        })} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>Description</label>
                    <textarea className="input" rows={3} value={clinicInfo[type]?.description || ''}
                      onChange={e => setClinicInfo({
                        ...clinicInfo,
                        [type]: { ...clinicInfo[type], description: e.target.value }
                      })} style={{ resize: 'none' }} />
                  </div>
                  <button onClick={() => saveClinicInfo(type)} style={{
                    padding: '12px', border: 'none', borderRadius: 12,
                    background: type === 'homeopathy' ? '#1565C0' : '#2E7D32',
                    color: 'white', fontWeight: 700, cursor: 'pointer'
                  }}>
                    Save {type === 'homeopathy' ? 'Homeopathy' : 'LeanLife'} Info
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1A237E' }}>Settings</h3>
            <div style={{ background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { key: 'admin_password', label: 'Admin Password', type: 'password' },
                  { key: 'homeopathy_whatsapp', label: 'Homeopathy WhatsApp Number' },
                  { key: 'leanlife_whatsapp', label: 'LeanLife WhatsApp Number' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: 12, color: '#666', marginBottom: 4, display: 'block' }}>{field.label}</label>
                    <input className="input" type={field.type || 'text'}
                      value={settings[field.key] || ''}
                      onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} />
                  </div>
                ))}
                <button onClick={saveSettings} style={{
                  padding: '13px', border: 'none', borderRadius: 12,
                  background: '#1A237E', color: 'white', fontWeight: 700, cursor: 'pointer', marginTop: 4
                }}>💾 Save All Settings</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
