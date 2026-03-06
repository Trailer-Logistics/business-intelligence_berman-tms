import { useMemo } from "react";
import { useViajes } from "@/hooks/useViajes";

interface ForecastRow {
  lunes_clp: number | null;
  martes_clp: number | null;
  miercoles_clp: number | null;
  jueves_clp: number | null;
  viernes_clp: number | null;
  sabado_clp: number | null;
  cliente_estandar: string;
  [key: string]: any;
}

interface ClientDayDetail {
  real: number;
  forecast: number;
  delta: number; // percentage
}

interface DayCell {
  date: string;
  dayOfMonth: number;
  dow: number;
  real: number;
  forecast: number;
  clientDetails: Record<string, ClientDayDetail>;
  isCurrentMonth: boolean;
}

const DOW_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const DOW_TO_COL: Record<number, keyof ForecastRow> = {
  1: "lunes_clp",
  2: "martes_clp",
  3: "miercoles_clp",
  4: "jueves_clp",
  5: "viernes_clp",
  6: "sabado_clp",
};

function getColor(real: number, forecast: number): string {
  if (forecast === 0 && real === 0) return "bg-muted/30";
  if (forecast === 0) return "bg-muted/20"; // no forecast defined → gray
  const ratio = real / forecast;
  if (ratio >= 0.95) return "bg-success/50";
  if (ratio >= 0.70) return "bg-warning/50";
  return "bg-destructive/50";
}

interface ForecastHeatmapProps {
  forecastRows?: ForecastRow[];
}

export default function ForecastHeatmap({ forecastRows = [] }: ForecastHeatmapProps) {
  const { filteredViajes, filters } = useViajes();

  // Per-client, per-DOW forecast map
  const clientDowForecast = useMemo(() => {
    const map: Record<string, Record<number, number>> = {};
    for (const row of forecastRows) {
      const client = row.cliente_estandar || "Otros";
      if (!map[client]) map[client] = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      for (const [dow, col] of Object.entries(DOW_TO_COL)) {
        map[client][Number(dow)] += Number(row[col]) || 0;
      }
    }
    return map;
  }, [forecastRows]);

  // Total DOW forecast (sum across all clients)
  const dowForecastMap = useMemo(() => {
    const map: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const clientMap of Object.values(clientDowForecast)) {
      for (let i = 0; i <= 6; i++) map[i] += clientMap[i] || 0;
    }
    return map;
  }, [clientDowForecast]);

  // All forecast client names
  const forecastClients = useMemo(() => Object.keys(clientDowForecast), [clientDowForecast]);

  const { cells, totalForecast } = useMemo(() => {
    // Build daily real per client
    const dailyMap: Record<string, Record<string, number>> = {};
    for (const v of filteredViajes) {
      const estado = v.estado_viaje_estandar?.toLowerCase() || "";
      if (estado.includes("anulado") || estado.includes("programado")) continue;
      if (!v.fecha_salida_origen) continue;
      const d = typeof v.fecha_salida_origen === "string" ? v.fecha_salida_origen.slice(0, 10) : "";
      if (!d) continue;
      if (!dailyMap[d]) dailyMap[d] = {};
      const c = v.cliente_estandar || "Otros";
      dailyMap[d][c] = (dailyMap[d][c] || 0) + (v.tarifa_venta || 0);
    }

    const fromDate = new Date(filters.dateFrom);
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: DayCell[] = [];
    let totalForecast = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = new Date(year, month, d).getDay();
      const dayClients = dailyMap[date] || {};
      const forecast = dowForecastMap[dow] || 0;
      const real = Object.values(dayClients).reduce((a, b) => a + b, 0);
      totalForecast += forecast;

      // Build per-client detail for this day
      const allClients = new Set([...Object.keys(dayClients), ...forecastClients]);
      const clientDetails: Record<string, ClientDayDetail> = {};
      for (const client of allClients) {
        const cReal = dayClients[client] || 0;
        const cForecast = clientDowForecast[client]?.[dow] || 0;
        if (cReal === 0 && cForecast === 0) continue;
        const delta = cForecast > 0 ? ((cReal / cForecast - 1) * 100) : (cReal > 0 ? 100 : 0);
        clientDetails[client] = { real: cReal, forecast: cForecast, delta };
      }

      cells.push({
        date,
        dayOfMonth: d,
        dow,
        real: Math.round(real),
        forecast: Math.round(forecast),
        clientDetails,
        isCurrentMonth: true,
      });
    }

    return { cells, totalForecast };
  }, [filteredViajes, filters.dateFrom, dowForecastMap, forecastClients, clientDowForecast]);

  // Group by weeks
  const weeks = useMemo(() => {
    const result: DayCell[][] = [];
    let current: DayCell[] = [];

    if (cells.length > 0) {
      const firstDow = cells[0].dow;
      for (let i = 0; i < firstDow; i++) {
        current.push({ date: "", dayOfMonth: 0, dow: i, real: 0, forecast: 0, clientDetails: {}, isCurrentMonth: false });
      }
    }

    for (const cell of cells) {
      current.push(cell);
      if (current.length === 7) {
        result.push(current);
        current = [];
      }
    }
    if (current.length > 0) {
      while (current.length < 7) {
        current.push({ date: "", dayOfMonth: 0, dow: current.length, real: 0, forecast: 0, clientDetails: {}, isCurrentMonth: false });
      }
      result.push(current);
    }

    return result;
  }, [cells]);

  const formatCLP = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`;

  return (
    <div className="card-executive p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Heatmap de Venta Diaria</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Real vs Forecast Contractual · Meta mes: {formatCLP(totalForecast)}
      </p>

      {/* DOW Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-[10px] text-muted-foreground text-center font-medium">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell, ci) => (
              <div
                key={ci}
                className={`relative aspect-square rounded-md flex flex-col items-center justify-center transition-all group cursor-default ${
                  !cell.isCurrentMonth ? "opacity-20" : getColor(cell.real, cell.forecast)
                }`}
              >
                {cell.isCurrentMonth && (
                  <>
                    <span className="text-[10px] font-medium text-foreground">{cell.dayOfMonth}</span>
                    <span className="text-[8px] text-foreground/70">{cell.real > 0 ? formatCLP(cell.real) : ""}</span>

                    {/* Tooltip */}
                    {(cell.real > 0 || cell.forecast > 0) && (
                      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                        <div className="card-executive p-3 shadow-xl min-w-[220px] border border-border">
                          <p className="text-[10px] font-semibold text-foreground mb-1">{cell.date}</p>
                          <p className="text-[10px] text-primary font-bold">Real: {formatCLP(cell.real)}</p>
                          <p className="text-[10px] text-warning font-bold">Forecast: {formatCLP(cell.forecast)}</p>
                          {cell.forecast > 0 && (
                            <p className={`text-[10px] font-bold mb-2 ${cell.real >= cell.forecast ? "text-success" : "text-destructive"}`}>
                              Δ {((cell.real / cell.forecast - 1) * 100).toFixed(1)}%
                            </p>
                          )}
                          {/* Per-client breakdown - show red clients first */}
                          <div className="space-y-0.5 border-t border-border pt-1">
                            <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">Detalle por cliente:</p>
                            {Object.entries(cell.clientDetails)
                              .sort((a, b) => a[1].delta - b[1].delta) // worst first
                              .slice(0, 8)
                              .map(([client, detail]) => {
                                const isRed = detail.forecast > 0 && detail.real < detail.forecast;
                                return (
                                  <div key={client} className="flex justify-between text-[9px] gap-2">
                                    <span className={`truncate ${isRed ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{client}</span>
                                    <span className={`font-mono whitespace-nowrap ${isRed ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                                      {formatCLP(detail.real)} {detail.forecast > 0 ? `(${detail.delta >= 0 ? "+" : ""}${detail.delta.toFixed(0)}%)` : ""}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-destructive/50" /><span className="text-[9px] text-muted-foreground">&lt;70%</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning/50" /><span className="text-[9px] text-muted-foreground">70–95%</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-success/50" /><span className="text-[9px] text-muted-foreground">≥95%</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted/20" /><span className="text-[9px] text-muted-foreground">Sin forecast</span></div>
      </div>
    </div>
  );
}
