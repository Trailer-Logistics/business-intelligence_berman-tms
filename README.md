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

Estructura modular en `src/styles/`, importada desde `src/index.css`:

```
src/index.css                  ← Punto de entrada (imports + @tailwind)
src/styles/
  tokens.css                   ← Variables CSS (:root) — colores, radios, sidebar
  base.css                     ← Resets, tipografia, scrollbar, seleccion
  effects.css                  ← Glass, gradient borders, card glows, mesh
  animations.css               ← Keyframes + clases animate-* + stagger
  utilities.css                ← Helpers de proposito unico (glow, dot-grid, etc.)
tailwind.config.ts             ← Mapeo de tokens a clases Tailwind
components.json                ← Configuracion shadcn/ui
```

### Tokens de color

Dark mode con acentos cyan. Modelo HSL via CSS custom properties en `tokens.css`. Se consumen como `hsl(var(--token))` en Tailwind y CSS.

| Token | Valor | Uso |
|-------|-------|-----|
| `--background` | `222 47% 5%` | Fondo principal (azul-gris muy oscuro) |
| `--foreground` | `210 40% 96%` | Texto principal (casi blanco) |
| `--primary` | `191 100% 50%` | Accion principal (cyan) |
| `--card` | `222 40% 8%` | Superficie de cards |
| `--secondary` | `222 30% 12%` | Elementos secundarios |
| `--destructive` | `0 72% 51%` | Acciones destructivas (rojo) |
| `--muted` | `222 25% 11%` | Texto/fondo atenuado |
| `--border` | `222 25% 14%` | Bordes |

**Paleta extendida** (en `tokens.css`, mapeada en `tailwind.config.ts`):

| Token | Tailwind class | Uso |
|-------|---------------|-----|
| `--cyan` | `text-cyan`, `bg-cyan` | Acento principal |
| `--violet` | `text-violet`, `bg-violet` | Acento secundario |
| `--emerald` | `text-success` | Exito |
| `--amber` | `text-warning` | Warning |
| `--rose` | `text-rose` | Error/alerta |
| `--blue` | `text-electric-blue` | Datos/info |

### Tipografia

| Familia | Tailwind | Uso | Pesos |
|---------|----------|-----|-------|
| **Montserrat** | `font-display` | Headings (h1-h6) | 300-900 |
| **Inter** | `font-sans` | Body text, UI | 300-700 |
| **JetBrains Mono** | `font-mono` | Codigo, KPIs, numeros | 400-700 |

### Efectos (`effects.css`)

| Clase | Efecto |
|-------|--------|
| `.glass` | Glassmorphism — backdrop-blur 24px + saturacion |
| `.card-glow` | Hover glow cyan + elevacion (-3px) |
| `.card-hero` | Card grande con gradiente + linea de luz superior |
| `.gradient-border` | Borde gradiente estatico (cyan → violet) |
| `.gradient-border-animated` | Borde gradiente rotando (4s loop) |
| `.bg-mesh-animated` | Fondo malla radial con drift (20s) |
| `.sidebar-active-glow` | Linea vertical gradiente para item activo |

### Animaciones (`animations.css`)

Escala de duraciones: fast=0.2s, normal=0.4-0.5s, slow=3-6s, ambient=20s.

| Clase | Efecto | Duracion |
|-------|--------|----------|
| `.animate-fade-up` | Entrada desde abajo con opacity | 0.5s |
| `.animate-fade-in` | Fade de opacity | 0.4s |
| `.animate-float` | Flotacion vertical sutil | 6s loop |
| `.animate-pulse-glow` | Pulso de box-shadow cyan | 3s loop |
| `.animate-spin-slow` | Rotacion lenta | 20s loop |
| `.stagger > *` | Cascade de fade-up, 80ms entre hijos | max 8 |

### Utilidades (`utilities.css`)

| Clase | Uso |
|-------|-----|
| `.text-glow-cyan` | Text-shadow con glow cyan |
| `.glow-cyan` | Box-shadow glow al 12% |
| `.dot-grid` | Patron de puntos 24px para fondos |
| `.number-display` | Numeros tabulares (JetBrains Mono + tnum) |

### Componentes UI

48 componentes **shadcn/ui** (Radix UI + Tailwind) en `src/components/ui/`:
- Base color: `slate` | Estilo: `default` | Border radius: `0.75rem`
- Import: `@/components/ui/*`

## Estructura del proyecto

```
src/
  index.css                    # Punto de entrada CSS (imports modulares)
  styles/
    tokens.css                 # Variables CSS del design system
    base.css                   # Resets y tipografia
    effects.css                # Efectos visuales (glass, glow, gradients)
    animations.css             # Keyframes y clases de animacion
    utilities.css              # Helpers CSS
  hooks/
    useExternalData.ts         # Hook para consultar vistas Supabase
  integrations/
    supabase/                  # Cliente Supabase auto-generado
  pages/                       # Paginas del dashboard
  components/
    ui/                        # 48 componentes shadcn/ui
    ...                        # Componentes custom del dashboard

supabase/
  functions/
    sync-bermann/              # Edge Function de sincronizacion
  migrations/                  # Migraciones SQL
```
