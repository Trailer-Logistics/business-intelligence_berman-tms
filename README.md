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

## Design System

### Tema visual

Dark mode con acentos cyan/electricos. Modelo de color HSL via CSS custom properties en `src/index.css`.

| Token | Valor | Uso |
|-------|-------|-----|
| `--background` | `hsl(222 47% 5%)` | Fondo principal (azul-gris muy oscuro) |
| `--foreground` | `hsl(210 40% 96%)` | Texto principal (casi blanco) |
| `--primary` | `hsl(191 100% 50%)` | Color de accion principal (cyan) |
| `--card` | `hsl(222 40% 8%)` | Superficie de cards |
| `--secondary` | `hsl(222 30% 12%)` | Elementos secundarios |
| `--destructive` | `hsl(0 72% 51%)` | Acciones destructivas (rojo) |
| `--muted` | `hsl(222 25% 11%)` | Texto/fondo atenuado |
| `--border` | `hsl(222 25% 14%)` | Bordes |

**Paleta extendida:**
- Cyan: `hsl(191 100% 50%)` — acento principal
- Violet: `hsl(258 90% 66%)` — acento secundario
- Emerald: `hsl(152 69% 45%)` — exito/success
- Amber: `hsl(38 92% 50%)` — warning
- Rose: `hsl(340 82% 52%)` — error/alerta

### Tipografia

| Familia | Uso | Pesos |
|---------|-----|-------|
| **Montserrat** | Headings (h1-h6), display | 300–900 |
| **Inter** | Body text, UI general | 300–700 |
| **JetBrains Mono** | Codigo, numeros, KPIs | 400–700 |

Configuradas en `tailwind.config.ts` como `font-sans` (Inter), `font-display` (Montserrat) y `font-mono` (JetBrains Mono).

### Efectos visuales

| Clase CSS | Efecto |
|-----------|--------|
| `.glass` | Glassmorphism — backdrop-blur 24px con saturacion |
| `.card-glow` | Hover glow cyan con elevacion (-3px translateY) |
| `.card-hero` | Card grande con gradiente y linea de luz superior |
| `.gradient-border` | Borde gradiente estatico (cyan a violet) |
| `.gradient-border-animated` | Borde gradiente rotando (4s) |
| `.bg-mesh-animated` | Fondo de malla con gradientes radiales en movimiento (20s) |
| `.text-glow-cyan` | Text-shadow con glow cyan |
| `.glow-cyan` | Box-shadow glow cyan al 12% opacidad |
| `.dot-grid` | Patron de puntos sutil para fondos |

### Animaciones

- `fade-up` / `fade-in` — Transiciones de entrada suaves
- `float` — Flotacion vertical sutil (6s)
- `glow-pulse` — Pulso de glow cyan
- `shimmer` — Efecto shimmer en texto
- Stagger de hijos: cascade con 80ms de delay (hasta 8 children)

### Componentes UI

48 componentes de **shadcn/ui** (Radix UI + Tailwind). Configuracion en `components.json`:
- Base color: `slate`
- CSS variables: habilitadas
- Border radius base: `0.75rem` (`--radius`)
- Estilo: `default` (no `new-york`)

Alias de imports: `@/components/ui/*`

### Archivos clave del design system

| Archivo | Contenido |
|---------|-----------|
| `src/index.css` | Tokens CSS, efectos, animaciones, scrollbar |
| `tailwind.config.ts` | Tipografia, colores extendidos, animaciones |
| `components.json` | Config de shadcn/ui |
| `src/components/ui/` | 48 componentes de UI |

## Estructura del proyecto

```
src/
  hooks/
    useExternalData.ts   # Hook principal para consultar vistas Supabase
  integrations/
    supabase/            # Cliente Supabase auto-generado
  pages/                 # Paginas del dashboard
  components/
    ui/                  # 48 componentes shadcn/ui
    ...                  # Componentes custom del dashboard

supabase/
  functions/
    sync-bermann/        # Edge Function de sincronizacion
  migrations/            # Migraciones SQL
```
