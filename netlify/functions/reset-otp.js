const { createClient } = require('@supabase/supabase-js');
const { randomInt } = require('crypto');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.APP_ORIGIN || 'https://calm-chebakia-9ddff4.netlify.app',
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

    // H1: 60-second cooldown — prevent OTP flooding / SMS bombing
    const { data: existing } = await supabase
      .from('otp_resets')
      .select('expires_at, used')
      .eq('phone', phone)
      .maybeSingle();

    if (existing && !existing.used) {
      // expires_at = created_at + 30min, so created_at ≈ expires_at - 30min
      const approxCreatedAt = new Date(existing.expires_at).getTime() - 30 * 60 * 1000;
      if (Date.now() - approxCreatedAt < 60 * 1000) {
        return { statusCode: 429, headers, body: JSON.stringify({ error: 'otp_cooldown' }) };
      }
    }

    const otp = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('otp_resets')
      .upsert(
        { phone, otp, expires_at: expiresAt, used: false, attempts: 0, locked_until: null },
        { onConflict: 'phone' }
      );

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
    const pushDelivered = (result.recipients ?? 0) > 0;
    if (!pushDelivered) {
      console.warn('OTP push 0 recipients for user:', profile.id);
    }

    // If push couldn't be delivered, return the OTP in the response as a fallback
    const responseBody = { ok: true };
    if (!pushDelivered) responseBody.otp = otp;

    return { statusCode: 200, headers, body: JSON.stringify(responseBody) };

  } catch (err) {
    console.error('reset-otp error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal_error' }) };
  }
};
