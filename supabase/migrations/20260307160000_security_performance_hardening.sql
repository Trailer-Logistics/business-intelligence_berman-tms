-- ============================================================
-- MIGRATION: Security Hardening + Performance Optimization
-- Date: 2026-03-07
-- Fixes: RLS bypass on all tables, missing indexes, no audit
-- IDEMPOTENT: Safe to re-run (DROP IF EXISTS before CREATE)
-- ============================================================

-- ============================================================
-- 1. FIX RLS ON b_viajes, b_clientes, b_conductores
--    Read-only reference tables synced from external.
-- ============================================================

ALTER TABLE public.b_viajes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read b_viajes" ON public.b_viajes;
CREATE POLICY "Authenticated read b_viajes"
  ON public.b_viajes FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read b_clientes" ON public.b_clientes;
CREATE POLICY "Authenticated read b_clientes"
  ON public.b_clientes FOR SELECT TO authenticated USING (true);

ALTER TABLE public.b_conductores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read b_conductores" ON public.b_conductores;
CREATE POLICY "Authenticated read b_conductores"
  ON public.b_conductores FOR SELECT TO authenticated USING (true);


-- ============================================================
-- 2. FIX RLS ON r_forecast_contractual
-- ============================================================

ALTER TABLE public.r_forecast_contractual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.r_forecast_contractual FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read forecast records" ON public.r_forecast_contractual;
DROP POLICY IF EXISTS "Authenticated users can insert forecast records" ON public.r_forecast_contractual;
DROP POLICY IF EXISTS "Authenticated users can update forecast records" ON public.r_forecast_contractual;
DROP POLICY IF EXISTS "authenticated_read_forecast" ON public.r_forecast_contractual;
DROP POLICY IF EXISTS "admin_operador_insert_forecast" ON public.r_forecast_contractual;
DROP POLICY IF EXISTS "admin_operador_update_forecast" ON public.r_forecast_contractual;
DROP POLICY IF EXISTS "admin_delete_forecast" ON public.r_forecast_contractual;

CREATE POLICY "authenticated_read_forecast"
  ON public.r_forecast_contractual FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_operador_insert_forecast"
  ON public.r_forecast_contractual FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));

CREATE POLICY "admin_operador_update_forecast"
  ON public.r_forecast_contractual FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));

CREATE POLICY "admin_delete_forecast"
  ON public.r_forecast_contractual FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ============================================================
-- 3. FIX RLS ON r_registro_walmart_loa
-- ============================================================

ALTER TABLE public.r_registro_walmart_loa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.r_registro_walmart_loa FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read walmart loa records" ON public.r_registro_walmart_loa;
DROP POLICY IF EXISTS "Authenticated users can insert walmart loa records" ON public.r_registro_walmart_loa;
DROP POLICY IF EXISTS "Authenticated users can update walmart loa records" ON public.r_registro_walmart_loa;
DROP POLICY IF EXISTS "authenticated_read_walmart_loa" ON public.r_registro_walmart_loa;
DROP POLICY IF EXISTS "admin_operador_insert_walmart_loa" ON public.r_registro_walmart_loa;
DROP POLICY IF EXISTS "admin_operador_update_walmart_loa" ON public.r_registro_walmart_loa;
DROP POLICY IF EXISTS "admin_delete_walmart_loa" ON public.r_registro_walmart_loa;

CREATE POLICY "authenticated_read_walmart_loa"
  ON public.r_registro_walmart_loa FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_operador_insert_walmart_loa"
  ON public.r_registro_walmart_loa FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));

CREATE POLICY "admin_operador_update_walmart_loa"
  ON public.r_registro_walmart_loa FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operador'));

CREATE POLICY "admin_delete_walmart_loa"
  ON public.r_registro_walmart_loa FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ============================================================
-- 4. HARDEN config_usuarios
-- ============================================================

ALTER TABLE public.config_usuarios FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_delete_config_usuarios" ON public.config_usuarios;
CREATE POLICY "admin_delete_config_usuarios"
  ON public.config_usuarios FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ============================================================
-- 5. REVOKE anon, explicit GRANT to authenticated + service_role
-- ============================================================

REVOKE ALL ON public.b_viajes FROM anon;
REVOKE ALL ON public.b_clientes FROM anon;
REVOKE ALL ON public.b_conductores FROM anon;
REVOKE ALL ON public.r_forecast_contractual FROM anon;
REVOKE ALL ON public.r_registro_walmart_loa FROM anon;
REVOKE ALL ON public.config_usuarios FROM anon;

GRANT SELECT ON public.b_viajes TO authenticated;
GRANT SELECT ON public.b_clientes TO authenticated;
GRANT SELECT ON public.b_conductores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.r_forecast_contractual TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.r_registro_walmart_loa TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.config_usuarios TO authenticated;

GRANT ALL ON public.b_viajes TO service_role;
GRANT ALL ON public.b_clientes TO service_role;
GRANT ALL ON public.b_conductores TO service_role;
GRANT ALL ON public.r_forecast_contractual TO service_role;
GRANT ALL ON public.r_registro_walmart_loa TO service_role;
GRANT ALL ON public.config_usuarios TO service_role;


-- ============================================================
-- 6. PERFORMANCE INDEXES (safe with IF NOT EXISTS)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_b_viajes_estatus ON public.b_viajes (estatus_viaje_id);
CREATE INDEX IF NOT EXISTS idx_b_viajes_fecha ON public.b_viajes (fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_b_viajes_nro ON public.b_viajes (nro_viaje);
CREATE INDEX IF NOT EXISTS idx_b_viajes_carga ON public.b_viajes (carga_id);
CREATE INDEX IF NOT EXISTS idx_b_viajes_datos_gin ON public.b_viajes USING GIN (datos_completos jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_b_viajes_fecha_estatus ON public.b_viajes (fecha_creacion, estatus_viaje_id);

CREATE INDEX IF NOT EXISTS idx_b_clientes_nombre ON public.b_clientes (nombre);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'b_conductores' AND column_name = 'nombre'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_b_conductores_nombre ON public.b_conductores (nombre)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_walmart_loa_viaje ON public.r_registro_walmart_loa (viaje_id);

CREATE INDEX IF NOT EXISTS idx_forecast_cliente ON public.r_forecast_contractual (cliente_estandar);
CREATE INDEX IF NOT EXISTS idx_forecast_mes ON public.r_forecast_contractual (mes_proyeccion);
CREATE INDEX IF NOT EXISTS idx_forecast_cliente_mes ON public.r_forecast_contractual (cliente_estandar, mes_proyeccion);

CREATE INDEX IF NOT EXISTS idx_config_usuarios_user_id ON public.config_usuarios (user_id);
CREATE INDEX IF NOT EXISTS idx_config_usuarios_email ON public.config_usuarios (email);
CREATE INDEX IF NOT EXISTS idx_config_usuarios_rol ON public.config_usuarios (rol);


-- ============================================================
-- 7. AUDIT TRIGGERS
-- ============================================================

-- Create the generic updated_at trigger function (may not exist from migration 1)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'r_forecast_contractual' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.r_forecast_contractual ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_r_forecast_updated_at ON public.r_forecast_contractual;
CREATE TRIGGER update_r_forecast_updated_at
  BEFORE UPDATE ON public.r_forecast_contractual
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- editado_el trigger for walmart loa
CREATE OR REPLACE FUNCTION public.update_editado_el_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.editado_el = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_walmart_loa_editado ON public.r_registro_walmart_loa;
CREATE TRIGGER update_walmart_loa_editado
  BEFORE UPDATE ON public.r_registro_walmart_loa
  FOR EACH ROW EXECUTE FUNCTION public.update_editado_el_column();


-- ============================================================
-- 8. has_role: TEXT version (avoids enum cast issues)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'has_role'
    AND pg_get_function_arguments(p.oid) = '_user_id uuid, _role app_role'
  ) THEN
    DROP FUNCTION public.has_role(UUID, app_role);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.config_usuarios
    WHERE user_id = _user_id AND rol::text = _role AND activo = true
  )
$$;


-- ============================================================
-- 9. ANALYZE for query planner
-- ============================================================

ANALYZE public.b_viajes;
ANALYZE public.b_clientes;
ANALYZE public.b_conductores;
ANALYZE public.r_forecast_contractual;
ANALYZE public.r_registro_walmart_loa;
ANALYZE public.config_usuarios;
