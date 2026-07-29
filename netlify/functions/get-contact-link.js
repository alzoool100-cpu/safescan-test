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
    const { qr_token, method, message } = JSON.parse(event.body || '{}');
    if (!qr_token || !method) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing_fields' }) };
    }
    if (!['whatsapp', 'sms', 'call'].includes(method)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid_method' }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data: sticker } = await supabase
      .from('stickers').select('vehicle_id, status').eq('qr_token', qr_token).maybeSingle();
    if (!sticker || sticker.status !== 'active') {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'sticker_invalid' }) };
    }

    const { data: vehicle } = await supabase
      .from('vehicles').select('user_id, is_active').eq('id', sticker.vehicle_id).maybeSingle();
    if (!vehicle || !vehicle.is_active) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'owner_inactive' }) };
    }

    const { data: profile } = await supabase
      .from('profiles').select('phone, show_phone').eq('id', vehicle.user_id).maybeSingle();
    if (!profile?.phone || profile.show_phone === false) {
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'phone_hidden' }) };
    }

    // Normalise Saudi number to international format for WhatsApp
    let waPhone = profile.phone.replace(/[^0-9]/g, '');
    if (waPhone.startsWith('0')) waPhone = '966' + waPhone.slice(1);
    else if (!waPhone.startsWith('966') && waPhone.length <= 9) waPhone = '966' + waPhone;

    let url;
    if (method === 'whatsapp') {
      url = `https://wa.me/${waPhone}${message ? '?text=' + encodeURIComponent(message) : ''}`;
    } else if (method === 'sms') {
      url = `sms:${profile.phone}${message ? '?body=' + encodeURIComponent(message) : ''}`;
    } else {
      url = `tel:${profile.phone}`;
    }

    return { statusCode: 200, headers, body: JSON.stringify({ url }) };

  } catch (err) {
    console.error('get-contact-link error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal_error' }) };
  }
};
