# Trailer Logistics - App TMS

Plataforma BI y operacional para **Trailer Logistics**, construida sobre Supabase y React. Centraliza la gestion de viajes, flota, conductores y KPIs comerciales sincronizados desde Bermann TMS.

## Stack

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui + Framer Motion |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Sync | Edge Function `sync-bermann` (cada 15 min via pg_cron) |
| State | TanStack Query (React Query) |

## Arquitectura de datos

```
Bermann TMS API
      |
      v  (cada 15 min, Edge Function)
  ┌────────────────────────────────┐
  │        Supabase Postgres       │
  │                                │
  │  b_viajes          (viajes)    │
  │  b_finanzas_viaje  (costos)    │
  │  b_clientes        (clientes)  │
  │  b_conductores     (choferes)  │
  │  b_vehiculos       (flota)     │
  │  b_cargas / b_rutas / ...      │
  │                                │
  │  ── Vistas calculadas ──       │
  │  v_viajes_inteligentes (KPIs)  │
  │  v_alertas_flota               │
  │  v_alertas_conductores         │
  └────────────────────────────────┘
      |
      v  (supabase.from().select())
   React Dashboard
```

### Tablas principales

- **b_viajes** - Viajes operativos sincronizados desde Bermann. Cada fila tiene origen, destino, conductor, tracto y rampla.
- **b_finanzas_viaje** - Informacion financiera por viaje (tarifa, costos, monto facturado). Relacion 1:1 con b_viajes.
- **b_clientes** - Catalogo de clientes (razon social, RUT, zonas).
- **b_conductores** - Catalogo de conductores con documentos y licencias.
- **b_vehiculos** - Flota de tractos y ramplas con patente, tipo y estado de documentos.
- **config_clientes_bi** - Mapeo de nombres de cliente Bermann a nombres estandar del dashboard.
- **r_registro_walmart_loa** - Registro manual de tiempos operativos (carga, descarga, lead time).
- **r_forecast_contractual** - Proyeccion semanal de venta por cliente.

### Vistas

- **v_viajes_inteligentes** - Vista principal del dashboard. Cruza viajes + finanzas + clientes + rutas + estados para KPIs, OTD y venta.
- **v_alertas_flota** - Alertas de documentos de vehiculos por vencer (semaforo OPTIMO/AL DIA/POR VENCER/VENCIDO).
- **v_alertas_conductores** - Alertas de documentos de conductores por vencer.

## Seguridad

- **RLS (Row Level Security)** habilitado y forzado en todas las tablas.
- Roles: `admin`, `operador`, `viewer` con politicas diferenciadas.
- `anon` revocado completamente — solo `authenticated` y `service_role` tienen acceso.
- `ALTER DEFAULT PRIVILEGES` previene que tablas futuras queden expuestas.

## Sincronizacion con Bermann

La sincronizacion corre como **Supabase Edge Function** invocada por pg_cron cada 15 minutos:

- **Modo incremental** (default): Trae viajes de los ultimos 3 dias (~16 segundos).
- **Modo full**: Trae todo desde 2024-01-01 (para recarga completa).
- Los secrets (API key, usuario, clave) estan almacenados en Supabase Secrets.
- Logs de sync en la tabla `sync_log` (se limpian automaticamente cada 7 dias).

### Invocar sync manualmente

```bash
# Incremental (ultimos 3 dias)
supabase functions invoke sync-bermann --body '{"mode":"incremental","daysBack":3}'

# Full (desde 2024)
supabase functions invoke sync-bermann --body '{"mode":"full"}'
```

## Desarrollo local

```bash
# Clonar e instalar
git clone <URL_DEL_REPO>
cd "Trailer Logistics - App TMS"
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Requiere Node.js >= 18. Las variables de entorno de Supabase estan en `.env`.

## Migraciones SQL

Las migraciones viven en `supabase/migrations/` y se aplican con:

```bash
npx supabase db push
```

| Migracion | Descripcion |
|-----------|-------------|
| `20260307160000` | RLS + indices de performance + triggers de auditoria |
| `20260307170000` | Lockdown de todas las tablas restantes + vistas |
| `20260307180000` | PKs, UNIQUE constraints, NOT NULL, FK indexes |
| `20260307190000` | pg_cron job para sync automatico cada 15 min |
| `20260307200000` | Documentacion de tablas y columnas (COMMENT ON) |

## Estructura del proyecto

```
src/
  hooks/
    useExternalData.ts   # Hook principal para consultar vistas Supabase
  integrations/
    supabase/            # Cliente Supabase auto-generado
  pages/                 # Paginas del dashboard
  components/            # Componentes React

supabase/
  functions/
    sync-bermann/        # Edge Function de sincronizacion
  migrations/            # Migraciones SQL
```
