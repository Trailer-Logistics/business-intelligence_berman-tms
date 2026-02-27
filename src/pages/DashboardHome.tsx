import { useMemo } from "react";
import { useViajes } from "@/hooks/useViajes";
import KpiCard from "@/components/KpiCard";
import GlobalFiltersPanel from "@/components/GlobalFiltersPanel";
import { Truck, DollarSign, Route, Clock, TrendingUp, Loader2, Banknote, FileCheck, FileX } from "lucide-react";
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
    if (total === 0) return { total: 0, otd: 0, km: 0, tarifaPromedio: 0, ventaTotal: 0 };

    let onTime = 0, otdEligible = 0, totalKm = 0, totalTarifa = 0;
    for (const v of filteredViajes) {
      totalKm += (v.km_recorridos && v.km_recorridos > 0) ? v.km_recorridos : 0;
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
      ventaTotal: Math.round(totalTarifa),
    };
  }, [filteredViajes]);

  // Prefactura segmentation
  const prefacturaData = useMemo(() => {
    let prefacturada = 0, noPrefactura = 0, prefacturadaCount = 0, noPrefacturaCount = 0;
    for (const v of filteredViajes) {
      const estado = v.estado_prefactura || "No Prefactura";
      if (estado === "No Prefactura") {
        noPrefactura += v.tarifa_venta || 0;
        noPrefacturaCount++;
      } else {
        prefacturada += v.tarifa_venta || 0;
        prefacturadaCount++;
      }
    }
    return {
      prefacturada: Math.round(prefacturada),
      noPrefactura: Math.round(noPrefactura),
      prefacturadaCount,
      noPrefacturaCount,
    };
  }, [filteredViajes]);

  // Compute unique days count for venta promedio diaria
  const uniqueDays = useMemo(() => {
    const days = new Set<string>();
    for (const v of filteredViajes) {
      if (v.fecha_salida_origen) {
        const day = typeof v.fecha_salida_origen === "string" ? v.fecha_salida_origen.slice(0, 10) : "";
        if (day) days.add(day);
      }
    }
    return Math.max(days.size, 1);
  }, [filteredViajes]);

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
        ventaPromDiaria: Math.round(d.venta / uniqueDays),
      }));
  }, [filteredViajes, uniqueDays]);

  const estadoPie = useMemo(() => {
    const map: Record<string, number> = {};
    let totalCount = 0;
    for (const v of filteredViajes) {
      const estado = v.estado_viaje_estandar || "Sin estado";
      if (estado === "Planificado") continue;
      map[estado] = (map[estado] || 0) + 1;
      totalCount++;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({
      name,
      value,
      pct: totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : "0",
    }));
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

  // Custom tooltip for pie chart with white text and percentage
  const PieTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
      <div style={{
        background: "hsl(220, 25%, 10%)",
        border: "1px solid hsl(220, 20%, 18%)",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "12px",
      }}>
        <p style={{ color: "#fff", fontWeight: 600, marginBottom: 2 }}>{item.name}</p>
        <p style={{ color: "#fff" }}>{item.value} viajes — <span style={{ color: item.payload.fill || "hsl(185, 100%, 50%)" }}>{item.payload.pct}%</span></p>
      </div>
    );
  };

  // Custom tooltip for composed chart with venta promedio diaria
  const ComposedTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div style={tooltipStyle as any}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p>Venta: <span style={{ color: "hsl(185, 100%, 50%)" }}>{formatCLP(data?.venta || 0)}</span></p>
        <p>Viajes: <span style={{ color: "hsl(270, 70%, 60%)" }}>{data?.viajes || 0}</span></p>
        <p>Venta Prom. Diaria: <span style={{ color: "hsl(40, 95%, 55%)" }}>{formatCLP(data?.ventaPromDiaria || 0)}</span></p>
      </div>
    );
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard title="Total Viajes" value={formatNumber(kpis.total)} icon={<Truck className="w-5 h-5" />} subtitle="Período seleccionado" />
            <KpiCard title="Venta Total" value={formatCLP(kpis.ventaTotal)} icon={<Banknote className="w-5 h-5" />} subtitle="Ingresos acumulados" />
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

          {/* Segmentación Prefactura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              title="Venta Prefacturada"
              value={formatCLP(prefacturaData.prefacturada)}
              icon={<FileCheck className="w-5 h-5" />}
              subtitle={`${prefacturaData.prefacturadaCount} viajes prefacturados`}
              trend="up"
              change={`${kpis.ventaTotal > 0 ? ((prefacturaData.prefacturada / kpis.ventaTotal) * 100).toFixed(1) : 0}% del total`}
            />
            <KpiCard
              title="Venta No Prefacturada"
              value={formatCLP(prefacturaData.noPrefactura)}
              icon={<FileX className="w-5 h-5" />}
              subtitle={`${prefacturaData.noPrefacturaCount} viajes sin prefactura`}
              trend="down"
              change={`${kpis.ventaTotal > 0 ? ((prefacturaData.noPrefactura / kpis.ventaTotal) * 100).toFixed(1) : 0}% del total`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Venta Total vs Cantidad de Viajes — vertical */}
            <div className="lg:col-span-2 card-executive p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Venta Total vs Cantidad de Viajes</h3>
              <p className="text-xs text-muted-foreground mb-4">Top 8 — Barras: venta · Línea: viajes</p>
              {ventaClienteChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={ventaClienteChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                    <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={10} angle={-25} textAnchor="end" height={60} />
                    <YAxis yAxisId="venta" orientation="left" stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => formatCLP(v)} />
                    <YAxis yAxisId="viajes" orientation="right" stroke="hsl(270, 70%, 60%)" fontSize={11} />
                    <Tooltip content={<ComposedTooltipContent />} />
                    <Bar yAxisId="venta" dataKey="venta" fill="hsl(185, 100%, 50%)" radius={[4, 4, 0, 0]} name="venta" barSize={28} />
                    <Line yAxisId="viajes" dataKey="viajes" stroke="hsl(270, 70%, 60%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(270, 70%, 60%)" }} name="viajes" />
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
                      <Tooltip content={<PieTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {estadoPie.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[10px] text-muted-foreground truncate">{item.name}: {item.value} ({item.pct}%)</span>
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
