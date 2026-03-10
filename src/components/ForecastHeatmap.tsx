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

function getColor(real: number, forecast: number, dow: number, isCurrentMonth: boolean): string {
  if (!isCurrentMonth) return "";
  if (dow === 0) return "bg-gray-300"; // domingo: gris uniforme, sin contorno
  if (real === 0) return "bg-white border border-gray-300 rounded-lg"; // sin datos: con contorno
  if (forecast === 0) return "bg-gray-100 rounded-lg";
  const ratio = real / forecast;
  if (ratio >= 0.95) return "bg-green-100 rounded-lg"; // >= 95%: verde tenue, sin contorno
  if (ratio >= 0.70) return "bg-amber-100 rounded-lg"; // 70-95%: mostaza tenue, sin contorno
  return "bg-red-100 rounded-lg"; // < 70%: rojo tenue, sin contorno
}

function hasData(cell: { real: number; forecast: number }): boolean {
  return cell.real > 0;
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

    // Parse dateFrom string directly to avoid UTC timezone shift
    const [yearStr, monthStr] = filters.dateFrom.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr) - 1; // JS months are 0-indexed
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
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all cursor-default ${
                  !cell.isCurrentMonth ? "opacity-0" : getColor(cell.real, cell.forecast, cell.dow, cell.isCurrentMonth)
                } ${cell.isCurrentMonth && hasData(cell) ? "group" : ""}`}
              >
                {cell.isCurrentMonth && (
                  <>
                    <span className={`text-[10px] font-medium ${hasData(cell) ? "text-gray-700" : "text-gray-400"}`}>{cell.dayOfMonth}</span>
                    <span className="text-[8px] text-gray-600">{cell.real > 0 ? formatCLP(cell.real) : ""}</span>

                    {/* Tooltip - only when there's data */}
                    {hasData(cell) && (
                      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-xl min-w-[220px]">
                          <p className="text-[10px] font-semibold text-black mb-1">{cell.date}</p>
                          <p className="text-[10px] text-[hsl(191,100%,35%)] font-bold">Real: {formatCLP(cell.real)}</p>
                          <p className="text-[10px] text-amber-600 font-bold">Forecast: {formatCLP(cell.forecast)}</p>
                          {cell.forecast > 0 && (
                            <p className={`text-[10px] font-bold mb-2 ${(cell.real / cell.forecast) >= 0.95 ? "text-green-600" : (cell.real / cell.forecast) >= 0.70 ? "text-amber-600" : "text-red-600"}`}>
                              Δ {((cell.real / cell.forecast - 1) * 100).toFixed(1)}%
                            </p>
                          )}
                          <div className="space-y-0.5 border-t border-gray-100 pt-1">
                            <p className="text-[9px] font-semibold text-gray-500 mb-0.5">Detalle por cliente:</p>
                            {Object.entries(cell.clientDetails)
                              .sort((a, b) => a[1].delta - b[1].delta)
                              .slice(0, 8)
                              .map(([client, detail]) => {
                                const ratio = detail.forecast > 0 ? detail.real / detail.forecast : 1;
                                const color = ratio >= 0.95 ? "text-green-600" : ratio >= 0.70 ? "text-amber-600" : "text-red-600";
                                return (
                                  <div key={client} className="flex justify-between text-[9px] gap-2">
                                    <span className={`truncate font-semibold ${color}`}>{client}</span>
                                    <span className={`font-mono whitespace-nowrap font-semibold ${color}`}>
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
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-md bg-red-100" /><span className="text-[9px] text-gray-500">&lt;70%</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-md bg-amber-100" /><span className="text-[9px] text-gray-500">70–95%</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-md bg-green-100" /><span className="text-[9px] text-gray-500">≥95%</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-md bg-gray-300" /><span className="text-[9px] text-gray-500">Domingo</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-md bg-white border border-gray-300" /><span className="text-[9px] text-gray-500">Sin datos</span></div>
      </div>
    </div>
  );
}
