-- ============================================================
-- MIGRATION: PK + Constraints + Integrity Optimization
-- Date: 2026-03-07
-- Fixes: missing PKs, missing UNIQUE, missing indexes on FKs
-- ============================================================


-- ============================================================
-- 1. config_clientes_bi: Add UUID PK + UNIQUE on nombre_estandar
--    Currently has NO primary key at all
-- ============================================================

-- Add UUID PK column
ALTER TABLE public.config_clientes_bi
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Set as PK (if not already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.config_clientes_bi'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.config_clientes_bi ADD PRIMARY KEY (id);
  END IF;
END $$;

-- UNIQUE on nombre_estandar (the natural key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.config_clientes_bi'::regclass
    AND contype = 'u'
    AND conname = 'uq_config_clientes_bi_nombre_estandar'
  ) THEN
    ALTER TABLE public.config_clientes_bi
      ADD CONSTRAINT uq_config_clientes_bi_nombre_estandar UNIQUE (nombre_estandar);
  END IF;
END $$;

-- Index on nombre_original for lookups
CREATE INDEX IF NOT EXISTS idx_config_clientes_bi_nombre_orig
  ON public.config_clientes_bi (nombre_original);


-- ============================================================
-- 2. Verify/ensure PKs on all b_ tables
--    These use INT ids from the external TMS
-- ============================================================

-- b_viajes: verify PK exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_viajes'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_viajes ADD PRIMARY KEY (id);
  END IF;
END $$;

-- b_clientes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_clientes'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_clientes ADD PRIMARY KEY (id);
  END IF;
END $$;

-- b_conductores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_conductores'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_conductores ADD PRIMARY KEY (id);
  END IF;
END $$;

-- b_cargas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_cargas'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_cargas ADD PRIMARY KEY (id);
  END IF;
END $$;

-- b_contratos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_contratos'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_contratos ADD PRIMARY KEY (id);
  END IF;
END $$;

-- b_estado_pod
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_estado_pod'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_estado_pod ADD PRIMARY KEY (id);
  END IF;
END $$;

-- b_estado_viaje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_estado_viaje'::regclass AND contype = 'p'
  ) THEN
    -- Check if 'id' column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'b_estado_viaje' AND column_name = 'id'
    ) THEN
      ALTER TABLE public.b_estado_viaje ADD PRIMARY KEY (id);
    END IF;
  END IF;
END $$;

-- b_finanzas_viaje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_finanzas_viaje'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_finanzas_viaje ADD PRIMARY KEY (id);
  END IF;
END $$;

-- b_rutas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_rutas'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_rutas ADD PRIMARY KEY (id);
  END IF;
END $$;

-- b_tipo_operacion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_tipo_operacion'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_tipo_operacion ADD PRIMARY KEY (id);
  END IF;
END $$;

-- b_transportistas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_transportistas'::regclass AND contype = 'p'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'b_transportistas' AND column_name = 'id'
    ) THEN
      ALTER TABLE public.b_transportistas ADD PRIMARY KEY (id);
    END IF;
  END IF;
END $$;

-- b_unidad_negocio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_unidad_negocio'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_unidad_negocio ADD PRIMARY KEY (id);
  END IF;
END $$;

-- b_vehiculos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_vehiculos'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.b_vehiculos ADD PRIMARY KEY (id);
  END IF;
END $$;

-- m_estatus_viaje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.m_estatus_viaje'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.m_estatus_viaje ADD PRIMARY KEY (id_estatus);
  END IF;
END $$;


-- ============================================================
-- 3. UNIQUE constraints on natural keys
-- ============================================================

-- b_clientes: nombre should be unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_clientes'::regclass AND contype = 'u'
    AND conname = 'uq_b_clientes_nombre'
  ) THEN
    -- Only add if no duplicates exist
    IF (SELECT count(*) = count(DISTINCT nombre) FROM public.b_clientes WHERE nombre IS NOT NULL) THEN
      ALTER TABLE public.b_clientes ADD CONSTRAINT uq_b_clientes_nombre UNIQUE (nombre);
    END IF;
  END IF;
END $$;

-- b_vehiculos: patente should be unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_vehiculos'::regclass AND contype = 'u'
    AND conname = 'uq_b_vehiculos_patente'
  ) THEN
    IF (SELECT count(*) = count(DISTINCT patente) FROM public.b_vehiculos WHERE patente IS NOT NULL) THEN
      ALTER TABLE public.b_vehiculos ADD CONSTRAINT uq_b_vehiculos_patente UNIQUE (patente);
    END IF;
  END IF;
END $$;

-- m_estatus_viaje: nombre_estatus should be unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.m_estatus_viaje'::regclass AND contype = 'u'
    AND conname = 'uq_m_estatus_viaje_nombre'
  ) THEN
    IF (SELECT count(*) = count(DISTINCT nombre_estatus) FROM public.m_estatus_viaje WHERE nombre_estatus IS NOT NULL) THEN
      ALTER TABLE public.m_estatus_viaje ADD CONSTRAINT uq_m_estatus_viaje_nombre UNIQUE (nombre_estatus);
    END IF;
  END IF;
END $$;

-- b_estado_pod: nombre should be unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_estado_pod'::regclass AND contype = 'u'
    AND conname = 'uq_b_estado_pod_nombre'
  ) THEN
    IF (SELECT count(*) = count(DISTINCT nombre) FROM public.b_estado_pod WHERE nombre IS NOT NULL) THEN
      ALTER TABLE public.b_estado_pod ADD CONSTRAINT uq_b_estado_pod_nombre UNIQUE (nombre);
    END IF;
  END IF;
END $$;

-- b_tipo_operacion: nombre should be unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.b_tipo_operacion'::regclass AND contype = 'u'
    AND conname = 'uq_b_tipo_operacion_nombre'
  ) THEN
    IF (SELECT count(*) = count(DISTINCT nombre) FROM public.b_tipo_operacion WHERE nombre IS NOT NULL) THEN
      ALTER TABLE public.b_tipo_operacion ADD CONSTRAINT uq_b_tipo_operacion_nombre UNIQUE (nombre);
    END IF;
  END IF;
END $$;


-- ============================================================
-- 4. FK indexes on b_viajes reference columns
--    (FK lookups without indexes cause sequential scans)
-- ============================================================

-- b_viajes already has idx on estatus_viaje_id and carga_id from previous migration
-- Add index on remaining FK-like columns

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='b_viajes' AND column_name='cliente_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_b_viajes_cliente ON public.b_viajes (cliente_id)';
  END IF;
END $$;

-- b_finanzas_viaje: likely FK to viajes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='b_finanzas_viaje' AND column_name='viaje_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_b_finanzas_viaje_id ON public.b_finanzas_viaje (viaje_id)';
  END IF;
END $$;

-- b_vehiculos: patente index
CREATE INDEX IF NOT EXISTS idx_b_vehiculos_patente ON public.b_vehiculos (patente);

-- b_vehiculos: tipo_vehiculo for filter queries
CREATE INDEX IF NOT EXISTS idx_b_vehiculos_tipo ON public.b_vehiculos (tipo_vehiculo);

-- config_clientes_bi: estado_visible for filtering
CREATE INDEX IF NOT EXISTS idx_config_clientes_bi_visible ON public.config_clientes_bi (estado_visible);


-- ============================================================
-- 5. NOT NULL constraints on critical columns
-- ============================================================

-- config_clientes_bi: nombre_estandar should never be null
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='config_clientes_bi'
    AND column_name='nombre_estandar' AND is_nullable='YES'
  ) THEN
    -- Only if no nulls exist
    IF NOT EXISTS (SELECT 1 FROM public.config_clientes_bi WHERE nombre_estandar IS NULL) THEN
      ALTER TABLE public.config_clientes_bi ALTER COLUMN nombre_estandar SET NOT NULL;
    END IF;
  END IF;
END $$;

-- config_clientes_bi: nombre_original should never be null
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='config_clientes_bi'
    AND column_name='nombre_original' AND is_nullable='YES'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM public.config_clientes_bi WHERE nombre_original IS NULL) THEN
      ALTER TABLE public.config_clientes_bi ALTER COLUMN nombre_original SET NOT NULL;
    END IF;
  END IF;
END $$;


-- ============================================================
-- 6. ANALYZE updated tables
-- ============================================================

ANALYZE public.config_clientes_bi;
ANALYZE public.b_vehiculos;
ANALYZE public.b_finanzas_viaje;
