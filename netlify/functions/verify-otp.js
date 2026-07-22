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
    const { phone, otp, new_password } = JSON.parse(event.body || '{}');
    if (!phone || !otp || !new_password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing_fields' }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data: record } = await supabase
      .from('otp_resets')
      .select('otp, expires_at, used')
      .eq('phone', phone)
      .maybeSingle();

    if (!record) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'no_otp' }) };
    }
    if (record.used) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'otp_used' }) };
    }
    if (new Date() > new Date(record.expires_at)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'otp_expired' }) };
    }
    if (record.otp !== otp) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'otp_invalid' }) };
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

    await supabase.from('otp_resets').update({ used: true }).eq('phone', phone);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error('verify-otp error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
