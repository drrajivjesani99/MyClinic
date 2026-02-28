import { databases, DB_ID, COLS, ID, Query } from './appwrite'

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

// Send notification to ALL patients (for health tips)
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

// Mark notification as read
export async function markAsRead(notificationId) {
  try {
    await databases.updateDocument(DB_ID, COLS.notifications, notificationId, {
      is_read: true
    })
  } catch (err) {
    console.error('Mark read error:', err)
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
