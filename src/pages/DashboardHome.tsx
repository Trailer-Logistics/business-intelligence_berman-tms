import { useMemo } from "react";
import { useViajes } from "@/hooks/useViajes";
import KpiCard from "@/components/KpiCard";
import GlobalFiltersPanel from "@/components/GlobalFiltersPanel";
import { Truck, DollarSign, Route, Clock, TrendingUp, Loader2 } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

const tooltipStyle = {
  background: "hsl(220, 25%, 10%)",
  border: "1px solid hsl(220, 20%, 18%)",
  borderRadius: "8px",
  color: "hsl(200, 20%, 90%)",
  fontSize: "12px",
};

const PIE_COLORS = [
  "hsl(185, 100%, 50%)", "hsl(145, 65%, 45%)", "hsl(40, 95%, 55%)",
  "hsl(220, 90%, 55%)", "hsl(270, 70%, 60%)", "hsl(0, 80%, 55%)",
];

const DashboardHome = () => {
  const { filteredViajes, isLoading } = useViajes();

  const kpis = useMemo(() => {
    const total = filteredViajes.length;
    if (total === 0) return { total: 0, otd: 0, km: 0, tarifaPromedio: 0 };

    let onTime = 0, otdEligible = 0, totalKm = 0, totalTarifa = 0;
    for (const v of filteredViajes) {
      totalKm += v.km_recorridos || 0;
      totalTarifa += v.tarifa_venta || 0;
      if (v.ts_entrada_origen_gps && v.ts_entrada_origen_plan) {
        otdEligible++;
        if (v.ts_entrada_origen_gps <= v.ts_entrada_origen_plan) onTime++;
      }
    }

    return {
      total,
      otd: otdEligible > 0 ? Math.round((onTime / otdEligible) * 100) : 0,
      km: Math.round(totalKm),
      tarifaPromedio: total > 0 ? Math.round(totalTarifa / total) : 0,
    };
  }, [filteredViajes]);

  // Volumen de venta (bars) + cantidad de viajes (line) por cliente
  const ventaClienteChart = useMemo(() => {
    const map: Record<string, { venta: number; viajes: number }> = {};
    for (const v of filteredViajes) {
      const key = v.cliente_estandar || "Otros";
      if (!map[key]) map[key] = { venta: 0, viajes: 0 };
      map[key].venta += v.tarifa_venta || 0;
      map[key].viajes += 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1].venta - a[1].venta)
      .slice(0, 8)
      .map(([name, d]) => ({
        name: name.length > 14 ? name.slice(0, 14) + "…" : name,
        venta: Math.round(d.venta),
        viajes: d.viajes,
      }));
  }, [filteredViajes]);

  const estadoPie = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of filteredViajes) {
      const estado = v.estado_viaje_estandar || "Sin estado";
      if (estado === "Planificado") continue; // Excluir planificados
      map[estado] = (map[estado] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [filteredViajes]);

  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of filteredViajes) {
      if (v.fecha_salida_origen) {
        const day = typeof v.fecha_salida_origen === "string" ? v.fecha_salida_origen.slice(0, 10) : "";
        if (day) map[day] = (map[day] || 0) + 1;
      }
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-30)
      .map(([date, count]) => ({ name: date.slice(5), viajes: count }));
  }, [filteredViajes]);

  const formatNumber = (n: number) => n.toLocaleString("es-CL");
  const formatCLP = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard <span className="text-primary">General</span></h1>
          <p className="text-sm text-muted-foreground">Resumen operacional en tiempo real</p>
        </div>
      </div>

      <GlobalFiltersPanel />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground text-sm">Cargando datos…</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Viajes" value={formatNumber(kpis.total)} icon={<Truck className="w-5 h-5" />} subtitle="Período seleccionado" />
            <KpiCard
              title="Puntualidad (OTD)"
              value={`${kpis.otd}%`}
              trend={kpis.otd >= 80 ? "up" : kpis.otd >= 60 ? "neutral" : "down"}
              change={kpis.otd >= 80 ? "Óptimo" : kpis.otd >= 60 ? "Aceptable" : "Crítico"}
              icon={<Clock className="w-5 h-5" />}
              subtitle="GPS ≤ Planificado en origen"
            />
            <KpiCard title="Km Recorridos" value={formatNumber(kpis.km)} icon={<Route className="w-5 h-5" />} subtitle="Total acumulado" />
            <KpiCard title="Tarifa Promedio" value={formatCLP(kpis.tarifaPromedio)} icon={<DollarSign className="w-5 h-5" />} subtitle="Venta por viaje" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Venta + Viajes por Cliente */}
            <div className="lg:col-span-2 card-executive p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Venta & Viajes por Cliente</h3>
              <p className="text-xs text-muted-foreground mb-4">Top 8 — Barras: venta · Línea: viajes</p>
              {ventaClienteChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={ventaClienteChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                    <XAxis type="number" xAxisId="venta" orientation="bottom" stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => formatCLP(v)} />
                    <XAxis type="number" xAxisId="viajes" orientation="top" stroke="hsl(270, 70%, 60%)" fontSize={11} hide />
                    <YAxis dataKey="name" type="category" stroke="hsl(215, 15%, 55%)" fontSize={11} width={120} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number, name: string) =>
                        name === "venta" ? [formatCLP(value), "Venta"] : [value, "Viajes"]
                      }
                    />
                    <Bar xAxisId="venta" dataKey="venta" fill="hsl(185, 100%, 50%)" radius={[0, 4, 4, 0]} name="venta" barSize={16} />
                    <Line xAxisId="viajes" dataKey="viajes" stroke="hsl(270, 70%, 60%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(270, 70%, 60%)" }} name="viajes" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>}
            </div>

            {/* Pie de estados (sin Planificado) */}
            <div className="card-executive p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Estado de Viajes</h3>
              <p className="text-xs text-muted-foreground mb-4">Distribución (sin Planificado)</p>
              {estadoPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={estadoPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {estadoPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {estadoPie.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[10px] text-muted-foreground truncate">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>}
            </div>
          </div>

          <div className="card-executive p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tendencia de Viajes</h3>
                <p className="text-xs text-muted-foreground">Volumen diario (fecha salida origen)</p>
              </div>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="viajes" stroke="hsl(185, 100%, 50%)" fill="url(#cyanGrad)" strokeWidth={2} name="Viajes" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;
