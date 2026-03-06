import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useViajes } from "@/hooks/useViajes";
import KpiCard from "@/components/KpiCard";
import GlobalFiltersPanel from "@/components/GlobalFiltersPanel";
import { Truck, Clock, Route, DollarSign, Banknote, Factory, PieChart as PieIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CHART_COLORS = [
  "hsl(191, 100%, 50%)", "hsl(152, 69%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(217, 91%, 60%)", "hsl(258, 90%, 66%)", "hsl(340, 82%, 52%)",
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

const SLUG_TO_CLIENT: Record<string, string> = {
  "walmart-loa": "Walmart LOA",
  "walmart-penon": "Walmart Penon",
  "blue-express": "Blue Express",
  "ideal-sa": "Ideal S.a.",
  "smu": "SMU",
  "samex": "Samex",
  "cencosud": "Cencosud",
  "ccu": "CCU",
  "nestle": "Nestle",
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
      <div style={tooltipStyle}>
        <p className="font-semibold text-white mb-1">{item.name}</p>
        <p className="text-white/80">
          {item.value} viajes — <span style={{ color: item.payload.fill || "hsl(191, 100%, 50%)" }}>{item.payload.pct}%</span>
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Factory className="w-4 h-4 text-[hsl(191,100%,50%)]" strokeWidth={1.8} />
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[0.15em]">Operations</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {clientName === "Otros Clientes" ? "Otros " : ""}
          <span className="text-[hsl(191,100%,50%)]">{clientName === "Otros Clientes" ? "Clientes" : clientName}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Panel de control operacional</p>
      </motion.div>

      <GlobalFiltersPanel />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[hsl(191,100%,50%,0.2)] border-t-[hsl(191,100%,50%)] animate-spin" />
          <span className="text-sm text-muted-foreground">Cargando datos...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard title="Total Viajes" value={formatNumber(kpis.total)} icon={<Truck className="w-5 h-5" strokeWidth={1.8} />} subtitle="Periodo seleccionado" accentColor="191 100% 50%" index={0} />
            <KpiCard title="Venta Total" value={formatCLP(kpis.ventaTotal)} icon={<Banknote className="w-5 h-5" strokeWidth={1.8} />} subtitle="Ingresos acumulados" accentColor="152 69% 45%" index={1} />
            <KpiCard title="OTD" value={`${kpis.otd}%`} trend={kpis.otd >= 80 ? "up" : kpis.otd >= 60 ? "neutral" : "down"} change={kpis.otd >= 80 ? "Optimo" : kpis.otd >= 60 ? "Aceptable" : "Critico"} icon={<Clock className="w-5 h-5" strokeWidth={1.8} />} subtitle="Puntualidad" accentColor="38 92% 50%" index={2} />
            <KpiCard title="Km Recorridos" value={formatNumber(kpis.km)} icon={<Route className="w-5 h-5" strokeWidth={1.8} />} subtitle="Total acumulado" accentColor="217 91% 60%" index={3} />
            <KpiCard title="Tarifa Promedio" value={formatCLP(kpis.tarifaPromedio)} icon={<DollarSign className="w-5 h-5" strokeWidth={1.8} />} subtitle="Venta por viaje" accentColor="258 90% 66%" index={4} />
          </div>

          {/* Estado + Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-[hsl(222,25%,15%)] p-5"
              style={{ background: "linear-gradient(145deg, hsl(222 40% 9%), hsl(222 40% 10.5%))" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <PieIcon className="w-4 h-4 text-[hsl(258,90%,66%)]" strokeWidth={1.8} />
                <h3 className="text-sm font-semibold text-foreground">Estado de Viajes</h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">Sin Planificado</p>
              {estadoPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={estadoPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                        {estadoPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {estadoPie.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length], boxShadow: `0 0 6px ${CHART_COLORS[i % CHART_COLORS.length]}40` }} />
                        <span className="text-[10px] text-muted-foreground truncate">{item.name}: <span className="font-mono text-foreground/80">{item.pct}%</span></span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Sin datos</div>}
            </motion.div>

            {/* Trips table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="lg:col-span-2 rounded-xl border border-[hsl(222,25%,15%)] p-5"
              style={{ background: "linear-gradient(145deg, hsl(222 40% 9%), hsl(222 40% 10.5%))" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Ultimos Viajes</h3>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{clientViajes.length} total</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[hsl(222,25%,13%)]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[hsl(222,25%,13%)] hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Viaje</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Estado</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Tracto</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Conductor</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Km</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Tarifa</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">POD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientViajes.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Sin viajes</TableCell></TableRow>
                    ) : clientViajes.slice(0, 20).map((v) => (
                      <TableRow key={v.viaje_id} className="border-b border-[hsl(222,25%,11%)] hover:bg-[hsl(222,30%,11%)] transition-colors">
                        <TableCell className="text-xs font-mono text-[hsl(191,100%,50%)]">{v.nro_viaje}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-lg font-medium ${
                            v.terminado === "Si"
                              ? "bg-[hsl(152,69%,45%,0.1)] text-[hsl(152,69%,45%)]"
                              : "bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)]"
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${v.terminado === "Si" ? "bg-[hsl(152,69%,45%)]" : "bg-[hsl(38,92%,50%)]"}`} />
                            {v.estado_viaje_estandar}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{v.patente_tracto}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{v.conductor_principal || "—"}</TableCell>
                        <TableCell className="text-xs font-mono">{v.km_recorridos}</TableCell>
                        <TableCell className="text-xs font-mono">${(v.tarifa_venta || 0).toLocaleString("es-CL")}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg ${
                            v.estado_pod_detalle === "Validado"
                              ? "bg-[hsl(152,69%,45%,0.1)] text-[hsl(152,69%,45%)]"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {v.estado_pod_detalle}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
