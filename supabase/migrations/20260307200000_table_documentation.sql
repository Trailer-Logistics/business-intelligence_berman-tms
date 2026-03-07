-- ============================================================
-- MIGRATION: Documentacion de tablas y columnas
-- Comentarios en lenguaje natural para el equipo
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- TABLAS TRANSACCIONALES (sync desde Bermann TMS)
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.b_viajes IS
  'Viajes operativos sincronizados desde Bermann TMS cada 15 minutos. Cada fila es un viaje con origen, destino, conductor, tracto y rampla asignados.';
COMMENT ON COLUMN public.b_viajes.id IS 'ID del viaje en Bermann (entero, viene del TMS externo)';
COMMENT ON COLUMN public.b_viajes.nro_viaje IS 'Numero de viaje visible para el usuario (ej: "3995")';
COMMENT ON COLUMN public.b_viajes.nro_guia IS 'Numero de guia de despacho asociada al viaje';
COMMENT ON COLUMN public.b_viajes.cliente IS 'Nombre del cliente (texto libre desde Bermann)';
COMMENT ON COLUMN public.b_viajes.estado_viaje IS 'Estado del viaje en texto (ej: "Finalizado", "En Ruta")';
COMMENT ON COLUMN public.b_viajes.estatus_viaje_id IS 'ID numerico del estado del viaje (FK logica a m_estatus_viaje)';
COMMENT ON COLUMN public.b_viajes.km_viaje IS 'Kilometros recorridos segun odometro GPS';
COMMENT ON COLUMN public.b_viajes.carga_id IS 'ID del tipo de carga transportada (FK logica a b_cargas)';
COMMENT ON COLUMN public.b_viajes.fecha_creacion IS 'Fecha y hora de creacion del viaje en Bermann';
COMMENT ON COLUMN public.b_viajes.f_ent_orig_prog IS 'Fecha de entrada programada al origen';
COMMENT ON COLUMN public.b_viajes.f_ent_orig_gps IS 'Fecha de entrada real al origen (GPS)';
COMMENT ON COLUMN public.b_viajes.f_ent_dest_prog IS 'Fecha de entrada programada al destino';
COMMENT ON COLUMN public.b_viajes.f_ent_dest_gps IS 'Fecha de entrada real al destino (GPS)';
COMMENT ON COLUMN public.b_viajes.datos_completos IS 'JSON completo del viaje tal como viene de la API Bermann (zonas, POD, conductor, etc.)';
COMMENT ON COLUMN public.b_viajes.ultima_actualizacion IS 'Timestamp de la ultima sincronizacion de este registro';

COMMENT ON TABLE public.b_finanzas_viaje IS
  'Informacion financiera por viaje: tarifa, costos y montos facturados. Relacion 1:1 con b_viajes.';
COMMENT ON COLUMN public.b_finanzas_viaje.id IS 'Mismo ID que b_viajes.id (relacion 1:1)';
COMMENT ON COLUMN public.b_finanzas_viaje.monto IS 'Monto total de venta del viaje en CLP';
COMMENT ON COLUMN public.b_finanzas_viaje.datos_completos IS 'JSON con detalle de tarifas, contrato, costos desde Bermann';

-- ════════════════════════════════════════════════════════════
-- TABLAS MAESTRAS (catálogos sincronizados)
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.b_clientes IS
  'Catalogo de clientes de Trailer Logistics. Incluye razon social, RUT y zonas asociadas.';
COMMENT ON COLUMN public.b_clientes.id IS 'ID del cliente en Bermann';
COMMENT ON COLUMN public.b_clientes.nombre IS 'Razon social o nombre comercial del cliente';

COMMENT ON TABLE public.b_conductores IS
  'Catalogo de conductores. Incluye nombre, RUT, licencia y documentos vigentes.';
COMMENT ON COLUMN public.b_conductores.id IS 'ID del conductor en Bermann';
COMMENT ON COLUMN public.b_conductores.nombre IS 'Nombre completo del conductor';
COMMENT ON COLUMN public.b_conductores.rut IS 'RUT del conductor (formato chileno)';
COMMENT ON COLUMN public.b_conductores.estado IS 'Estado activo/inactivo (1=activo, 0=inactivo)';

COMMENT ON TABLE public.b_vehiculos IS
  'Flota de vehiculos: tractos y ramplas con patente, tipo y estado de documentos.';
COMMENT ON COLUMN public.b_vehiculos.id IS 'ID del vehiculo en Bermann';
COMMENT ON COLUMN public.b_vehiculos.patente IS 'Patente del vehiculo (unica)';
COMMENT ON COLUMN public.b_vehiculos.tipo_vehiculo IS 'Tipo: TRACTO, RAMPLA, CAMION, etc.';
COMMENT ON COLUMN public.b_vehiculos.estado IS 'Estado activo/inactivo';

COMMENT ON TABLE public.b_cargas IS
  'Tipos de carga que se transportan (ej: pallets, cajas, contenedores).';
COMMENT ON COLUMN public.b_cargas.id IS 'ID del tipo de carga';
COMMENT ON COLUMN public.b_cargas.codigo_carga IS 'Codigo descriptivo de la carga';
COMMENT ON COLUMN public.b_cargas.contenido_carga IS 'Descripcion del contenido (Pallets, Cajas, etc.)';

COMMENT ON TABLE public.b_rutas IS
  'Rutas predefinidas entre origen y destino con zonas intermedias.';
COMMENT ON COLUMN public.b_rutas.id IS 'ID de la ruta';
COMMENT ON COLUMN public.b_rutas.nombre IS 'Nombre descriptivo de la ruta';
COMMENT ON COLUMN public.b_rutas.nombre_ruta IS 'Nombre alternativo (usado por las vistas)';

COMMENT ON TABLE public.b_contratos IS
  'Contratos comerciales con clientes y transportistas. Define tarifas por ruta.';

COMMENT ON TABLE public.b_tipo_operacion IS
  'Tipos de operacion logistica (ej: Burgers, Ope_adicional, etc.).';

COMMENT ON TABLE public.b_unidad_negocio IS
  'Unidades de negocio de la empresa (ej: Transporte, Mov. Interno).';

COMMENT ON TABLE public.b_transportistas IS
  'Transportistas tercerizados que operan para Trailer Logistics.';

COMMENT ON TABLE public.b_estado_pod IS
  'Estados posibles del POD (Proof of Delivery): Entregado, Validado, Correccion, etc.';

COMMENT ON TABLE public.b_estado_viaje IS
  'Estados posibles de un viaje (respaldo de Bermann, puede estar vacia).';

-- ════════════════════════════════════════════════════════════
-- TABLAS DE CATALOGO LOCAL
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.m_estatus_viaje IS
  'Maestro local de estados de viaje con ID y nombre legible. Usado por las vistas BI.';
COMMENT ON COLUMN public.m_estatus_viaje.id_estatus IS 'ID del estado (1=Planificado, 2=Asignado, 4=En Ruta, 6=Finalizado, 9=Anulado)';
COMMENT ON COLUMN public.m_estatus_viaje.nombre_estatus IS 'Nombre legible del estado';

COMMENT ON TABLE public.config_clientes_bi IS
  'Mapeo de nombres de cliente Bermann a nombres estandar del BI. Define que clientes son visibles y su tipo de contrato.';
COMMENT ON COLUMN public.config_clientes_bi.id IS 'UUID autogenerado';
COMMENT ON COLUMN public.config_clientes_bi.nombre_original IS 'Nombre tal como viene de Bermann (razon social)';
COMMENT ON COLUMN public.config_clientes_bi.nombre_estandar IS 'Nombre limpio para mostrar en el dashboard (ej: "Walmart LOA")';
COMMENT ON COLUMN public.config_clientes_bi.estado_visible IS 'true = aparece en el dashboard, false = oculto';
COMMENT ON COLUMN public.config_clientes_bi.tipo_contrato IS 'Tipo: Contrato (fijo) o Spot (eventual)';

-- ════════════════════════════════════════════════════════════
-- TABLAS DE REGISTRO (ingreso manual por usuarios)
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.r_registro_walmart_loa IS
  'Registro manual de tiempos operativos para viajes Walmart LOA. Cada fila tiene los tiempos de carga, descarga, lead time y retorno.';
COMMENT ON COLUMN public.r_registro_walmart_loa.id IS 'UUID autogenerado';
COMMENT ON COLUMN public.r_registro_walmart_loa.viaje_id IS 'ID del viaje en b_viajes al que corresponde este registro';
COMMENT ON COLUMN public.r_registro_walmart_loa.tiempo_carga_hrs IS 'Horas que tomo la carga en origen';
COMMENT ON COLUMN public.r_registro_walmart_loa.tiempo_descarga_hrs IS 'Horas que tomo la descarga en destino';
COMMENT ON COLUMN public.r_registro_walmart_loa.lead_time_hrs IS 'Tiempo de transito entre origen y destino';
COMMENT ON COLUMN public.r_registro_walmart_loa.tiempo_retorno_hrs IS 'Horas del viaje de retorno';
COMMENT ON COLUMN public.r_registro_walmart_loa.tiempo_total_hrs IS 'Suma automatica de todos los tiempos (columna generada)';
COMMENT ON COLUMN public.r_registro_walmart_loa.usuario_registro IS 'Email del usuario que registro los datos';

COMMENT ON TABLE public.r_forecast_contractual IS
  'Proyeccion semanal de venta por cliente. Cada fila es un cliente + mes con montos por dia de la semana.';
COMMENT ON COLUMN public.r_forecast_contractual.id IS 'UUID autogenerado';
COMMENT ON COLUMN public.r_forecast_contractual.cliente_estandar IS 'Nombre estandar del cliente (debe coincidir con config_clientes_bi)';
COMMENT ON COLUMN public.r_forecast_contractual.mes_proyeccion IS 'Primer dia del mes al que aplica la proyeccion';
COMMENT ON COLUMN public.r_forecast_contractual.lunes_clp IS 'Monto proyectado para lunes en CLP';
COMMENT ON COLUMN public.r_forecast_contractual.monto_total_semanal IS 'Suma automatica lunes a sabado (columna generada)';
COMMENT ON COLUMN public.r_forecast_contractual.venta_base_proyectada IS 'Venta base mensual proyectada';
COMMENT ON COLUMN public.r_forecast_contractual.monto_extras IS 'Montos adicionales fuera del contrato base';
COMMENT ON COLUMN public.r_forecast_contractual.forecast_final_contractual IS 'Forecast final = base + extras';

-- ════════════════════════════════════════════════════════════
-- TABLAS DE SISTEMA
-- ════════════════════════════════════════════════════════════

COMMENT ON TABLE public.config_usuarios IS
  'Usuarios de la plataforma BI. Se crea automaticamente al registrarse via Supabase Auth.';
COMMENT ON COLUMN public.config_usuarios.id IS 'UUID autogenerado';
COMMENT ON COLUMN public.config_usuarios.user_id IS 'UUID del usuario en auth.users (FK)';
COMMENT ON COLUMN public.config_usuarios.email IS 'Email del usuario';
COMMENT ON COLUMN public.config_usuarios.nombre IS 'Nombre para mostrar';
COMMENT ON COLUMN public.config_usuarios.rol IS 'Rol: admin, operador, viewer';
COMMENT ON COLUMN public.config_usuarios.activo IS 'true = cuenta activa, false = deshabilitada';

COMMENT ON TABLE public.sync_log IS
  'Log de ejecuciones del sync automatico con Bermann TMS. Se limpia automaticamente cada 7 dias.';
COMMENT ON COLUMN public.sync_log.mode IS 'Modo de sync: incremental (ultimos 3 dias) o full (todo desde 2024)';
COMMENT ON COLUMN public.sync_log.status IS 'Estado: running, completed, failed';
COMMENT ON COLUMN public.sync_log.results IS 'JSON con cantidad de registros sincronizados por tabla';

-- ════════════════════════════════════════════════════════════
-- VISTAS (calculadas a partir de las tablas base)
-- ════════════════════════════════════════════════════════════

COMMENT ON VIEW public.v_viajes_inteligentes IS
  'Vista principal del dashboard. Cruza viajes + finanzas + clientes + rutas + estados para mostrar KPIs, OTD, venta y estado por viaje.';

COMMENT ON VIEW public.v_alertas_flota IS
  'Alertas de documentos de flota por vencer o vencidos. Muestra patente, tipo de documento, fecha de vencimiento y semaforo (OPTIMO/AL DIA/POR VENCER/VENCIDO).';

COMMENT ON VIEW public.v_alertas_conductores IS
  'Alertas de documentos de conductores por vencer o vencidos. Misma logica de semaforo que v_alertas_flota.';
