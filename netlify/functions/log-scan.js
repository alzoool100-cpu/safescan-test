const { createClient } = require('@supabase/supabase-js');

const H = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: H, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: H, body: '{}' };

  try {
    const { sticker_id, scan_type } = JSON.parse(event.body || '{}');

    const ip = ((event.headers['x-forwarded-for'] || '').split(',')[0].trim())
             || event.headers['client-ip']
             || 'unknown';
    const ua = event.headers['user-agent'] || '';

    // IP geolocation (ipinfo.io — free, 50k/month, HTTPS)
    let geoInfo = null;
    const isPrivateIp = /^(::1|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
    if (ip && ip !== 'unknown' && !isPrivateIp) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const geoRes = await fetch(`https://ipinfo.io/${ip}/json`, { signal: controller.signal });
        clearTimeout(timer);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          const parts = [geo.city, geo.region, geo.country].filter(Boolean);
          if (parts.length) geoInfo = parts.join('، ');
        }
      } catch (_) { /* geo failure is non-critical */ }
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const row = {
      visitor_ip: ip,
      user_agent: ua,
      geo_info: geoInfo,
      scanned_at: new Date().toISOString(),
      scan_type: scan_type || 'qr',
    };
    if (sticker_id) row.sticker_id = sticker_id;

    const { error } = await supabase.from('audit_logs').insert([row]);
    if (error) console.error('log-scan insert error:', error.message);

    // Always return 200 — scan logging failure must not break the user flow
    return { statusCode: 200, headers: H, body: JSON.stringify({ ok: !error }) };

  } catch (err) {
    console.error('log-scan error:', err.message);
    return { statusCode: 200, headers: H, body: JSON.stringify({ ok: false }) };
  }
};
