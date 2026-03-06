import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useViajes } from "@/hooks/useViajes";
import KpiCard from "@/components/KpiCard";
import GlobalFiltersPanel from "@/components/GlobalFiltersPanel";
import { Truck, Clock, Route, DollarSign, Loader2, Banknote } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operaciones: <span className="text-primary">{clientName}</span></h1>
          <p className="text-sm text-muted-foreground">Panel de control operacional — filtrado por <span className="text-primary font-medium">cliente_estandar</span></p>
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

          {/* Estado de Viajes */}
          <div className="card-executive p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Estado de Viajes</h3>
            <p className="text-xs text-muted-foreground mb-4">Distribución (sin Planificado)</p>
            {estadoPie.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={220} className="max-w-xs">
                  <PieChart>
                    <Pie data={estadoPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {estadoPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2">
                  {estadoPie.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[10px] text-muted-foreground truncate">{item.name}: {item.value} ({item.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>}
          </div>

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
