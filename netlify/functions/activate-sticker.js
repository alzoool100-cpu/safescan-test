const { createClient } = require('@supabase/supabase-js');

const MAX_ATTEMPTS = 5;
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
    const { activation_code } = JSON.parse(event.body || '{}');
    if (!activation_code) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing_code' }) };
    }

    const ip = (event.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // H4: IP-based rate limiting on activation code checks
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count } = await supabase
      .from('activation_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', windowStart);

    if (count >= MAX_ATTEMPTS) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'rate_limited' }) };
    }

    await supabase.from('activation_attempts').insert([{ ip }]);

    // Validate activation code using service key (not anon — prevents direct DB probing)
    const { data: sticker } = await supabase
      .from('stickers')
      .select('id, status')
      .eq('activation_code', activation_code)
      .maybeSingle();

    if (!sticker) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'invalid_code' }) };
    }
    if (!['factory_new', 'ready_to_print', 'printed'].includes(sticker.status)) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'already_activated' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ valid: true, sticker_id: sticker.id }) };

  } catch (err) {
    console.error('activate-sticker error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal_error' }) };
  }
};
