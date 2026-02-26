import KpiCard from "@/components/KpiCard";
import TimeFilter from "@/components/TimeFilter";
import { Truck, DollarSign, Route, Users, AlertTriangle, TrendingUp, Package, Fuel } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

const revenueData = [
  { name: "Lun", real: 4200, teorico: 5000 },
  { name: "Mar", real: 5100, teorico: 5000 },
  { name: "Mié", real: 4800, teorico: 5000 },
  { name: "Jue", real: 5500, teorico: 5000 },
  { name: "Vie", real: 6200, teorico: 5000 },
  { name: "Sáb", real: 3100, teorico: 3500 },
];

const trendData = [
  { name: "Ene", value: 320 },
  { name: "Feb", value: 410 },
  { name: "Mar", value: 380 },
  { name: "Abr", value: 450 },
  { name: "May", value: 520 },
  { name: "Jun", value: 490 },
];

const fleetPie = [
  { name: "En ruta", value: 45, color: "hsl(185, 100%, 50%)" },
  { name: "Disponible", value: 12, color: "hsl(145, 65%, 45%)" },
  { name: "Mantención", value: 5, color: "hsl(40, 95%, 55%)" },
  { name: "Fuera servicio", value: 3, color: "hsl(0, 80%, 55%)" },
];

const DashboardHome = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard <span className="text-primary">General</span></h1>
          <p className="text-sm text-muted-foreground">Resumen operacional en tiempo real</p>
        </div>
        <TimeFilter onFilterChange={() => {}} />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Viajes Completados"
          value="1,247"
          change="+12.5%"
          trend="up"
          icon={<Truck className="w-5 h-5" />}
          subtitle="vs. mes anterior"
        />
        <KpiCard
          title="Facturación Bruta"
          value="$482M"
          change="+8.3%"
          trend="up"
          icon={<DollarSign className="w-5 h-5" />}
          subtitle="CLP acumulado"
        />
        <KpiCard
          title="Km Recorridos"
          value="89,420"
          change="-2.1%"
          trend="down"
          icon={<Route className="w-5 h-5" />}
          subtitle="Total mes actual"
        />
        <KpiCard
          title="Flota Activa"
          value="57/65"
          change="87.7%"
          trend="neutral"
          icon={<Package className="w-5 h-5" />}
          subtitle="Tasa de utilización"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card-executive p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Real vs Teórico</h3>
              <p className="text-xs text-muted-foreground">Comparativa de venta semanal</p>
            </div>
            <TimeFilter onFilterChange={() => {}} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
              <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 25%, 10%)",
                  border: "1px solid hsl(220, 20%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(200, 20%, 90%)",
                  fontSize: "12px"
                }}
              />
              <Bar dataKey="real" fill="hsl(185, 100%, 50%)" radius={[4, 4, 0, 0]} name="Real" />
              <Bar dataKey="teorico" fill="hsl(220, 90%, 55%)" radius={[4, 4, 0, 0]} opacity={0.4} name="Teórico" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet Pie */}
        <div className="card-executive p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Estado de Flota</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribución actual</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={fleetPie}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {fleetPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 25%, 10%)",
                  border: "1px solid hsl(220, 20%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(200, 20%, 90%)",
                  fontSize: "12px"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {fleetPie.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-[10px] text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Trend */}
        <div className="card-executive p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tendencia de Viajes</h3>
              <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
            </div>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 18%)" />
              <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 25%, 10%)",
                  border: "1px solid hsl(220, 20%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(200, 20%, 90%)",
                  fontSize: "12px"
                }}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(185, 100%, 50%)" fill="url(#cyanGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <div className="card-executive p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Alertas Activas</h3>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div className="space-y-3">
            {[
              { msg: "Tracto T-042 excede horas de servicio", level: "high", time: "Hace 2h" },
              { msg: "Rampla R-019 mantención programada", level: "medium", time: "Hace 5h" },
              { msg: "Conductor J. Pérez sin descanso reglamentario", level: "high", time: "Hace 8h" },
              { msg: "Walmart LOA: demora en carga", level: "low", time: "Hace 12h" },
            ].map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  alert.level === "high" ? "bg-destructive" :
                  alert.level === "medium" ? "bg-warning" : "bg-primary"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">{alert.msg}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
