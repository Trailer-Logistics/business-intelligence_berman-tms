import { useMemo } from "react";
import { useViajes, Viaje } from "@/hooks/useViajes";
import { Tooltip as RechartsTooltip } from "recharts";

interface DayCell {
  date: string;
  dayOfMonth: number;
  dow: number; // 0=Sun
  real: number;
  clientBreakdown: Record<string, number>;
  isCurrentMonth: boolean;
}

const DOW_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function getColor(real: number, avg: number): string {
  if (real === 0) return "bg-muted/30";
  if (real >= avg * 1.2) return "bg-success/60";
  if (real >= avg * 0.8) return "bg-success/30";
  if (real >= avg * 0.5) return "bg-warning/40";
  return "bg-destructive/40";
}

export default function ForecastHeatmap() {
  const { filteredViajes, filters } = useViajes();

  const { cells, avgDaily } = useMemo(() => {
    // Build daily map
    const dailyMap: Record<string, { real: number; clients: Record<string, number> }> = {};
    for (const v of filteredViajes) {
      const estado = v.estado_viaje_estandar?.toLowerCase() || "";
      if (estado.includes("anulado") || estado.includes("programado")) continue;
      if (!v.fecha_salida_origen) continue;
      const d = typeof v.fecha_salida_origen === "string" ? v.fecha_salida_origen.slice(0, 10) : "";
      if (!d) continue;
      if (!dailyMap[d]) dailyMap[d] = { real: 0, clients: {} };
      dailyMap[d].real += v.tarifa_venta || 0;
      const c = v.cliente_estandar || "Otros";
      dailyMap[d].clients[c] = (dailyMap[d].clients[c] || 0) + (v.tarifa_venta || 0);
    }

    // Generate calendar grid for the filter month
    const fromDate = new Date(filters.dateFrom);
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: DayCell[] = [];
    let totalReal = 0;
    let activeDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = new Date(year, month, d).getDay();
      const entry = dailyMap[date];
      const real = entry?.real || 0;
      if (real > 0) { totalReal += real; activeDays++; }
      cells.push({
        date,
        dayOfMonth: d,
        dow,
        real: Math.round(real),
        clientBreakdown: entry?.clients || {},
        isCurrentMonth: true,
      });
    }

    return { cells, avgDaily: activeDays > 0 ? totalReal / activeDays : 0 };
  }, [filteredViajes, filters.dateFrom]);

  // Group by weeks
  const weeks = useMemo(() => {
    const result: DayCell[][] = [];
    let current: DayCell[] = [];

    // Pad start
    if (cells.length > 0) {
      const firstDow = cells[0].dow;
      for (let i = 0; i < firstDow; i++) {
        current.push({ date: "", dayOfMonth: 0, dow: i, real: 0, clientBreakdown: {}, isCurrentMonth: false });
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
        current.push({ date: "", dayOfMonth: 0, dow: current.length, real: 0, clientBreakdown: {}, isCurrentMonth: false });
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
        Calendario Rojo/Verde — Promedio diario: {formatCLP(Math.round(avgDaily))}
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
                  !cell.isCurrentMonth ? "opacity-20" : getColor(cell.real, avgDaily)
                }`}
              >
                {cell.isCurrentMonth && (
                  <>
                    <span className="text-[10px] font-medium text-foreground">{cell.dayOfMonth}</span>
                    <span className="text-[8px] text-foreground/70">{cell.real > 0 ? formatCLP(cell.real) : ""}</span>

                    {/* Tooltip */}
                    {cell.real > 0 && (
                      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                        <div className="card-executive p-3 shadow-xl min-w-[180px] border border-border">
                          <p className="text-[10px] font-semibold text-foreground mb-1">{cell.date}</p>
                          <p className="text-[10px] text-primary font-bold mb-2">Total: {formatCLP(cell.real)}</p>
                          <div className="space-y-0.5">
                            {Object.entries(cell.clientBreakdown)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 5)
                              .map(([client, amount]) => (
                                <div key={client} className="flex justify-between text-[9px] text-muted-foreground">
                                  <span className="truncate mr-2">{client}</span>
                                  <span className="font-mono">{formatCLP(amount)}</span>
                                </div>
                              ))}
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
      <div className="flex items-center gap-4 mt-4 justify-center">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-destructive/40" /><span className="text-[9px] text-muted-foreground">&lt;50% prom</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-warning/40" /><span className="text-[9px] text-muted-foreground">50-80%</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-success/30" /><span className="text-[9px] text-muted-foreground">80-120%</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-success/60" /><span className="text-[9px] text-muted-foreground">&gt;120%</span></div>
      </div>
    </div>
  );
}
