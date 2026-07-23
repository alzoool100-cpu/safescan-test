-- SafeScan RLS Policies
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New Query)
-- After running, enable "Leaked Password Protection" in Auth → Settings → Security

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles  ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. PROFILES
-- =====================================================

-- Anon and authenticated users can read any profile row
-- (visitor page needs phone/show_phone/contact_method/is_admin_blocked)
CREATE POLICY "profiles_read_anyone" ON public.profiles
  FOR SELECT
  USING (true);

-- Authenticated users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING     (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile (e.g. set is_admin_blocked)
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- =====================================================
-- 3. VEHICLES
-- =====================================================

-- Visitor page needs to read vehicle info (name, plate, image, is_active)
CREATE POLICY "vehicles_read_anyone" ON public.vehicles
  FOR SELECT
  USING (true);

-- Authenticated users can insert/update/delete their own vehicles
CREATE POLICY "vehicles_all_own" ON public.vehicles
  FOR ALL TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. STICKERS
-- =====================================================

-- Visitor page needs to read sticker status by qr_token
CREATE POLICY "stickers_read_anyone" ON public.stickers
  FOR SELECT
  USING (true);

-- Authenticated users can manage stickers for their own vehicles
CREATE POLICY "stickers_all_own" ON public.stickers
  FOR ALL TO authenticated
  USING (
    vehicle_id IN (
      SELECT id FROM public.vehicles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vehicle_id IN (
      SELECT id FROM public.vehicles WHERE user_id = auth.uid()
    )
  );

-- Admins can read all stickers
CREATE POLICY "stickers_read_admin" ON public.stickers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =====================================================
-- 5. SCAN_LOGS
-- (No anon access — INSERT/SELECT go through Netlify functions with service role)
-- =====================================================

-- Authenticated owners can read scan_logs for their vehicles
CREATE POLICY "scan_logs_read_owner" ON public.scan_logs
  FOR SELECT TO authenticated
  USING (
    sticker_id IN (
      SELECT s.id FROM public.stickers s
      JOIN public.vehicles v ON v.id = s.vehicle_id
      WHERE v.user_id = auth.uid()
    )
  );

-- Authenticated owners can update scan_logs (send reply, show phone, close)
CREATE POLICY "scan_logs_update_owner" ON public.scan_logs
  FOR UPDATE TO authenticated
  USING (
    sticker_id IN (
      SELECT s.id FROM public.stickers s
      JOIN public.vehicles v ON v.id = s.vehicle_id
      WHERE v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    sticker_id IN (
      SELECT s.id FROM public.stickers s
      JOIN public.vehicles v ON v.id = s.vehicle_id
      WHERE v.user_id = auth.uid()
    )
  );

-- Admins can read all scan_logs
CREATE POLICY "scan_logs_read_admin" ON public.scan_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =====================================================
-- 6. AUDIT_LOGS (RLS already enabled — just add admin read policy)
-- =====================================================

CREATE POLICY "audit_logs_read_admin" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =====================================================
-- 7. FIX handle_new_user() — prevent direct execution
-- The function is still called by the DB trigger (that still works).
-- Revoking EXECUTE prevents users from calling it directly.
-- =====================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
