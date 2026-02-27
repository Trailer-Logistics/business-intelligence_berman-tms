import { useMemo, useState } from "react";
import KpiCard from "@/components/KpiCard";
import TimeFilter from "@/components/TimeFilter";
import { useExternalData } from "@/hooks/useExternalData";
import { Truck, DollarSign, Route, Clock, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

interface Viaje {
  viaje_id: number;
  nro_viaje: string;
  cliente_estandar: string;
  estado_viaje_estandar: string;
  terminado: string;
  km_recorridos: number;
  tarifa_venta: number;
  tarifa_costo: number;
  ts_entrada_origen_plan: string | null;
  ts_entrada_origen_gps: string | null;
  fecha_creacion_viaje: string | null;
  tipo_operacion: string;
  unidad_negocio: string;
}

const tooltipStyle = {
  background: "hsl(220, 25%, 10%)",
  border: "1px solid hsl(220, 20%, 18%)",
  borderRadius: "8px",
  color: "hsl(200, 20%, 90%)",
  fontSize: "12px",
};

const PIE_COLORS = [
  "hsl(185, 100%, 50%)",
  "hsl(145, 65%, 45%)",
  "hsl(40, 95%, 55%)",
  "hsl(220, 90%, 55%)",
  "hsl(270, 70%, 60%)",
  "hsl(0, 80%, 55%)",
];

function getDateRange(filter: string) {
  const now = new Date();
  if (filter === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString();
  }
  if (filter === "mes") {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  // año
  return new Date(now.getFullYear(), 0, 1).toISOString();
}

const DashboardHome = () => {
  const [timeFilter, setTimeFilter] = useState("mes");

  const { data: viajes, isLoading } = useExternalData<Viaje>({
    view: "v_viajes_inteligentes",
    limit: 5000,
  });

  // Filter by date range on the client
  const filteredViajes = useMemo(() => {
    if (!viajes) return [];
    const cutoff = getDateRange(timeFilter);
    return viajes.filter(v => v.fecha_creacion_viaje && v.fecha_creacion_viaje >= cutoff);
  }, [viajes, timeFilter]);

  // === KPI calculations ===
  const kpis = useMemo(() => {
    const total = filteredViajes.length;
    if (total === 0) return { total: 0, otd: 0, km: 0, tarifaPromedio: 0 };

    // OTD: puntual si ts_entrada_origen_gps <= ts_entrada_origen_plan
    let onTime = 0;
    let otdEligible = 0;
    let totalKm = 0;
    let totalTarifa = 0;

    for (const v of filteredViajes) {
      totalKm += v.km_recorridos || 0;
      totalTarifa += v.tarifa_venta || 0;

      if (v.ts_entrada_origen_gps && v.ts_entrada_origen_plan) {
        otdEligible++;
        if (v.ts_entrada_origen_gps <= v.ts_entrada_origen_plan) {
          onTime++;
        }
      }
    }

    return {
      total,
      otd: otdEligible > 0 ? Math.round((onTime / otdEligible) * 100) : 0,
      km: Math.round(totalKm),
      tarifaPromedio: total > 0 ? Math.round(totalTarifa / total) : 0,
    };
  }, [filteredViajes]);

  // === Chart: viajes por cliente (top 8) ===
  const clienteChart = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of filteredViajes) {
      const c = v.cliente_estandar || "Otros";
      map[c] = (map[c] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, viajes]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, viajes }));
  }, [filteredViajes]);

  // === Chart: estado viaje pie ===
  const estadoPie = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of filteredViajes) {
      const e = v.estado_viaje_estandar || "Sin estado";
      map[e] = (map[e] || 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [filteredViajes]);

  // === Chart: tendencia diaria ===
  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of filteredViajes) {
      if (v.fecha_creacion_viaje) {
        const day = v.fecha_creacion_viaje.slice(0, 10);
        map[day] = (map[day] || 0) + 1;
      }
    }
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30) // last 30 days max
      .map(([date, count]) => ({
        name: date.slice(5), // MM-DD
        viajes: count,
      }));
  }, [filteredViajes]);

  const formatNumber = (n: number) => n.toLocaleString("es-CL");
  const formatCLP = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard <span className="text-primary">General</span>
          </h1>
          <p className="text-sm text-muted-foreground">Resumen operacional en tiempo real</p>
        </div>
        <TimeFilter onFilterChange={setTimeFilter} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground text-sm">Cargando datos…</span>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Viajes"
              value={formatNumber(kpis.total)}
              icon={<Truck className="w-5 h-5" />}
              subtitle={`Período: ${timeFilter === "7d" ? "últimos 7 días" : timeFilter === "mes" ? "mes actual" : "año actual"}`}
            />
            <KpiCard
              title="Puntualidad (OTD)"
              value={`${kpis.otd}%`}
              trend={kpis.otd >= 80 ? "up" : kpis.otd >= 60 ? "neutral" : "down"}
              change={kpis.otd >= 80 ? "Óptimo" : kpis.otd >= 60 ? "Aceptable" : "Crítico"}
              icon={<Clock className="w-5 h-5" />}
              subtitle="GPS ≤ Planificado en origen"
            />
            <KpiCard
              title="Km Recorridos"
              value={formatNumber(kpis.km)}
              icon={<Route className="w-5 h-5" />}
              subtitle="Total acumulado"
            />
            <KpiCard
              title="Tarifa Promedio"
              value={formatCLP(kpis.tarifaPromedio)}
              icon={<DollarSign className="w-5 h-5" />}
              subtitle="Venta por viaje"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Viajes por cliente */}
            <div className="lg:col-span-2 card-executive p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Viajes por Cliente</h3>
                <p className="text-xs text-muted-foreground">Top 8 clientes por volumen</p>
              </div>
              {clienteChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={clienteChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                    <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(215, 15%, 55%)" fontSize={11} width={120} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="viajes" fill="hsl(185, 100%, 50%)" radius={[0, 4, 4, 0]} name="Viajes" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>
              )}
            </div>

            {/* Estado Pie */}
            <div className="card-executive p-5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Estado de Viajes</h3>
              <p className="text-xs text-muted-foreground mb-4">Distribución actual</p>
              {estadoPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={estadoPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {estadoPie.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {estadoPie.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-[10px] text-muted-foreground truncate">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>
              )}
            </div>
          </div>

          {/* Trend */}
          <div className="grid grid-cols-1 gap-4">
            <div className="card-executive p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Tendencia de Viajes</h3>
                  <p className="text-xs text-muted-foreground">Volumen diario</p>
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
                    <Area
                      type="monotone"
                      dataKey="viajes"
                      stroke="hsl(185, 100%, 50%)"
                      fill="url(#cyanGrad)"
                      strokeWidth={2}
                      name="Viajes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Sin datos en el período</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;
