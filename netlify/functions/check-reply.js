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
    const { token } = JSON.parse(event.body || '{}');
    if (!token) return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing token' }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data } = await supabase
      .from('scan_logs')
      .select('visitor_message, owner_response, status, show_phone_to_visitor, sticker_id')
      .eq('session_token', token)
      .maybeSingle();

    if (!data) return { statusCode: 200, headers, body: JSON.stringify({ found: false }) };

    return { statusCode: 200, headers, body: JSON.stringify({
      found: true,
      visitor_message: data.visitor_message,
      owner_response: data.owner_response || null,
      status: data.status,
      show_phone_to_visitor: data.show_phone_to_visitor || false,
      sticker_id: data.sticker_id,
    }) };

  } catch (err) {
    console.error('check-reply error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
