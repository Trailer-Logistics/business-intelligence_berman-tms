import { useMemo, useState } from "react";
import { useExternalData } from "@/hooks/useExternalData";
import KpiCard from "@/components/KpiCard";
import { Car, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface AlertaFlota {
  vehiculo_id: number;
  patente: string;
  tipo_vehiculo: string;
  vehiculo_estado: number;
  documento: string;
  fecha_vencimiento: string;
  semaforo: string;
  estado_semaforo: string;
}

const SEMAFORO_COLORS: Record<string, string> = {
  "VENCIDO": "bg-destructive/20 text-destructive",
  "CRÍTICO (< 60 DÍAS)": "bg-warning/20 text-warning",
  "[60 - 90 DÍAS]": "bg-electric-blue/20 text-electric-blue",
  "OPTIMO (> 90 DÍAS)": "bg-success/20 text-success",
  "SIN DATO": "bg-muted text-muted-foreground",
  "DOCUMENTO NO CARGADO": "bg-muted text-muted-foreground",
  "AL DÍA": "bg-success/20 text-success",
};

export default function FleetAlertsPage() {
  const [filterTipo, setFilterTipo] = useState("");
  const [filterPatente, setFilterPatente] = useState("");
  const [filterDoc, setFilterDoc] = useState("");

  const { data: alertas = [], isLoading } = useExternalData<AlertaFlota>({
    view: "v_alertas_flota",
    limit: 5000,
  });

  // Only active vehicles (estado = 1)
  const activeAlertas = useMemo(() => alertas.filter((a) => a.vehiculo_estado === 1), [alertas]);

  const tipos = useMemo(() => [...new Set(activeAlertas.map((a) => a.tipo_vehiculo).filter(Boolean))].sort(), [activeAlertas]);
  const docs = useMemo(() => [...new Set(activeAlertas.map((a) => a.documento).filter(Boolean))].sort(), [activeAlertas]);

  const filtered = useMemo(() => {
    return activeAlertas.filter((a) => {
      if (filterTipo && a.tipo_vehiculo !== filterTipo) return false;
      if (filterPatente && !a.patente?.toLowerCase().includes(filterPatente.toLowerCase())) return false;
      if (filterDoc && a.documento !== filterDoc) return false;
      return true;
    });
  }, [activeAlertas, filterTipo, filterPatente, filterDoc]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const vencidos = filtered.filter((a) => a.estado_semaforo === "VENCIDO").length;
    const criticos = filtered.filter((a) => a.estado_semaforo === "CRÍTICO (< 60 DÍAS)").length;
    const optimos = filtered.filter((a) => a.estado_semaforo === "OPTIMO (> 90 DÍAS)").length;
    return { total, vencidos, criticos, optimos };
  }, [filtered]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Utilización de <span className="text-primary">Flota</span></h1>
        <p className="text-sm text-muted-foreground">Tractos y Ramplas — Alertas documentales</p>
      </div>

      {/* Filters */}
      <div className="card-executive p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Tipo Vehículo</label>
            <Select value={filterTipo || "all"} onValueChange={(v) => setFilterTipo(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Patente</label>
            <Input className="h-8 text-xs" placeholder="Buscar patente..." value={filterPatente} onChange={(e) => setFilterPatente(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Documento</label>
            <Select value={filterDoc || "all"} onValueChange={(v) => setFilterDoc(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {docs.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Registros" value={kpis.total.toString()} icon={<Car className="w-5 h-5" />} subtitle="Vehículos activos" />
            <KpiCard title="Vencidos" value={kpis.vencidos.toString()} trend="down" change="Acción requerida" icon={<XCircle className="w-5 h-5" />} subtitle="Documentos vencidos" />
            <KpiCard title="Críticos" value={kpis.criticos.toString()} trend="neutral" change="< 60 días" icon={<AlertTriangle className="w-5 h-5" />} subtitle="Próximos a vencer" />
            <KpiCard title="Óptimos" value={kpis.optimos.toString()} trend="up" change="> 90 días" icon={<CheckCircle className="w-5 h-5" />} subtitle="Al día" />
          </div>

          <div className="card-executive p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Detalle de Documentación</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Patente</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Documento</TableHead>
                    <TableHead className="text-xs">Semáforo</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs">Vencimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 50).map((a, i) => (
                    <TableRow key={`${a.vehiculo_id}-${a.documento}-${i}`}>
                      <TableCell className="text-xs font-mono">{a.patente}</TableCell>
                      <TableCell className="text-xs">{a.tipo_vehiculo}</TableCell>
                      <TableCell className="text-xs">{a.documento}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${SEMAFORO_COLORS[a.semaforo] || "bg-muted text-muted-foreground"}`}>
                          {a.semaforo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${SEMAFORO_COLORS[a.estado_semaforo] || "bg-muted text-muted-foreground"}`}>
                          {a.estado_semaforo}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.fecha_vencimiento && !a.fecha_vencimiento.startsWith("1900") ? new Date(a.fecha_vencimiento).toLocaleDateString("es-CL") : "—"}
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
