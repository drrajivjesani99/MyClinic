import { supabase } from './supabase';

async function getOneSignalCredentials() {
  const { data } = await supabase
    .from('admin_settings')
    .select('onesignal_app_id, onesignal_api_key')
    .single();
  return data;
}

export async function sendPushNotification({ playerId, title, body }) {
  if (!playerId) return;
  try {
    const creds = await getOneSignalCredentials();
    if (!creds?.onesignal_app_id || !creds?.onesignal_api_key) return;

    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${creds.onesignal_api_key}`,
      },
      body: JSON.stringify({
        app_id: creds.onesignal_app_id,
        include_player_ids: [playerId],
        headings: { en: title },
        contents: { en: body },
      }),
    });
  } catch (err) {
    console.error('Push notification error:', err);
  }
}

export async function subscribeToNotifications() {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        await OneSignal.Notifications.requestPermission();
        const id = await OneSignal.User.PushSubscription.id;
        resolve(id || null);
      } catch {
        resolve(null);
      }
    });
  });
}

export async function getPlayerId() {
  return new Promise((resolve) => {
    if (!window.OneSignal) {
      resolve(null);
      return;
    }
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        const id = await OneSignal.User.PushSubscription.id;
        resolve(id || null);
      } catch {
        resolve(null);
      }
    });
  });
}
