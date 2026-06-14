const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (event.httpMethod === 'GET') {
    return { statusCode: 200, headers, body: JSON.stringify({
      ok: true,
      service: 'OneSignal',
      env: {
        SUPABASE_URL:           !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_KEY:   !!process.env.SUPABASE_SERVICE_KEY,
        ONESIGNAL_APP_ID:       !!process.env.ONESIGNAL_APP_ID,
        ONESIGNAL_REST_API_KEY: !!process.env.ONESIGNAL_REST_API_KEY,
      }
    })};
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  try {
    const { sticker_id, message } = JSON.parse(event.body || '{}');
    if (!sticker_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing sticker_id' }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data: sticker } = await supabase.from('stickers').select('vehicle_id').eq('id', sticker_id).maybeSingle();
    if (!sticker) { console.log('sticker not found:', sticker_id); return { statusCode: 200, headers, body: JSON.stringify({ step: 'no_sticker' }) }; }

    const { data: vehicle } = await supabase.from('vehicles').select('user_id').eq('id', sticker.vehicle_id).maybeSingle();
    if (!vehicle) { console.log('vehicle not found'); return { statusCode: 200, headers, body: JSON.stringify({ step: 'no_vehicle' }) }; }

    const pushBody = message ? message.substring(0, 80) : 'زائر أرسل رسالة لمركبتك';

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        include_external_user_ids: [vehicle.user_id],
        channel_for_external_user_ids: 'push',
        headings: { en: '🚗 SafeScan', ar: '🚗 SafeScan' },
        contents: { en: pushBody, ar: pushBody },
        url: 'https://calm-chebakia-9ddff4.netlify.app/dashboard.html',
      }),
    });

    const result = await res.json();
    console.log('OneSignal result:', JSON.stringify(result));
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, recipients: result.recipients, errors: result.errors }) };

  } catch (err) {
    console.error('send-push error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
