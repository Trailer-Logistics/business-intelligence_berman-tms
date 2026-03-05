import { useMemo, useEffect, useState } from "react";
import { useViajes } from "@/hooks/useViajes";
import { useAuth } from "@/hooks/useAuth";
import GlobalFiltersPanel from "@/components/GlobalFiltersPanel";
import ForecastHeatmap from "@/components/ForecastHeatmap";
import KpiCard from "@/components/KpiCard";
import { Brain, TrendingUp, DollarSign, BarChart3, Loader2, Target } from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line, Area, ReferenceLine,
} from "recharts";

const tooltipStyle = {
  background: "hsl(220, 25%, 10%)",
  border: "1px solid hsl(220, 20%, 18%)",
  borderRadius: "8px",
  color: "hsl(200, 20%, 90%)",
  fontSize: "12px",
};

/** Returns all weekdays (Mon–Sat, no Sunday) in YYYY-MM-DD for a given month string */
function getOperatingDays(year: number, month: number): string[] {
  const days: string[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    const dow = d.getDay(); // 0=Sun
    if (dow >= 1 && dow <= 6) {
      days.push(d.toISOString().slice(0, 10));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export default function ForecastingPage() {
  const { filteredViajes, isLoading, uniqueValues, filters } = useViajes();
  const { session } = useAuth();

  // Derive the month from the dateFrom filter
  const selectedMonth = useMemo(() => {
    if (!filters.dateFrom) return null;
    // YYYY-MM-DD → first of month
    const [y, m] = filters.dateFrom.split("-");
    return `${y}-${m}-01`;
  }, [filters.dateFrom]);

  // Fetch forecast data from external DB via edge function
  const [forecastRows, setForecastRows] = useState<any[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    if (!selectedMonth || !session?.access_token) return;
    let cancelled = false;
    setForecastLoading(true);
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forecast-contractual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action: "read", mes_proyeccion: selectedMonth }),
    })
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setForecastRows(json.data || []); })
      .catch(() => { if (!cancelled) setForecastRows([]); })
      .finally(() => { if (!cancelled) setForecastLoading(false); });
    return () => { cancelled = true; };
  }, [selectedMonth, session?.access_token]);

  // Total forecast goal (sum of all clients' forecast_final_contractual)
  const forecastTotal = useMemo(() => {
    const base = forecastRows.reduce((acc: number, r: any) => acc + (Number(r.forecast_final_contractual) || 0), 0);
    const extras = forecastRows.reduce((acc: number, r: any) => acc + (Number(r.monto_extras) || 0), 0);
    return base + extras;
  }, [forecastRows]);

  // Operating days for the selected month
  const opDays = useMemo(() => {
    if (!filters.dateFrom) return [];
    const [y, m] = filters.dateFrom.split("-").map(Number);
    return getOperatingDays(y, m - 1); // JS months are 0-indexed
  }, [filters.dateFrom]);

  // Daily real sales (non-cumulative)
  const dailyRealMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of filteredViajes) {
      const estado = v.estado_viaje_estandar?.toLowerCase() || "";
      if (estado.includes("anulado") || estado.includes("programado")) continue;
      if (v.fecha_salida_origen) {
        const d = typeof v.fecha_salida_origen === "string" ? v.fecha_salida_origen.slice(0, 10) : "";
        if (d) map[d] = (map[d] || 0) + (v.tarifa_venta || 0);
      }
    }
    return map;
  }, [filteredViajes]);

  // Build the chart data with all 4 series
  const chartData = useMemo(() => {
    if (opDays.length === 0) return [];

    const dailyForecast = forecastTotal / opDays.length; // linear distribution
    const today = new Date().toISOString().slice(0, 10);

    // Determine how many operating days have data (up to today)
    const pastOpDays = opDays.filter((d) => d <= today);
    const totalRealSoFar = pastOpDays.reduce((acc, d) => acc + (dailyRealMap[d] || 0), 0);
    const avgDailyReal = pastOpDays.length > 0 ? totalRealSoFar / pastOpDays.length : 0;

    let accReal = 0;
    let accForecast = 0;
    let accProjected = 0;
    // For projection: we keep accumulating real up to today, then project from there
    let lastRealAcc = 0;
    let projectionStarted = false;

    return opDays.map((date) => {
      const dayReal = dailyRealMap[date] || 0;
      accReal += dayReal;
      accForecast += dailyForecast;

      const isPast = date <= today;

      if (isPast) {
        accProjected += dayReal;
        lastRealAcc = accProjected;
      } else {
        if (!projectionStarted) {
          projectionStarted = true;
          accProjected = lastRealAcc;
        }
        accProjected += avgDailyReal;
      }

      return {
        name: date.slice(5), // MM-DD
        fullDate: date,
        real: isPast ? Math.round(accReal) : null,
        forecastAcc: Math.round(accForecast),
        projected: date >= today ? Math.round(accProjected) : null,
      };
    });
  }, [opDays, dailyRealMap, forecastTotal]);

  const totalReal = useMemo(() => {
    let total = 0;
    for (const v of filteredViajes) {
      const estado = v.estado_viaje_estandar?.toLowerCase() || "";
      if (estado.includes("anulado") || estado.includes("programado")) continue;
      total += v.tarifa_venta || 0;
    }
    return total;
  }, [filteredViajes]);

  const formatCLP = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`;

  const daysWithData = Object.keys(dailyRealMap).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inteligencia <span className="text-primary">Predictiva</span></h1>
        <p className="text-sm text-muted-foreground">Forecasting de Demanda — Real vs Teórico</p>
      </div>

      <GlobalFiltersPanel />

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard title="Venta Real Total" value={formatCLP(totalReal)} icon={<DollarSign className="w-5 h-5" />} subtitle="Excluyendo anulados" />
            <KpiCard title="Meta Forecast" value={formatCLP(forecastTotal)} icon={<Target className="w-5 h-5" />} subtitle="Forecast contractual mes" />
            <KpiCard title="Clientes Activos" value={uniqueValues.clientes.length.toString()} icon={<BarChart3 className="w-5 h-5" />} subtitle="Con viajes en período" />
            <KpiCard title="Viajes Facturables" value={filteredViajes.filter(v => { const e = v.estado_viaje_estandar?.toLowerCase() || ""; return !e.includes("anulado") && !e.includes("programado"); }).length.toString()} icon={<TrendingUp className="w-5 h-5" />} subtitle="Período seleccionado" />
            <KpiCard title="Promedio Diario" value={formatCLP(daysWithData > 0 ? Math.round(totalReal / daysWithData) : 0)} icon={<Brain className="w-5 h-5" />} subtitle="Venta real / día" />
          </div>

          {/* Venta Diaria TTE */}
          <div className="card-executive p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Venta Diaria TTE</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Acumulado por día operativo (Lun–Sáb) · Línea roja = Meta Forecast
            </p>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="areaReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(220, 90%, 55%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(220, 90%, 55%)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => formatCLP(v)} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const real = payload.find((p: any) => p.dataKey === "real")?.value as number | null;
                      const forecast = payload.find((p: any) => p.dataKey === "forecastAcc")?.value as number | null;
                      const projected = payload.find((p: any) => p.dataKey === "projected")?.value as number | null;
                      const pctDiff = real != null && forecast && forecast > 0
                        ? (((real - forecast) / forecast) * 100).toFixed(1)
                        : null;
                      return (
                        <div style={tooltipStyle} className="p-2">
                          <p className="font-semibold mb-1">{label}</p>
                          {real != null && <p style={{ color: "hsl(220, 90%, 55%)" }}>Venta Real: ${real.toLocaleString("es-CL")}</p>}
                          {forecast != null && <p style={{ color: "hsl(45, 90%, 55%)" }}>Forecast Acum: ${forecast.toLocaleString("es-CL")}</p>}
                          {projected != null && <p style={{ color: "hsl(160, 70%, 50%)" }}>Proyectada: ${projected.toLocaleString("es-CL")}</p>}
                          {pctDiff != null && (
                            <p className="mt-1 font-semibold" style={{ color: Number(pctDiff) >= 0 ? "hsl(160, 70%, 50%)" : "hsl(0, 85%, 55%)" }}>
                              Δ Real vs Forecast: {Number(pctDiff) >= 0 ? "+" : ""}{pctDiff}%
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  {/* Meta Forecast - horizontal */}
                  {forecastTotal > 0 && (
                    <ReferenceLine
                      y={forecastTotal}
                      stroke="hsl(0, 85%, 55%)"
                      strokeDasharray="6 3"
                      strokeWidth={2}
                      label={({ viewBox }: any) => {
                        const { x, y: ly } = viewBox || {};
                        return (
                          <g>
                            <rect x={(x || 0) + 4} y={(ly || 0) - 24} width={120} height={18} rx={4} fill="hsla(0, 0%, 100%, 0.15)" />
                            <text x={(x || 0) + 10} y={(ly || 0) - 11} fill="hsl(0, 85%, 55%)" fontSize={11} fontWeight={600}>
                              Meta {formatCLP(forecastTotal)}
                            </text>
                          </g>
                        );
                      }}
                    />
                  )}
                  {/* Área + Línea: Venta Real Acumulada */}
                  <Area
                    type="monotone"
                    dataKey="real"
                    stroke="hsl(220, 90%, 55%)"
                    strokeWidth={2.5}
                    fill="url(#areaReal)"
                    dot={{ r: 3, fill: "hsl(220, 90%, 55%)" }}
                    name="Venta Real"
                    connectNulls={false}
                  />
                  {/* Línea 2: Forecast Acumulado */}
                  <Line
                    type="monotone"
                    dataKey="forecastAcc"
                    stroke="hsl(45, 90%, 55%)"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={false}
                    name="Forecast Acumulado"
                  />
                  {/* Línea 3: Venta Proyectada */}
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="hsl(160, 70%, 50%)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                    name="Venta Proyectada"
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-10 text-sm">Sin datos para el mes seleccionado</p>}
          </div>

          <ForecastHeatmap forecastRows={forecastRows} />

          <div className="card-executive p-4 border-l-4 border-l-primary">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Nota:</strong> El modelo Real vs Teórico completo se activa al registrar datos en el módulo <em>Forecast Contractual</em> (Planilla de Registro → Forecast Contractual).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
