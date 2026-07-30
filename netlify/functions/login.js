const { createClient } = require('@supabase/supabase-js');

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 60 * 1000;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.APP_ORIGIN || 'https://calm-chebakia-9ddff4.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  try {
    const { phone, password } = JSON.parse(event.body || '{}');
    if (!phone || !password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing_fields' }) };
    }

    const ip = (event.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // M3: IP-based rate limiting — 10 attempts per hour
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count } = await supabaseAdmin
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', windowStart);

    if (count >= MAX_ATTEMPTS) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'rate_limited' }) };
    }

    await supabaseAdmin.from('login_attempts').insert([{ ip }]);

    // Attempt login via anon key (same as client-side, but rate-limited here)
    const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const email = `${phone}@safescan.local`;
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

    if (error || !data?.session) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'invalid_credentials' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      }),
    };

  } catch (err) {
    console.error('login error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal_error' }) };
  }
};
