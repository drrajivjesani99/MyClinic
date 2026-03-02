import { databases, DB_ID, COLS, ID, Query } from './appwrite'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Subscribe browser to push notifications
export async function subscribeToPush(patientId = '') {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push not supported')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Permission denied')
      return null
    }

    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    const sub = subscription.toJSON()

    // Save to Appwrite
    await databases.createDocument(DB_ID, 'push_subscriptions', ID.unique(), {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      patient_id: patientId
    })

    console.log('✅ Push subscription saved')
    return subscription
  } catch (err) {
    console.error('Push subscription error:', err)
    return null
  }
}

// Send in-app notification to a specific patient
export async function sendInAppNotification({ patientId, title, message, type }) {
  try {
    await databases.createDocument(DB_ID, COLS.notifications, ID.unique(), {
      patient_id: patientId,
      title,
      message,
      type: type || 'general',
      is_read: false,
      created_at: new Date().toISOString()
    })
  } catch (err) {
    console.error('Notification error:', err)
  }
}

// Send in-app notification to ALL patients
export async function sendNotificationToAll({ title, message, type }) {
  try {
    const res = await databases.listDocuments(DB_ID, COLS.patients, [
      Query.equal('is_active', true),
      Query.limit(100)
    ])
    for (const patient of res.documents) {
      await databases.createDocument(DB_ID, COLS.notifications, ID.unique(), {
        patient_id: patient.$id,
        title,
        message,
        type: type || 'health_tip',
        is_read: false,
        created_at: new Date().toISOString()
      })
    }
  } catch (err) {
    console.error('Broadcast notification error:', err)
  }
}

// Send PUSH notification to ALL subscribers via Vercel API
export async function sendPushToAll({ title, body }) {
  try {
    const res = await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body })
    })
    const data = await res.json()
    console.log('Push sent:', data)
  } catch (err) {
    console.error('Push send error:', err)
  }
}

// Get notifications for a patient
export async function getNotifications(patientId) {
  try {
    const res = await databases.listDocuments(DB_ID, COLS.notifications, [
      Query.equal('patient_id', patientId),
      Query.orderDesc('created_at'),
      Query.limit(50)
    ])
    return res.documents
  } catch (err) {
    console.error('Get notifications error:', err)
    return []
  }
}

// Mark all notifications as read
export async function markAllAsRead(patientId) {
  try {
    const res = await databases.listDocuments(DB_ID, COLS.notifications, [
      Query.equal('patient_id', patientId),
      Query.equal('is_read', false),
      Query.limit(100)
    ])
    for (const n of res.documents) {
      await databases.updateDocument(DB_ID, COLS.notifications, n.$id, { is_read: true })
    }
  } catch (err) {
    console.error('Mark all read error:', err)
  }
}
