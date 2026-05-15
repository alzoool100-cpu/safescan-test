const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200, headers,
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

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  try {
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_SUBJECT || 'admin@safescan.app'),
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const { sticker_id, message } = JSON.parse(event.body || '{}');
    if (!sticker_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing sticker_id' }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data: sticker } = await supabase.from('stickers').select('vehicle_id').eq('id', sticker_id).maybeSingle();
    if (!sticker) { console.log('sticker not found:', sticker_id); return { statusCode: 200, headers, body: JSON.stringify({ step: 'no_sticker' }) }; }

    const { data: vehicle } = await supabase.from('vehicles').select('user_id').eq('id', sticker.vehicle_id).maybeSingle();
    if (!vehicle) { console.log('vehicle not found:', sticker.vehicle_id); return { statusCode: 200, headers, body: JSON.stringify({ step: 'no_vehicle' }) }; }

    // أحدث اشتراك فقط
    const { data: rows, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('subscription, created_at')
      .eq('user_id', vehicle.user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (subErr) { console.log('sub query error:', subErr.message); return { statusCode: 200, headers, body: JSON.stringify({ step: 'sub_error', msg: subErr.message }) }; }
    if (!rows || rows.length === 0) { console.log('no subscription for user:', vehicle.user_id); return { statusCode: 200, headers, body: JSON.stringify({ step: 'no_sub', user_id: vehicle.user_id }) }; }

    const subscription = JSON.parse(rows[0].subscription);
    const payload = JSON.stringify({
      title: '🚗 SafeScan',
      body: message ? message.substring(0, 80) : 'زائر أرسل رسالة لمركبتك',
      url: '/dashboard.html',
    });

    await webpush.sendNotification(subscription, payload);
    console.log('push sent to user:', vehicle.user_id);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error('send-push exception:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
