import { useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useViajes } from "@/hooks/useViajes";
import KpiCard from "@/components/KpiCard";
import GlobalFiltersPanel from "@/components/GlobalFiltersPanel";
import WaterfallTrendChart from "@/components/WaterfallTrendChart";
import { Truck, Clock, Route, DollarSign, Loader2, Banknote, TrendingUp, Download } from "lucide-react";
import * as XLSX from "xlsx";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

const SLUG_TO_CLIENT: Record<string, string> = {
  "walmart-loa": "Walmart LOA",
  "walmart-penon": "Walmart Peñon",
  "blue-express": "Blue Express",
  "ideal-sa": "Ideal S.a.",
  "smu": "SMU",
  "samex": "Samex",
  "cencosud": "Cencosud",
  "ccu": "CCU",
  "nestlé": "Nestlé",
  "nestle": "Nestlé",
  "soprole": "Soprole",
  "codelpa": "Codelpa",
  "otros-clientes": "Otros Clientes",
};

export default function OperationsClientPage() {
  const { slug } = useParams<{ slug: string }>();
  const { filteredViajes, isLoading } = useViajes();
  const clientName = SLUG_TO_CLIENT[slug || ""] || slug || "Cliente";

  const clientViajes = useMemo(() => {
    if (clientName === "Otros Clientes") {
      const known = new Set(Object.values(SLUG_TO_CLIENT));
      known.delete("Otros Clientes");
      return filteredViajes.filter((v) => !known.has(v.cliente_estandar));
    }
    return filteredViajes.filter((v) => v.cliente_estandar === clientName);
  }, [filteredViajes, clientName]);

  const kpis = useMemo(() => {
    const total = clientViajes.length;
    if (total === 0) return { total: 0, otd: 0, km: 0, tarifaPromedio: 0, ventaTotal: 0 };
    let onTime = 0, eligible = 0, km = 0, tarifa = 0;
    for (const v of clientViajes) {
      km += (v.km_recorridos && v.km_recorridos > 0) ? v.km_recorridos : 0;
      tarifa += v.tarifa_venta || 0;
      if (v.ts_entrada_origen_gps && v.ts_entrada_origen_plan) {
        eligible++;
        if (v.ts_entrada_origen_gps <= v.ts_entrada_origen_plan) onTime++;
      }
    }
    return {
      total,
      otd: eligible > 0 ? Math.round((onTime / eligible) * 100) : 0,
      km: Math.round(km),
      tarifaPromedio: total > 0 ? Math.round(tarifa / total) : 0,
      ventaTotal: Math.round(tarifa),
    };
  }, [clientViajes]);

  // Prefactura segmentation
  const { prefacturaData, viajesPrefacturados, viajesNoPrefacturados } = useMemo(() => {
    let prefacturada = 0, noPrefactura = 0, prefacturadaCount = 0, noPrefacturaCount = 0;
    const prefSi: typeof clientViajes = [];
    const prefNo: typeof clientViajes = [];
    for (const v of clientViajes) {
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
  }, [clientViajes]);

  const downloadExcel = useCallback((rows: typeof clientViajes, filename: string) => {
    const data = rows.map((v) => ({
      viaje_id: v.viaje_id,
      nro_viaje: v.nro_viaje,
      cliente_rut: v.cliente_rut || "",
      estado_viaje_estandar: v.estado_viaje_estandar,
      tarifa_venta: v.tarifa_venta,
      estado_pod_detalle: v.estado_pod_detalle,
      estado_prefactura: v.estado_prefactura,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detalle");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }, []);

  // Unique days for daily average
  const uniqueDays = useMemo(() => {
    const days = new Set<string>();
    for (const v of clientViajes) {
      if (v.fecha_salida_origen) {
        const day = typeof v.fecha_salida_origen === "string" ? v.fecha_salida_origen.slice(0, 10) : "";
        if (day) days.add(day);
      }
    }
    return Math.max(days.size, 1);
  }, [clientViajes]);

  // Daily venta + viajes chart (by route or by day)
  const dailyChart = useMemo(() => {
    const map: Record<string, { venta: number; viajes: number }> = {};
    for (const v of clientViajes) {
      if (v.fecha_salida_origen) {
        const d = typeof v.fecha_salida_origen === "string" ? v.fecha_salida_origen.slice(0, 10) : "";
        if (d) {
          if (!map[d]) map[d] = { venta: 0, viajes: 0 };
          map[d].venta += v.tarifa_venta || 0;
          map[d].viajes += 1;
        }
      }
    }
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-15)
      .map(([date, d]) => ({
        name: date.slice(5),
        venta: Math.round(d.venta),
        viajes: d.viajes,
        ventaPromDiaria: Math.round(d.venta / uniqueDays),
      }));
  }, [clientViajes, uniqueDays]);

  const estadoPie = useMemo(() => {
    const map: Record<string, number> = {};
    let totalCount = 0;
    for (const v of clientViajes) {
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
  }, [clientViajes]);

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

  const ComposedTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div style={tooltipStyle as any}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p>Venta: <span style={{ color: "hsl(185, 100%, 50%)" }}>{formatCLP(data?.venta || 0)}</span></p>
        <p>Viajes: <span style={{ color: "hsl(270, 70%, 60%)" }}>{data?.viajes || 0}</span></p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operaciones: <span className="text-primary">{clientName}</span></h1>
          <p className="text-sm text-muted-foreground">Panel de control operacional</p>
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
          {/* 5 KPIs */}
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

          {/* Prefactura segmentation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-executive p-5 hover:glow-cyan transition-all duration-300 group relative">
              <div className="flex items-start justify-between mb-3">
                <button
                  onClick={() => downloadExcel(viajesPrefacturados, `prefacturados_${slug}`)}
                  className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors cursor-pointer hover:scale-110"
                  title="Descargar detalle prefacturados"
                >
                  <Download className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1 text-xs font-medium text-success">
                  <TrendingUp className="w-3 h-3" />
                  {kpis.ventaTotal > 0 ? ((prefacturaData.prefacturada / kpis.ventaTotal) * 100).toFixed(1) : 0}% del total
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{formatCLP(prefacturaData.prefacturada)}</p>
              <p className="text-xs text-muted-foreground mt-1">Venta Prefacturada</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{prefacturaData.prefacturadaCount} viajes prefacturados</p>
            </div>
            <div className="card-executive p-5 hover:glow-cyan transition-all duration-300 group relative">
              <div className="flex items-start justify-between mb-3">
                <button
                  onClick={() => downloadExcel(viajesNoPrefacturados, `no_prefacturados_${slug}`)}
                  className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors cursor-pointer hover:scale-110"
                  title="Descargar detalle no prefacturados"
                >
                  <Download className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <TrendingUp className="w-3 h-3" />
                  {kpis.ventaTotal > 0 ? ((prefacturaData.noPrefactura / kpis.ventaTotal) * 100).toFixed(1) : 0}% del total
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{formatCLP(prefacturaData.noPrefactura)}</p>
              <p className="text-xs text-muted-foreground mt-1">Venta No Prefacturada</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{prefacturaData.noPrefacturaCount} viajes sin prefactura</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card-executive p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Venta Diaria vs Viajes</h3>
              <p className="text-xs text-muted-foreground mb-4">Últimos 15 días — Barras: venta · Línea: viajes</p>
              {dailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                    <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={10} angle={-25} textAnchor="end" height={50} />
                    <YAxis yAxisId="venta" orientation="left" stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => formatCLP(v)} />
                    <YAxis yAxisId="viajes" orientation="right" stroke="hsl(270, 70%, 60%)" fontSize={11} />
                    <Tooltip content={<ComposedTooltipContent />} />
                    <Bar yAxisId="venta" dataKey="venta" fill="hsl(185, 100%, 50%)" radius={[4, 4, 0, 0]} barSize={24} />
                    <Line yAxisId="viajes" dataKey="viajes" stroke="hsl(270, 70%, 60%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(270, 70%, 60%)" }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>}
            </div>

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

          {/* Waterfall Trend */}
          <WaterfallTrendChart viajes={clientViajes} />

          {/* Recent trips table */}
          <div className="card-executive p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Últimos Viajes</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nro Viaje</TableHead>
                    <TableHead className="text-xs">Guía</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs">Tracto</TableHead>
                    <TableHead className="text-xs">Conductor</TableHead>
                    <TableHead className="text-xs">Km</TableHead>
                    <TableHead className="text-xs">Tarifa</TableHead>
                    <TableHead className="text-xs">POD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientViajes.slice(0, 20).map((v) => (
                    <TableRow key={v.viaje_id}>
                      <TableCell className="text-xs font-mono">{v.nro_viaje}</TableCell>
                      <TableCell className="text-xs">{v.nro_guia || "—"}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${v.terminado === "Sí" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
                          {v.estado_viaje_estandar}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{v.patente_tracto}</TableCell>
                      <TableCell className="text-xs">{v.conductor_principal || "—"}</TableCell>
                      <TableCell className="text-xs">{v.km_recorridos}</TableCell>
                      <TableCell className="text-xs">${(v.tarifa_venta || 0).toLocaleString("es-CL")}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${v.estado_pod_detalle === "Validado" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                          {v.estado_pod_detalle}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
