-- ============================================================
-- MIGRATION: pg_cron job to invoke sync-bermann Edge Function
-- Runs every 15 minutes, replaces GitHub Actions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 1. Sync log table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  mode TEXT NOT NULL DEFAULT 'incremental',
  status TEXT NOT NULL DEFAULT 'running',
  results JSONB,
  error TEXT
);

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_sync_log" ON public.sync_log;
CREATE POLICY "admin_read_sync_log"
  ON public.sync_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.sync_log FROM anon;
GRANT SELECT ON public.sync_log TO authenticated;
GRANT ALL ON public.sync_log TO service_role;

CREATE INDEX IF NOT EXISTS idx_sync_log_started ON public.sync_log (started_at DESC);


-- ============================================================
-- 2. Wrapper function that pg_cron calls
--    Uses pg_net to POST to the Edge Function
-- ============================================================

CREATE OR REPLACE FUNCTION public.invoke_sync_bermann()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text := 'https://cfcgkeexjewhijajltwg.supabase.co/functions/v1/sync-bermann';
  _key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmY2drZWV4amV3aGlqYWpsdHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg1MzMwOSwiZXhwIjoyMDg2NDI5MzA5fQ.zlBnilAuUfD9wADwfgEZt6Jdg7aOBULVjtjJB13pgcc';
BEGIN
  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key
    ),
    body := '{"mode":"incremental","daysBack":3}'::jsonb
  );
END;
$$;


-- ============================================================
-- 3. Schedule: every 15 minutes
-- ============================================================

SELECT cron.schedule(
  'sync-bermann-incremental',
  '*/15 * * * *',
  'SELECT public.invoke_sync_bermann()'
);


-- ============================================================
-- 4. Cleanup job: delete sync logs older than 7 days
-- ============================================================

SELECT cron.schedule(
  'cleanup-sync-logs',
  '0 3 * * *',
  $$DELETE FROM public.sync_log WHERE started_at < now() - interval '7 days'$$
);
