import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";

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
  background: "hsl(222, 40%, 8%)",
  border: "1px solid hsl(222, 25%, 18%)",
  borderRadius: "12px",
  color: "hsl(210, 20%, 93%)",
  fontSize: "12px",
  padding: "10px 14px",
  boxShadow: "0 8px 32px hsl(222, 47%, 6%, 0.5)",
};

const WaterfallTrendChart = ({ viajes }: Props) => {
  const [metric, setMetric] = useState<Metric>("viajes");
  const [granularity, setGranularity] = useState<Granularity>("day");

  const waterfallData = useMemo(() => {
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

    const maxItems = granularity === "day" ? 30 : granularity === "month" ? 12 : 10;
    const sliced = sorted.slice(-maxItems);

    const result: { name: string; value: number; realValue: number; start: number; end: number; isPositive: boolean; pct: number }[] = [];
    let cumulative = 0;

    for (let i = 0; i < sliced.length; i++) {
      const [key, val] = sliced[i];
      const prevVal = i === 0 ? 0 : (sliced[i - 1]?.[1] || 0);
      const delta = i === 0 ? val : val - prevVal;
      const pct = i === 0 ? 0 : prevVal !== 0 ? ((delta / prevVal) * 100) : 0;
      const start = cumulative;
      cumulative += delta;

      let label = key;
      if (granularity === "day") label = key.slice(5);
      else if (granularity === "month") label = key.slice(2);

      result.push({
        name: label,
        value: delta,
        realValue: val,
        start: Math.min(start, cumulative),
        end: Math.max(start, cumulative),
        isPositive: delta >= 0,
        pct,
      });
    }

    return result;
  }, [viajes, metric, granularity]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const deltaLabel = metric === "venta" ? formatCLP(d?.value || 0) : d?.value?.toLocaleString("es-CL");
    const realLabel = metric === "venta" ? formatCLP(d?.realValue || 0) : d?.realValue?.toLocaleString("es-CL");
    const pctLabel = d?.pct !== undefined ? `${d.pct >= 0 ? "+" : ""}${d.pct.toFixed(1)}%` : "--";
    const deltaColor = d?.isPositive ? "hsl(152, 69%, 45%)" : "hsl(0, 72%, 51%)";
    return (
      <div style={tooltipStyle}>
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(191,100%,50%)]" />
            Real: <span className="font-mono font-semibold text-[hsl(191,100%,50%)]">{realLabel}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: deltaColor }} />
            Delta: <span className="font-mono font-semibold" style={{ color: deltaColor }}>{deltaLabel}</span>
          </p>
          <p className="text-muted-foreground">
            Variacion: <span className="font-mono" style={{ color: deltaColor }}>{pctLabel}</span>
          </p>
        </div>
      </div>
    );
  };

  const btnBase = "px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200";
  const btnActive = "bg-[hsl(191,100%,50%,0.15)] text-[hsl(191,100%,35%)] border border-[hsl(191,100%,50%,0.4)]";
  const btnInactive = "text-black/50 hover:text-black hover:bg-black/5 border border-transparent";

  return (
    <div className="rounded-xl border border-black bg-white p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-[hsl(152,69%,40%)]" strokeWidth={1.8} />
          <h3 className="text-sm font-semibold text-black">Tendencia Waterfall</h3>
          <div className="flex gap-1 ml-2">
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
              {g === "year" ? "Ano" : g === "month" ? "Mes" : "Dia"}
            </button>
          ))}
        </div>
      </div>

      {waterfallData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={waterfallData}>
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(152, 69%, 45%)" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 85%)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="hsl(0, 0%, 40%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              angle={granularity === "day" ? -30 : 0}
              textAnchor={granularity === "day" ? "end" : "middle"}
              height={granularity === "day" ? 50 : 30}
            />
            <YAxis
              stroke="hsl(0, 0%, 40%)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (metric === "venta" ? formatCLP(v) : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(0, 0%, 60%)" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={20}>
              {waterfallData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isPositive ? "url(#greenGrad)" : "url(#redGrad)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center py-20 text-sm text-black/40">Sin datos</div>
      )}
    </div>
  );
};

export default WaterfallTrendChart;
