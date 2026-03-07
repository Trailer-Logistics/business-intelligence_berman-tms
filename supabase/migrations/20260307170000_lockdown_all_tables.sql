-- ============================================================
-- MIGRATION: Lock down ALL remaining unrestricted tables + views
-- Date: 2026-03-07
-- Covers every b_*, config_*, m_*, and v_* object
-- ============================================================

-- ============================================================
-- 1. ENABLE RLS on all unrestricted b_ tables
-- ============================================================

ALTER TABLE public.b_cargas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_b_cargas" ON public.b_cargas;
CREATE POLICY "auth_read_b_cargas"
  ON public.b_cargas FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_contratos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_b_contratos" ON public.b_contratos;
CREATE POLICY "auth_read_b_contratos"
  ON public.b_contratos FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_estado_pod ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_b_estado_pod" ON public.b_estado_pod;
CREATE POLICY "auth_read_b_estado_pod"
  ON public.b_estado_pod FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_estado_viaje ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_b_estado_viaje" ON public.b_estado_viaje;
CREATE POLICY "auth_read_b_estado_viaje"
  ON public.b_estado_viaje FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_finanzas_viaje ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_b_finanzas_viaje" ON public.b_finanzas_viaje;
CREATE POLICY "auth_read_b_finanzas_viaje"
  ON public.b_finanzas_viaje FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_rutas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_b_rutas" ON public.b_rutas;
CREATE POLICY "auth_read_b_rutas"
  ON public.b_rutas FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_tipo_operacion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_b_tipo_operacion" ON public.b_tipo_operacion;
CREATE POLICY "auth_read_b_tipo_operacion"
  ON public.b_tipo_operacion FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_transportistas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_b_transportistas" ON public.b_transportistas;
CREATE POLICY "auth_read_b_transportistas"
  ON public.b_transportistas FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_unidad_negocio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_b_unidad_negocio" ON public.b_unidad_negocio;
CREATE POLICY "auth_read_b_unidad_negocio"
  ON public.b_unidad_negocio FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_vehiculos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_b_vehiculos" ON public.b_vehiculos;
CREATE POLICY "auth_read_b_vehiculos"
  ON public.b_vehiculos FOR SELECT TO authenticated USING (true);

ALTER TABLE public.m_estatus_viaje ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_m_estatus_viaje" ON public.m_estatus_viaje;
CREATE POLICY "auth_read_m_estatus_viaje"
  ON public.m_estatus_viaje FOR SELECT TO authenticated USING (true);


-- ============================================================
-- 2. config_clientes_bi (if exists)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'config_clientes_bi') THEN
    EXECUTE 'ALTER TABLE public.config_clientes_bi ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "auth_read_config_clientes_bi" ON public.config_clientes_bi';
    EXECUTE 'CREATE POLICY "auth_read_config_clientes_bi" ON public.config_clientes_bi FOR SELECT TO authenticated USING (true)';
    EXECUTE 'REVOKE ALL ON public.config_clientes_bi FROM anon';
    EXECUTE 'GRANT SELECT ON public.config_clientes_bi TO authenticated';
    EXECUTE 'GRANT ALL ON public.config_clientes_bi TO service_role';
  END IF;
END $$;


-- ============================================================
-- 3. REVOKE anon from ALL newly secured tables
-- ============================================================

REVOKE ALL ON public.b_cargas FROM anon;
REVOKE ALL ON public.b_contratos FROM anon;
REVOKE ALL ON public.b_estado_pod FROM anon;
REVOKE ALL ON public.b_estado_viaje FROM anon;
REVOKE ALL ON public.b_finanzas_viaje FROM anon;
REVOKE ALL ON public.b_rutas FROM anon;
REVOKE ALL ON public.b_tipo_operacion FROM anon;
REVOKE ALL ON public.b_transportistas FROM anon;
REVOKE ALL ON public.b_unidad_negocio FROM anon;
REVOKE ALL ON public.b_vehiculos FROM anon;
REVOKE ALL ON public.m_estatus_viaje FROM anon;

-- GRANT authenticated read-only
GRANT SELECT ON public.b_cargas TO authenticated;
GRANT SELECT ON public.b_contratos TO authenticated;
GRANT SELECT ON public.b_estado_pod TO authenticated;
GRANT SELECT ON public.b_estado_viaje TO authenticated;
GRANT SELECT ON public.b_finanzas_viaje TO authenticated;
GRANT SELECT ON public.b_rutas TO authenticated;
GRANT SELECT ON public.b_tipo_operacion TO authenticated;
GRANT SELECT ON public.b_transportistas TO authenticated;
GRANT SELECT ON public.b_unidad_negocio TO authenticated;
GRANT SELECT ON public.b_vehiculos TO authenticated;
GRANT SELECT ON public.m_estatus_viaje TO authenticated;

-- Service role full access (edge functions need to sync)
GRANT ALL ON public.b_cargas TO service_role;
GRANT ALL ON public.b_contratos TO service_role;
GRANT ALL ON public.b_estado_pod TO service_role;
GRANT ALL ON public.b_estado_viaje TO service_role;
GRANT ALL ON public.b_finanzas_viaje TO service_role;
GRANT ALL ON public.b_rutas TO service_role;
GRANT ALL ON public.b_tipo_operacion TO service_role;
GRANT ALL ON public.b_transportistas TO service_role;
GRANT ALL ON public.b_unidad_negocio TO service_role;
GRANT ALL ON public.b_vehiculos TO service_role;
GRANT ALL ON public.m_estatus_viaje TO service_role;


-- ============================================================
-- 4. SECURE VIEWS (v_alertas_conductores, v_alertas_flota, v_viajes_inteligentes)
--    Views don't support RLS directly — we secure via GRANT/REVOKE
-- ============================================================

REVOKE ALL ON public.v_alertas_conductores FROM anon;
REVOKE ALL ON public.v_alertas_flota FROM anon;
REVOKE ALL ON public.v_viajes_inteligentes FROM anon;

GRANT SELECT ON public.v_alertas_conductores TO authenticated;
GRANT SELECT ON public.v_alertas_flota TO authenticated;
GRANT SELECT ON public.v_viajes_inteligentes TO authenticated;

GRANT SELECT ON public.v_alertas_conductores TO service_role;
GRANT SELECT ON public.v_alertas_flota TO service_role;
GRANT SELECT ON public.v_viajes_inteligentes TO service_role;


-- ============================================================
-- 5. SAFETY NET: Revoke default anon grants on public schema
--    Prevents future tables from being auto-exposed to anon
-- ============================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;


-- ============================================================
-- 6. Performance indexes on newly discovered tables
-- ============================================================

-- b_finanzas_viaje: likely queried by viaje
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'b_finanzas_viaje' AND column_name = 'viaje_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_finanzas_viaje_id ON public.b_finanzas_viaje (viaje_id)';
  END IF;
END $$;

-- b_vehiculos: patente lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'b_vehiculos' AND column_name = 'patente'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_vehiculos_patente ON public.b_vehiculos (patente)';
  END IF;
END $$;

-- b_contratos: cliente lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'b_contratos' AND column_name = 'cliente_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.b_contratos (cliente_id)';
  END IF;
END $$;


-- ============================================================
-- 7. ANALYZE newly indexed tables
-- ============================================================

ANALYZE public.b_cargas;
ANALYZE public.b_contratos;
ANALYZE public.b_estado_pod;
ANALYZE public.b_estado_viaje;
ANALYZE public.b_finanzas_viaje;
ANALYZE public.b_rutas;
ANALYZE public.b_tipo_operacion;
ANALYZE public.b_transportistas;
ANALYZE public.b_unidad_negocio;
ANALYZE public.b_vehiculos;
ANALYZE public.m_estatus_viaje;
