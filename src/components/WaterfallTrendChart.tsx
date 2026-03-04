import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

interface Viaje {
  fecha_salida_origen?: string;
  tarifa_venta?: number;
  [key: string]: any;
}

interface Props {
  viajes: Viaje[];
}

type Metric = "viajes" | "venta";
type Granularity = "year" | "month" | "day";

const formatCLP = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const tooltipStyle: React.CSSProperties = {
  background: "hsl(220, 25%, 10%)",
  border: "1px solid hsl(220, 20%, 18%)",
  borderRadius: "8px",
  color: "hsl(200, 20%, 90%)",
  fontSize: "12px",
  padding: "8px 12px",
};

const WaterfallTrendChart = ({ viajes }: Props) => {
  const [metric, setMetric] = useState<Metric>("viajes");
  const [granularity, setGranularity] = useState<Granularity>("day");

  const waterfallData = useMemo(() => {
    // Aggregate by granularity
    const map: Record<string, number> = {};
    for (const v of viajes) {
      if (!v.fecha_salida_origen) continue;
      const dateStr = typeof v.fecha_salida_origen === "string" ? v.fecha_salida_origen : "";
      if (!dateStr) continue;

      let key = "";
      if (granularity === "year") key = dateStr.slice(0, 4);
      else if (granularity === "month") key = dateStr.slice(0, 7);
      else key = dateStr.slice(0, 10);

      if (!map[key]) map[key] = 0;
      map[key] += metric === "venta" ? (v.tarifa_venta || 0) : 1;
    }

    const sorted = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
    if (sorted.length === 0) return [];

    // Take last N entries based on granularity
    const maxItems = granularity === "day" ? 30 : granularity === "month" ? 12 : 10;
    const sliced = sorted.slice(-maxItems);

    // Build waterfall: each bar shows the delta from previous period
    const result: { name: string; value: number; start: number; end: number; isPositive: boolean }[] = [];
    let cumulative = 0;

    for (let i = 0; i < sliced.length; i++) {
      const [key, val] = sliced[i];
      const delta = i === 0 ? val : val - (sliced[i - 1]?.[1] || 0);
      const start = cumulative;
      cumulative += delta;

      let label = key;
      if (granularity === "day") label = key.slice(5); // MM-DD
      else if (granularity === "month") label = key.slice(2); // YY-MM

      result.push({
        name: label,
        value: delta,
        start: Math.min(start, cumulative),
        end: Math.max(start, cumulative),
        isPositive: delta >= 0,
      });
    }

    return result;
  }, [viajes, metric, granularity]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={tooltipStyle}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p>
          Δ {metric === "venta" ? "Venta" : "Viajes"}:{" "}
          <span style={{ color: d?.isPositive ? "hsl(145, 65%, 45%)" : "hsl(0, 80%, 55%)" }}>
            {metric === "venta" ? formatCLP(d?.value || 0) : d?.value?.toLocaleString("es-CL")}
          </span>
        </p>
      </div>
    );
  };

  const btnBase = "px-3 py-1 text-[11px] font-medium rounded-md transition-all duration-200";
  const btnActive = "bg-primary/20 text-primary border border-primary/30";
  const btnInactive = "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent";

  return (
    <div className="card-executive p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Tendencia de Viajes</h3>
          <p className="text-xs text-muted-foreground">Cascada — variación entre períodos</p>
          <div className="flex gap-1 mt-2">
            <button className={`${btnBase} ${metric === "viajes" ? btnActive : btnInactive}`} onClick={() => setMetric("viajes")}>
              Viajes
            </button>
            <button className={`${btnBase} ${metric === "venta" ? btnActive : btnInactive}`} onClick={() => setMetric("venta")}>
              Venta
            </button>
          </div>
        </div>
        <div className="flex gap-1">
          {(["year", "month", "day"] as Granularity[]).map((g) => (
            <button
              key={g}
              className={`${btnBase} ${granularity === g ? btnActive : btnInactive}`}
              onClick={() => setGranularity(g)}
            >
              {g === "year" ? "Año" : g === "month" ? "Mes" : "Día"}
            </button>
          ))}
        </div>
      </div>

      {waterfallData.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
            <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={10} angle={granularity === "day" ? -30 : 0} textAnchor={granularity === "day" ? "end" : "middle"} height={granularity === "day" ? 50 : 30} />
            <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => (metric === "venta" ? formatCLP(v) : v)} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(220, 20%, 25%)" />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {waterfallData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isPositive ? "hsl(145, 65%, 45%)" : "hsl(0, 80%, 55%)"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>
      )}
    </div>
  );
};

export default WaterfallTrendChart;
