// Sends a push notification through Expo's push service.
// Fire-and-forget friendly: failures are logged, never thrown, so a push
// problem can never break the action that triggered it.
export async function sendPushNotification(
  token: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!token || !token.startsWith('ExponentPushToken')) {
    return; // No (valid) token registered for this user
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: 'default',
        ...(data && { data }),
      }),
    });

    if (!response.ok) {
      console.error('[push] Expo push API error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('[push] Failed to send push notification:', error);
  }
}
