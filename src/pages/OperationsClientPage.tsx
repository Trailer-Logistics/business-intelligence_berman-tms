import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useViajes } from "@/hooks/useViajes";
import KpiCard from "@/components/KpiCard";
import GlobalFiltersPanel from "@/components/GlobalFiltersPanel";
import { Truck, Clock, Route, DollarSign, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

const PIE_COLORS = ["hsl(185, 100%, 50%)", "hsl(145, 65%, 45%)", "hsl(40, 95%, 55%)", "hsl(220, 90%, 55%)", "hsl(0, 80%, 55%)"];

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
    if (total === 0) return { total: 0, otd: 0, km: 0, tarifa: 0 };
    let onTime = 0, eligible = 0, km = 0, tarifa = 0;
    for (const v of clientViajes) {
      km += v.km_recorridos || 0;
      tarifa += v.tarifa_venta || 0;
      if (v.ts_entrada_origen_gps && v.ts_entrada_origen_plan) {
        eligible++;
        if (v.ts_entrada_origen_gps <= v.ts_entrada_origen_plan) onTime++;
      }
    }
    return { total, otd: eligible > 0 ? Math.round((onTime / eligible) * 100) : 0, km: Math.round(km), tarifa: Math.round(tarifa) };
  }, [clientViajes]);

  const estadoPie = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of clientViajes) map[v.estado_viaje_estandar || "Sin estado"] = (map[v.estado_viaje_estandar || "Sin estado"] || 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [clientViajes]);

  const dailyChart = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of clientViajes) {
      if (v.fecha_salida_origen) {
        const d = typeof v.fecha_salida_origen === "string" ? v.fecha_salida_origen.slice(0, 10) : "";
        if (d) map[d] = (map[d] || 0) + 1;
      }
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-15)
      .map(([date, count]) => ({ name: date.slice(5), viajes: count }));
  }, [clientViajes]);

  const formatCLP = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operaciones: <span className="text-primary">{clientName}</span></h1>
        <p className="text-sm text-muted-foreground">Panel de control operacional</p>
      </div>

      <GlobalFiltersPanel />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Viajes" value={kpis.total.toLocaleString("es-CL")} icon={<Truck className="w-5 h-5" />} subtitle="Período" />
            <KpiCard title="OTD" value={`${kpis.otd}%`} trend={kpis.otd >= 80 ? "up" : "down"} change={kpis.otd >= 80 ? "Óptimo" : "Crítico"} icon={<Clock className="w-5 h-5" />} subtitle="Puntualidad" />
            <KpiCard title="Km" value={kpis.km.toLocaleString("es-CL")} icon={<Route className="w-5 h-5" />} subtitle="Recorridos" />
            <KpiCard title="Facturación" value={formatCLP(kpis.tarifa)} icon={<DollarSign className="w-5 h-5" />} subtitle="Total venta" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 card-executive p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Viajes Diarios</h3>
              {dailyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                    <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                    <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="viajes" fill="hsl(185, 100%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-muted-foreground text-center py-10 text-sm">Sin datos</p>}
            </div>
            <div className="card-executive p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Estado</h3>
              {estadoPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={estadoPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {estadoPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
                    {estadoPie.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[10px] text-muted-foreground">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-muted-foreground text-center py-10 text-sm">Sin datos</p>}
            </div>
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
