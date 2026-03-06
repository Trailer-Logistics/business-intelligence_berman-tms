import { useMemo, useCallback } from "react";
import { useViajes } from "@/hooks/useViajes";
import KpiCard from "@/components/KpiCard";
import GlobalFiltersPanel from "@/components/GlobalFiltersPanel";
import { Truck, DollarSign, Route, Clock, TrendingUp, Loader2, Banknote, Download, BarChart3, PieChart as PieIcon, Activity } from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area
} from "recharts";
import WaterfallTrendChart from "@/components/WaterfallTrendChart";

const CHART_COLORS = [
  "hsl(191, 100%, 50%)",
  "hsl(152, 69%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(258, 90%, 66%)",
  "hsl(217, 91%, 60%)",
  "hsl(340, 82%, 52%)",
];

const tooltipStyle: React.CSSProperties = {
  background: "hsl(222, 40%, 8%)",
  border: "1px solid hsl(222, 25%, 18%)",
  borderRadius: "12px",
  color: "hsl(210, 20%, 93%)",
  fontSize: "12px",
  padding: "10px 14px",
  boxShadow: "0 8px 32px hsl(222, 47%, 6%, 0.5)",
};

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

  const { prefacturaData, viajesPrefacturados, viajesNoPrefacturados } = useMemo(() => {
    let prefacturada = 0, noPrefactura = 0, prefacturadaCount = 0, noPrefacturaCount = 0;
    const prefSi: typeof filteredViajes = [];
    const prefNo: typeof filteredViajes = [];
    for (const v of filteredViajes) {
      const estado = v.estado_prefactura || "No Prefactura";
      if (estado === "No Prefactura") {
        noPrefactura += v.tarifa_venta || 0;
        noPrefacturaCount++;
        prefNo.push(v);
      } else {
        prefacturada += v.tarifa_venta || 0;
        prefacturadaCount++;
        prefSi.push(v);
      }
    }
    return {
      prefacturaData: {
        prefacturada: Math.round(prefacturada),
        noPrefactura: Math.round(noPrefactura),
        prefacturadaCount,
        noPrefacturaCount,
      },
      viajesPrefacturados: prefSi,
      viajesNoPrefacturados: prefNo,
    };
  }, [filteredViajes]);

  const downloadExcel = useCallback((rows: typeof filteredViajes, filename: string) => {
    const data = rows.map((v) => ({
      viaje_id: v.viaje_id,
      cliente_rut: v.cliente_rut || "",
      estado_viaje_estandar: v.estado_viaje_estandar,
      tarifa_venta: v.tarifa_venta,
      estado_pod_detalle: v.estado_pod_detalle,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detalle");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }, []);

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
        name: name.length > 12 ? name.slice(0, 12) + "..." : name,
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

  const formatNumber = (n: number) => n.toLocaleString("es-CL");
  const formatCLP = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  const PieTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
      <div style={tooltipStyle}>
        <p className="font-semibold text-white mb-1">{item.name}</p>
        <p className="text-white/80">
          {item.value} viajes —{" "}
          <span style={{ color: item.payload.fill || "hsl(191, 100%, 50%)" }}>
            {item.payload.pct}%
          </span>
        </p>
      </div>
    );
  };

  const ComposedTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div style={tooltipStyle}>
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(191,100%,50%)]" />
            Venta: <span className="font-mono font-semibold text-[hsl(191,100%,50%)]">{formatCLP(data?.venta || 0)}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(258,90%,66%)]" />
            Viajes: <span className="font-mono font-semibold text-[hsl(258,90%,66%)]">{data?.viajes || 0}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(38,92%,50%)]" />
            Prom. Diario: <span className="font-mono font-semibold text-[hsl(38,92%,50%)]">{formatCLP(data?.ventaPromDiaria || 0)}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-[hsl(191,100%,50%)]" />
            <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[0.15em]">
              Real-time Overview
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Dashboard <span className="text-[hsl(191,100%,50%)]">General</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumen operacional en tiempo real
          </p>
        </div>
      </motion.div>

      <GlobalFiltersPanel />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-[hsl(191,100%,50%,0.2)] border-t-[hsl(191,100%,50%)] animate-spin" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-[hsl(258,90%,66%,0.3)] animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <span className="text-sm text-muted-foreground">Cargando datos...</span>
        </div>
      ) : (
        <>
          {/* KPIs Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard
              title="Total Viajes"
              value={formatNumber(kpis.total)}
              icon={<Truck className="w-5 h-5" strokeWidth={1.8} />}
              subtitle="Periodo seleccionado"
              accentColor="191 100% 50%"
              index={0}
            />
            <KpiCard
              title="Venta Total"
              value={formatCLP(kpis.ventaTotal)}
              icon={<Banknote className="w-5 h-5" strokeWidth={1.8} />}
              subtitle="Ingresos acumulados"
              accentColor="152 69% 45%"
              index={1}
            />
            <KpiCard
              title="Puntualidad (OTD)"
              value={`${kpis.otd}%`}
              trend={kpis.otd >= 80 ? "up" : kpis.otd >= 60 ? "neutral" : "down"}
              change={kpis.otd >= 80 ? "Optimo" : kpis.otd >= 60 ? "Aceptable" : "Critico"}
              icon={<Clock className="w-5 h-5" strokeWidth={1.8} />}
              subtitle="GPS <= Planificado en origen"
              accentColor="38 92% 50%"
              index={2}
            />
            <KpiCard
              title="Km Recorridos"
              value={formatNumber(kpis.km)}
              icon={<Route className="w-5 h-5" strokeWidth={1.8} />}
              subtitle="Total acumulado"
              accentColor="217 91% 60%"
              index={3}
            />
            <KpiCard
              title="Tarifa Promedio"
              value={formatCLP(kpis.tarifaPromedio)}
              icon={<DollarSign className="w-5 h-5" strokeWidth={1.8} />}
              subtitle="Venta por viaje"
              accentColor="258 90% 66%"
              index={4}
            />
          </div>

          {/* Prefactura Segmentation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative overflow-hidden rounded-xl border border-[hsl(222,25%,15%)] hover:border-[hsl(152,69%,45%,0.3)] transition-all duration-500 group"
              style={{ background: "linear-gradient(145deg, hsl(222 40% 9%), hsl(222 40% 10.5%))" }}
            >
              {/* Accent */}
              <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b from-[hsl(152,69%,45%)] to-[hsl(191,100%,50%)]" />

              <div className="p-5 pl-6">
                <div className="flex items-start justify-between mb-4">
                  <button
                    onClick={() => downloadExcel(viajesPrefacturados, "viajes_prefacturados")}
                    className="p-2.5 rounded-xl bg-[hsl(152,69%,45%,0.1)] text-[hsl(152,69%,45%)] hover:bg-[hsl(152,69%,45%,0.15)] transition-all duration-300 hover:scale-105"
                    title="Descargar detalle prefacturados"
                  >
                    <Download className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[hsl(152,69%,45%)] bg-[hsl(152,69%,45%,0.1)] px-2.5 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" />
                    {kpis.ventaTotal > 0 ? ((prefacturaData.prefacturada / kpis.ventaTotal) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <p className="text-[28px] font-bold text-foreground tracking-tight number-display leading-none">
                  {formatCLP(prefacturaData.prefacturada)}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-2">Venta Prefacturada</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">{prefacturaData.prefacturadaCount} viajes</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.36 }}
              className="relative overflow-hidden rounded-xl border border-[hsl(222,25%,15%)] hover:border-[hsl(38,92%,50%,0.3)] transition-all duration-500 group"
              style={{ background: "linear-gradient(145deg, hsl(222 40% 9%), hsl(222 40% 10.5%))" }}
            >
              <div className="absolute top-0 left-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b from-[hsl(38,92%,50%)] to-[hsl(340,82%,52%)]" />

              <div className="p-5 pl-6">
                <div className="flex items-start justify-between mb-4">
                  <button
                    onClick={() => downloadExcel(viajesNoPrefacturados, "viajes_no_prefacturados")}
                    className="p-2.5 rounded-xl bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,50%,0.15)] transition-all duration-300 hover:scale-105"
                    title="Descargar detalle no prefacturados"
                  >
                    <Download className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[hsl(38,92%,50%)] bg-[hsl(38,92%,50%,0.1)] px-2.5 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" />
                    {kpis.ventaTotal > 0 ? ((prefacturaData.noPrefactura / kpis.ventaTotal) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <p className="text-[28px] font-bold text-foreground tracking-tight number-display leading-none">
                  {formatCLP(prefacturaData.noPrefactura)}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-2">Venta No Prefacturada</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">{prefacturaData.noPrefacturaCount} viajes</p>
              </div>
            </motion.div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Venta vs Viajes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 rounded-xl border border-[hsl(222,25%,15%)] p-5"
              style={{ background: "linear-gradient(145deg, hsl(222 40% 9%), hsl(222 40% 10.5%))" }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-[hsl(191,100%,50%)]" strokeWidth={1.8} />
                    <h3 className="text-sm font-semibold text-foreground">Venta vs Viajes por Cliente</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Top 8 clientes — Barras: venta · Linea: viajes</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[hsl(191,100%,50%)]" />
                    Venta
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[hsl(258,90%,66%)]" />
                    Viajes
                  </div>
                </div>
              </div>
              {ventaClienteChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={ventaClienteChart} barGap={0}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(191, 100%, 50%)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(191, 100%, 50%)" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 25%, 14%)" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(215, 15%, 40%)" fontSize={10} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} />
                    <YAxis yAxisId="venta" orientation="left" stroke="hsl(215, 15%, 35%)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatCLP(v)} />
                    <YAxis yAxisId="viajes" orientation="right" stroke="hsl(258, 90%, 66%, 0.5)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<ComposedTooltipContent />} />
                    <Bar yAxisId="venta" dataKey="venta" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={24} />
                    <Line yAxisId="viajes" dataKey="viajes" stroke="hsl(258, 90%, 66%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(258, 90%, 66%)", strokeWidth: 0 }} activeDot={{ r: 6, fill: "hsl(258, 90%, 66%)", stroke: "hsl(258, 90%, 66%, 0.3)", strokeWidth: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Sin datos</div>
              )}
            </motion.div>

            {/* Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-xl border border-[hsl(222,25%,15%)] p-5"
              style={{ background: "linear-gradient(145deg, hsl(222 40% 9%), hsl(222 40% 10.5%))" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <PieIcon className="w-4 h-4 text-[hsl(258,90%,66%)]" strokeWidth={1.8} />
                <h3 className="text-sm font-semibold text-foreground">Estado de Viajes</h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">Distribucion (sin Planificado)</p>

              {estadoPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={estadoPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {estadoPie.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
                    {estadoPie.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2 group">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length], boxShadow: `0 0 6px ${CHART_COLORS[i % CHART_COLORS.length]}40` }}
                        />
                        <span className="text-[10px] text-muted-foreground truncate">
                          {item.name}: <span className="font-mono text-foreground/80">{item.pct}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Sin datos</div>
              )}
            </motion.div>
          </div>

          {/* Waterfall */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <WaterfallTrendChart viajes={filteredViajes} />
          </motion.div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;
