import webpush from 'web-push'

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
const APPWRITE_PROJECT = '69a31567000163cd12f4'
const APPWRITE_KEY = 'standard_b8f441293643d35c4452289f65df333d1c1cc65eb0183a4075d3c8c0961ecdaec27a68ffde2b093b322a624028e607bd8096cb485141f86eaabf6870395c7da6ec5c10ce3134807326aee5e911de4e4e36404c4786ad56c409316340c7600dff216f5fa0efa4c990f73f716443eec1a5f7502962c489cf9dcdae95c5ee4f845f'
const DB_ID = '69a315a400098983d4e1'

webpush.setVapidDetails(
  'mailto:drrajivjesani9@gmail.com',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { title, body } = req.body

  try {
    // Get all push subscriptions from Appwrite
    const response = await fetch(
      `${APPWRITE_ENDPOINT}/databases/${DB_ID}/collections/push_subscriptions/documents?queries[]=limit(500)`,
      {
        headers: {
          'X-Appwrite-Project': APPWRITE_PROJECT,
          'X-Appwrite-Key': APPWRITE_KEY
        }
      }
    )
    const data = await response.json()
    const subscriptions = data.documents || []

    let sent = 0
    let failed = 0

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          JSON.stringify({ title, body, url: '/' })
        )
        sent++
      } catch (err) {
        failed++
        // Delete expired subscriptions
        if (err.statusCode === 410) {
          await fetch(
            `${APPWRITE_ENDPOINT}/databases/${DB_ID}/collections/push_subscriptions/documents/${sub.$id}`,
            {
              method: 'DELETE',
              headers: {
                'X-Appwrite-Project': APPWRITE_PROJECT,
                'X-Appwrite-Key': APPWRITE_KEY
              }
            }
          )
        }
      }
    }

    res.json({ success: true, sent, failed, total: subscriptions.length })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
