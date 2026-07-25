const { createClient } = require('@supabase/supabase-js');

const H = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

async function verifyAdmin(supabase, token) {
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  return profile?.is_admin ? user : null;
}

function dateStr(d) {
  return new Date(d).toISOString().split('T')[0];
}

function groupByDay(records, field, days) {
  const out = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out[dateStr(d)] = 0;
  }
  for (const r of (records || [])) {
    const k = (r[field] || '').split('T')[0];
    if (Object.prototype.hasOwnProperty.call(out, k)) out[k]++;
  }
  return Object.entries(out).map(([date, count]) => ({ date, count }));
}

function groupByMonth(records, field, months) {
  const out = {};
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out[k] = 0;
  }
  for (const r of (records || [])) {
    if (!r[field]) continue;
    const d = new Date(r[field]);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (Object.prototype.hasOwnProperty.call(out, k)) out[k]++;
  }
  return Object.entries(out).map(([month, count]) => ({ month, count }));
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: H, body: '' };

  const rawAuth = event.headers['authorization'] || event.headers['Authorization'] || '';
  const token = rawAuth.replace(/^Bearer\s+/i, '').trim();
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const admin = await verifyAdmin(supabase, token);
  if (!admin) return { statusCode: 401, headers: H, body: JSON.stringify({ error: 'unauthorized' }) };

  const qs = event.queryStringParameters || {};
  const action = qs.action || 'stats';

  try {
    if (action === 'stats') {
      const now = new Date();
      const todayStr     = dateStr(now);
      const yesterdayStr = dateStr(new Date(now - 86400000));
      const weekAgo      = new Date(now - 7   * 86400000).toISOString();
      const prevWeekAgo  = new Date(now - 14  * 86400000).toISOString();
      const monthAgo     = new Date(now - 30  * 86400000).toISOString();
      const prevMonthAgo = new Date(now - 60  * 86400000).toISOString();
      const yearAgo      = new Date(now - 365 * 86400000).toISOString();
      const prevYearAgo  = new Date(now - 730 * 86400000).toISOString();

      // NOTE: profiles table has no created_at — newUsersMonth removed
      const [
        r0, r1, r2, r3, r4, r5, r6, r7, r8,
        r9,
        r10, r11, r12, r13,
        r14, r15, r16, r17, r18,
        r19, r20, r21,
      ] = await Promise.all([
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('scanned_at', todayStr),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('scanned_at', yesterdayStr).lt('scanned_at', todayStr),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('scanned_at', weekAgo),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('scanned_at', prevWeekAgo).lt('scanned_at', weekAgo),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('scanned_at', monthAgo),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('scanned_at', prevMonthAgo).lt('scanned_at', monthAgo),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('scanned_at', yearAgo),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('scanned_at', prevYearAgo).lt('scanned_at', yearAgo),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
        // users — no created_at on profiles
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        // stickers by status
        supabase.from('stickers').select('*', { count: 'exact', head: true }),
        supabase.from('stickers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('stickers').select('*', { count: 'exact', head: true }).eq('status', 'printed'),
        supabase.from('stickers').select('*', { count: 'exact', head: true }).eq('status', 'factory_new'),
        // messages
        supabase.from('scan_logs').select('*', { count: 'exact', head: true }),
        supabase.from('scan_logs').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
        supabase.from('scan_logs').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
        supabase.from('scan_logs').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('scan_logs').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),
        // chart data
        supabase.from('audit_logs').select('scanned_at').gte('scanned_at', monthAgo),
        supabase.from('audit_logs').select('scanned_at').gte('scanned_at', yearAgo),
        supabase.from('scan_logs').select('created_at').gte('created_at', monthAgo),
      ]);

      return {
        statusCode: 200,
        headers: H,
        body: JSON.stringify({
          scans: {
            today: r0.count || 0, yesterday: r1.count || 0,
            week: r2.count || 0, prevWeek: r3.count || 0,
            month: r4.count || 0, prevMonth: r5.count || 0,
            year: r6.count || 0, prevYear: r7.count || 0,
            total: r8.count || 0,
          },
          users: { total: r9.count || 0 },
          stickers: {
            total: r10.count || 0,
            active: r11.count || 0,
            printed: r12.count || 0,
            factoryNew: r13.count || 0,
          },
          messages: {
            total: r14.count || 0, replied: r15.count || 0,
            today: r16.count || 0, week: r17.count || 0, month: r18.count || 0,
          },
          charts: {
            dailyScans: groupByDay(r19.data, 'scanned_at', 30),
            monthlyScans: groupByMonth(r20.data, 'scanned_at', 12),
            dailyMsgs: groupByDay(r21.data, 'created_at', 30),
          },
        }),
      };
    }

    if (action === 'users') {
      // profiles has no created_at — select without it, order by id
      const { data, error } = await supabase
        .from('profiles')
        .select('id, phone, show_phone, is_admin, is_admin_blocked');
      if (error) throw error;
      return { statusCode: 200, headers: H, body: JSON.stringify({ data: data || [] }) };
    }

    if (action === 'stickers') {
      const { data, error } = await supabase
        .from('stickers')
        .select('id, qr_token, activation_code, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers: H, body: JSON.stringify({ data: data || [] }) };
    }

    if (action === 'messages') {
      const { data: msgs, error } = await supabase
        .from('scan_logs')
        .select('visitor_message, owner_response, status, created_at, visitor_fingerprint, sticker_id')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;

      if (!msgs || msgs.length === 0) {
        return { statusCode: 200, headers: H, body: JSON.stringify({ data: [] }) };
      }

      // Batch-lookup owner phone: scan_logs → stickers → vehicles → profiles
      const stickerIds = [...new Set(msgs.map(m => m.sticker_id).filter(Boolean))];
      const ownerPhone = {};

      if (stickerIds.length > 0) {
        const { data: stickers } = await supabase
          .from('stickers').select('id, vehicle_id').in('id', stickerIds);

        if (stickers && stickers.length > 0) {
          const vehicleIds = [...new Set(stickers.map(s => s.vehicle_id).filter(Boolean))];
          const stkToVeh = Object.fromEntries(stickers.map(s => [s.id, s.vehicle_id]));

          if (vehicleIds.length > 0) {
            const { data: vehicles } = await supabase
              .from('vehicles').select('id, user_id').in('id', vehicleIds);

            if (vehicles && vehicles.length > 0) {
              const vehToUser = Object.fromEntries(vehicles.map(v => [v.id, v.user_id]));
              const userIds = [...new Set(vehicles.map(v => v.user_id).filter(Boolean))];

              if (userIds.length > 0) {
                const { data: profiles } = await supabase
                  .from('profiles').select('id, phone').in('id', userIds);

                if (profiles) {
                  const userToPhone = Object.fromEntries(profiles.map(p => [p.id, p.phone]));
                  stickerIds.forEach(sid => {
                    const vid = stkToVeh[sid];
                    const uid = vid ? vehToUser[vid] : null;
                    ownerPhone[sid] = uid ? (userToPhone[uid] || null) : null;
                  });
                }
              }
            }
          }
        }
      }

      const enriched = msgs.map(m => ({
        ...m,
        owner_phone: m.sticker_id ? (ownerPhone[m.sticker_id] || null) : null,
      }));

      return { statusCode: 200, headers: H, body: JSON.stringify({ data: enriched }) };
    }

    if (action === 'audit') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('visitor_ip, user_agent, geo_info, scanned_at, sticker_id, scan_type')
        .order('scanned_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      if (!data || data.length === 0) {
        return { statusCode: 200, headers: H, body: JSON.stringify({ data: [] }) };
      }

      // Batch-lookup owner phone: audit_logs → stickers → vehicles → profiles
      const auditStickerIds = [...new Set(data.map(r => r.sticker_id).filter(Boolean))];
      const auditOwnerPhone = {};

      if (auditStickerIds.length > 0) {
        const { data: astickers } = await supabase
          .from('stickers').select('id, vehicle_id').in('id', auditStickerIds);

        if (astickers && astickers.length > 0) {
          const avehicleIds = [...new Set(astickers.map(s => s.vehicle_id).filter(Boolean))];
          const astkToVeh = Object.fromEntries(astickers.map(s => [s.id, s.vehicle_id]));

          if (avehicleIds.length > 0) {
            const { data: avehicles } = await supabase
              .from('vehicles').select('id, user_id').in('id', avehicleIds);

            if (avehicles && avehicles.length > 0) {
              const avehToUser = Object.fromEntries(avehicles.map(v => [v.id, v.user_id]));
              const auserIds = [...new Set(avehicles.map(v => v.user_id).filter(Boolean))];

              if (auserIds.length > 0) {
                const { data: aprofiles } = await supabase
                  .from('profiles').select('id, phone').in('id', auserIds);

                if (aprofiles) {
                  const auserToPhone = Object.fromEntries(aprofiles.map(p => [p.id, p.phone]));
                  auditStickerIds.forEach(sid => {
                    const vid = astkToVeh[sid];
                    const uid = vid ? avehToUser[vid] : null;
                    auditOwnerPhone[sid] = uid ? (auserToPhone[uid] || null) : null;
                  });
                }
              }
            }
          }
        }
      }

      const enrichedAudit = data.map(r => ({
        ...r,
        owner_phone: r.sticker_id ? (auditOwnerPhone[r.sticker_id] || null) : null,
      }));

      return { statusCode: 200, headers: H, body: JSON.stringify({ data: enrichedAudit }) };
    }

    if (action === 'toggle-block' && event.httpMethod === 'POST') {
      const { user_id, block } = JSON.parse(event.body || '{}');
      if (!user_id) return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'missing user_id' }) };
      const { error } = await supabase.from('profiles').update({ is_admin_blocked: !!block }).eq('id', user_id);
      if (error) throw error;
      return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'unknown action' }) };

  } catch (err) {
    console.error('admin-stats error:', err.message);
    return { statusCode: 500, headers: H, body: JSON.stringify({ error: err.message }) };
  }
};
