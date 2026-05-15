const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // GET → diagnostic endpoint
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        env: {
          VAPID_PUBLIC_KEY:    !!process.env.VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY:   !!process.env.VAPID_PRIVATE_KEY,
          VAPID_SUBJECT:       !!process.env.VAPID_SUBJECT,
          SUPABASE_URL:        !!process.env.SUPABASE_URL,
          SUPABASE_SERVICE_KEY:!!process.env.SUPABASE_SERVICE_KEY,
        },
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Set VAPID inside handler so errors are catchable
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_SUBJECT || 'admin@safescan.app'),
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const { sticker_id, message } = JSON.parse(event.body || '{}');
    if (!sticker_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing sticker_id' }) };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: sticker, error: e1 } = await supabase
      .from('stickers').select('vehicle_id').eq('id', sticker_id).maybeSingle();
    if (!sticker) return { statusCode: 200, headers, body: JSON.stringify({ step: 'sticker_not_found', e1 }) };

    const { data: vehicle, error: e2 } = await supabase
      .from('vehicles').select('user_id').eq('id', sticker.vehicle_id).maybeSingle();
    if (!vehicle) return { statusCode: 200, headers, body: JSON.stringify({ step: 'vehicle_not_found', e2 }) };

    const { data: sub, error: e3 } = await supabase
      .from('push_subscriptions').select('subscription').eq('user_id', vehicle.user_id).maybeSingle();
    if (!sub) return { statusCode: 200, headers, body: JSON.stringify({ step: 'no_subscription', user_id: vehicle.user_id, e3 }) };

    const subscription = JSON.parse(sub.subscription);
    const payload = JSON.stringify({
      title: '🚗 SafeScan',
      body: message ? message.substring(0, 80) : 'زائر أرسل رسالة لمركبتك',
      url: '/dashboard.html',
    });

    await webpush.sendNotification(subscription, payload);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, step: 'sent' }) };

  } catch (err) {
    console.error('send-push error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message, step: 'exception' }) };
  }
};
