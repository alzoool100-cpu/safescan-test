const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_SUBJECT || 'admin@safescan.app'),
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { sticker_id, message } = JSON.parse(event.body || '{}');
    if (!sticker_id) {
      return { statusCode: 400, headers, body: 'Missing sticker_id' };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // sticker → vehicle → user
    const { data: sticker } = await supabase
      .from('stickers')
      .select('vehicle_id')
      .eq('id', sticker_id)
      .single();

    if (!sticker) return { statusCode: 200, headers, body: 'Sticker not found' };

    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('user_id')
      .eq('id', sticker.vehicle_id)
      .single();

    if (!vehicle) return { statusCode: 200, headers, body: 'Vehicle not found' };

    const { data: sub } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', vehicle.user_id)
      .single();

    if (!sub) return { statusCode: 200, headers, body: 'No subscription' };

    const subscription = JSON.parse(sub.subscription);
    const payload = JSON.stringify({
      title: '🚗 SafeScan',
      body: message ? message.substring(0, 80) : 'زائر أرسل رسالة لمركبتك',
      url: '/dashboard.html',
    });

    await webpush.sendNotification(subscription, payload);
    return { statusCode: 200, headers, body: 'sent' };

  } catch (err) {
    console.error('send-push error:', err.message);
    return { statusCode: 200, headers, body: 'attempted' };
  }
};
