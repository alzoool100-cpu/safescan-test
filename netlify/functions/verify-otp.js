const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.APP_ORIGIN || 'https://calm-chebakia-9ddff4.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  try {
    const { phone, otp, new_password } = JSON.parse(event.body || '{}');
    if (!phone || !otp || !new_password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing_fields' }) };
    }

    // H8: Server-side password strength — 8+ chars, uppercase, digit, special character
    const pwStrong = new_password.length >= 8 &&
      /[A-Z]/.test(new_password) &&
      /[0-9]/.test(new_password) &&
      /[^A-Za-z0-9]/.test(new_password);
    if (!pwStrong) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'password_too_weak' }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data: record } = await supabase
      .from('otp_resets')
      .select('otp, expires_at, used, attempts, locked_until')
      .eq('phone', phone)
      .maybeSingle();

    if (!record) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'no_otp' }) };
    }

    // C1: Reject if account is locked after too many failed attempts
    if (record.locked_until && new Date() < new Date(record.locked_until)) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'otp_locked' }) };
    }

    if (record.used) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'otp_used' }) };
    }
    if (new Date() > new Date(record.expires_at)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'otp_expired' }) };
    }

    // C1: Wrong OTP — increment attempts, lock after 5 failures (15 min)
    if (record.otp !== otp) {
      const newAttempts = (record.attempts || 0) + 1;
      const lockUpdate = { attempts: newAttempts };
      if (newAttempts >= 5) {
        lockUpdate.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      await supabase.from('otp_resets').update(lockUpdate).eq('phone', phone);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'otp_invalid' }) };
    }

    // C2: Atomic claim — only one concurrent request can win this UPDATE.
    // If two requests race with the correct OTP, only the first gets a row back
    // because the second sees used=true and no rows match.
    const { data: claimed } = await supabase
      .from('otp_resets')
      .update({ used: true, attempts: 0, locked_until: null })
      .eq('phone', phone)
      .eq('otp', otp)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .select('phone')
      .maybeSingle();

    if (!claimed) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'otp_used' }) };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (!profile) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_not_found' }) };
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
      password: new_password,
    });

    if (updateError) {
      console.error('password update error:', updateError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'update_failed' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error('verify-otp error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal_error' }) };
  }
};
