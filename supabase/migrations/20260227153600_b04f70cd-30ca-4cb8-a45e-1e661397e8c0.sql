
-- Registro Walmart LOA: tiempos operativos por viaje (sin FK a tabla externa)
CREATE TABLE public.r_registro_walmart_loa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viaje_id BIGINT NOT NULL,
    nro_viaje TEXT,
    tiempo_carga_hrs NUMERIC(5,2) DEFAULT 0,
    tiempo_descarga_hrs NUMERIC(5,2) DEFAULT 0,
    lead_time_hrs NUMERIC(5,2) DEFAULT 0,
    tiempo_retorno_hrs NUMERIC(5,2) DEFAULT 0,
    tiempo_total_hrs NUMERIC(5,2) GENERATED ALWAYS AS (
      GREATEST(tiempo_carga_hrs, 0) + GREATEST(tiempo_descarga_hrs, 0) + GREATEST(lead_time_hrs, 0) + GREATEST(tiempo_retorno_hrs, 0)
    ) STORED,
    usuario_registro TEXT,
    editado_el TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(viaje_id)
);

ALTER TABLE public.r_registro_walmart_loa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read walmart loa records"
ON public.r_registro_walmart_loa FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert walmart loa records"
ON public.r_registro_walmart_loa FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update walmart loa records"
ON public.r_registro_walmart_loa FOR UPDATE
TO authenticated USING (true);

-- Forecast Contractual: matriz de proyecciones semanales
CREATE TABLE public.r_forecast_contractual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_estandar TEXT NOT NULL,
    mes_proyeccion DATE NOT NULL,
    lunes_clp NUMERIC DEFAULT 0,
    martes_clp NUMERIC DEFAULT 0,
    miercoles_clp NUMERIC DEFAULT 0,
    jueves_clp NUMERIC DEFAULT 0,
    viernes_clp NUMERIC DEFAULT 0,
    sabado_clp NUMERIC DEFAULT 0,
    monto_total_semanal NUMERIC GENERATED ALWAYS AS (
      COALESCE(lunes_clp,0) + COALESCE(martes_clp,0) + COALESCE(miercoles_clp,0) + COALESCE(jueves_clp,0) + COALESCE(viernes_clp,0) + COALESCE(sabado_clp,0)
    ) STORED,
    venta_base_proyectada NUMERIC DEFAULT 0,
    monto_extras NUMERIC DEFAULT 0,
    forecast_final_contractual NUMERIC DEFAULT 0,
    usuario_registro TEXT,
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cliente_estandar, mes_proyeccion)
);

ALTER TABLE public.r_forecast_contractual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read forecast records"
ON public.r_forecast_contractual FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert forecast records"
ON public.r_forecast_contractual FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update forecast records"
ON public.r_forecast_contractual FOR UPDATE
TO authenticated USING (true);
