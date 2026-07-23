const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  try {
    const { phone } = JSON.parse(event.body || '{}');
    if (!phone) return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing phone' }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, onesignal_sub_id')
      .eq('phone', phone)
      .maybeSingle();

    // Return ok even if phone not found to prevent enumeration attacks
    if (!profile) return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('otp_resets')
      .upsert({ phone, otp, expires_at: expiresAt, used: false }, { onConflict: 'phone' });

    if (upsertError) {
      console.error('otp upsert error:', upsertError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'db_error' }) };
    }

    const pushBody = `🔐 رمز التحقق: ${otp} — صالح لمدة 30 دقيقة`;
    const targeting = profile.onesignal_sub_id
      ? { include_subscription_ids: [profile.onesignal_sub_id] }
      : { include_aliases: { external_id: [profile.id] } };

    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        target_channel: 'push',
        ...targeting,
        headings: { en: '🔐 SafeScan', ar: '🔐 SafeScan' },
        contents: { en: pushBody, ar: pushBody },
        priority: 10,
        android_visibility: 1,
        ttl: 1800,
      }),
    });

    const result = await res.json();
    if (!(result.recipients ?? 0)) {
      console.warn('OTP push 0 recipients for user:', profile.id);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, otp }) };

  } catch (err) {
    console.error('reset-otp error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
