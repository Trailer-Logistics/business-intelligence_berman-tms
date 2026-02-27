import { useMemo } from "react";
import { useViajes } from "@/hooks/useViajes";
import GlobalFiltersPanel from "@/components/GlobalFiltersPanel";
import ForecastHeatmap from "@/components/ForecastHeatmap";
import KpiCard from "@/components/KpiCard";
import { Brain, TrendingUp, DollarSign, BarChart3, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const tooltipStyle = {
  background: "hsl(220, 25%, 10%)",
  border: "1px solid hsl(220, 20%, 18%)",
  borderRadius: "8px",
  color: "hsl(200, 20%, 90%)",
  fontSize: "12px",
};

export default function ForecastingPage() {
  const { filteredViajes, isLoading, uniqueValues } = useViajes();

  // Real vs Teórico by client
  const clientData = useMemo(() => {
    // Real: sum tarifa_venta excluding anulados/programados
    const realMap: Record<string, number> = {};
    for (const v of filteredViajes) {
      const estado = v.estado_viaje_estandar?.toLowerCase() || "";
      if (estado.includes("anulado") || estado.includes("programado")) continue;
      const c = v.cliente_estandar || "Otros";
      realMap[c] = (realMap[c] || 0) + (v.tarifa_venta || 0);
    }

    return Object.entries(realMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, real]) => ({
        name: name.length > 16 ? name.slice(0, 16) + "…" : name,
        real: Math.round(real),
      }));
  }, [filteredViajes]);

  // Daily breakdown for stacked chart
  const dailyData = useMemo(() => {
    const map: Record<string, { real: number; count: number }> = {};
    for (const v of filteredViajes) {
      const estado = v.estado_viaje_estandar?.toLowerCase() || "";
      if (estado.includes("anulado") || estado.includes("programado")) continue;
      if (v.fecha_salida_origen) {
        const d = typeof v.fecha_salida_origen === "string" ? v.fecha_salida_origen.slice(0, 10) : "";
        if (d) {
          if (!map[d]) map[d] = { real: 0, count: 0 };
          map[d].real += v.tarifa_venta || 0;
          map[d].count++;
        }
      }
    }
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, { real, count }]) => ({
        name: date.slice(5),
        real: Math.round(real),
        viajes: count,
      }));
  }, [filteredViajes]);

  const totalReal = useMemo(() => {
    let total = 0;
    for (const v of filteredViajes) {
      const estado = v.estado_viaje_estandar?.toLowerCase() || "";
      if (estado.includes("anulado") || estado.includes("programado")) continue;
      total += v.tarifa_venta || 0;
    }
    return total;
  }, [filteredViajes]);

  const formatCLP = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inteligencia <span className="text-primary">Predictiva</span></h1>
        <p className="text-sm text-muted-foreground">Forecasting de Demanda — Real vs Teórico</p>
      </div>

      <GlobalFiltersPanel />

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Venta Real Total" value={formatCLP(totalReal)} icon={<DollarSign className="w-5 h-5" />} subtitle="Excluyendo anulados" />
            <KpiCard title="Clientes Activos" value={uniqueValues.clientes.length.toString()} icon={<BarChart3 className="w-5 h-5" />} subtitle="Con viajes en período" />
            <KpiCard title="Viajes Facturables" value={filteredViajes.filter(v => { const e = v.estado_viaje_estandar?.toLowerCase() || ""; return !e.includes("anulado") && !e.includes("programado"); }).length.toString()} icon={<TrendingUp className="w-5 h-5" />} subtitle="Período seleccionado" />
            <KpiCard title="Promedio Diario" value={formatCLP(dailyData.length > 0 ? Math.round(totalReal / dailyData.length) : 0)} icon={<Brain className="w-5 h-5" />} subtitle="Venta real / día" />
          </div>

          {/* Venta Real por Cliente */}
          <div className="card-executive p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Venta Real por Cliente</h3>
            <p className="text-xs text-muted-foreground mb-4">Top 10 clientes por facturación</p>
            {clientData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clientData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                  <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => formatCLP(v)} />
                  <YAxis dataKey="name" type="category" stroke="hsl(215, 15%, 55%)" fontSize={11} width={130} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString("es-CL")}`, "Venta Real"]} />
                  <Bar dataKey="real" fill="hsl(220, 90%, 55%)" radius={[0, 4, 4, 0]} name="Real" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-10 text-sm">Sin datos</p>}
          </div>

          {/* Venta Diaria */}
          <div className="card-executive p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Venta Diaria</h3>
            <p className="text-xs text-muted-foreground mb-4">Tarifa real acumulada por día (fecha salida origen)</p>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215, 15%, 55%)" fontSize={11} tickFormatter={(v) => formatCLP(v)} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [name === "real" ? `$${v.toLocaleString("es-CL")}` : v, name === "real" ? "Venta" : "Viajes"]} />
                  <Legend />
                  <Bar dataKey="real" fill="hsl(220, 90%, 55%)" radius={[4, 4, 0, 0]} name="Venta Real" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-10 text-sm">Sin datos</p>}
          </div>

          <ForecastHeatmap />

          <div className="card-executive p-4 border-l-4 border-l-primary">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Nota:</strong> El modelo Real vs Teórico completo se activa al registrar datos en el módulo <em>Forecast Contractual</em> (Planilla de Registro → Forecast Contractual).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
