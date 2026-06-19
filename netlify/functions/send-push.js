const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  if (event.httpMethod === 'GET') {
    const key = process.env.ONESIGNAL_REST_API_KEY || '';
    const keyType = key.startsWith('os_v2_app_') ? 'app_key_v2 ✅'
                  : key.startsWith('os_v2_org_') ? 'org_key_WRONG ❌'
                  : key.length > 10 ? 'legacy_key_v1'
                  : 'MISSING ❌';
    return { statusCode: 200, headers, body: JSON.stringify({
      ok: true,
      service: 'OneSignal',
      key_type: keyType,
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

    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        target_channel: 'push',
        include_aliases: { external_id: [vehicle.user_id] },
        headings: { en: '🚗 SafeScan', ar: '🚗 SafeScan' },
        contents: { en: pushBody, ar: pushBody },
        url: 'https://calm-chebakia-9ddff4.netlify.app/dashboard.html',
      }),
    });

    const result = await res.json();
    const recipients = result.recipients ?? 0;
    console.log('OneSignal result:', JSON.stringify(result), '| target user_id:', vehicle.user_id);
    if (!recipients) console.warn('0 recipients — OneSignal.login() may not be linked for user:', vehicle.user_id);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: recipients > 0, recipients, errors: result.errors }) };

  } catch (err) {
    console.error('send-push error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
