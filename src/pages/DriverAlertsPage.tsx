import { useMemo, useState } from "react";
import { useExternalData } from "@/hooks/useExternalData";
import KpiCard from "@/components/KpiCard";
import { Users, AlertTriangle, CheckCircle, XCircle, ShieldAlert, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface AlertaConductor {
  conductor_id: number;
  nombre: string;
  rut: string;
  conductor_estado: number;
  documento: string;
  fecha_vencimiento: string;
  estado_semaforo: string;
  bloqueo_adm: string;
  detalle_documento: string;
  mes_vencimiento: string | null;
}

const SEMAFORO_COLORS: Record<string, string> = {
  "VENCIDO": "bg-destructive/20 text-destructive",
  "CRÍTICO (< 60 DÍAS)": "bg-warning/20 text-warning",
  "ADVERTENCIA (60-90 DÍAS)": "bg-electric-blue/20 text-electric-blue",
  "OPTIMO (> 90 DÍAS)": "bg-success/20 text-success",
  "DOCUMENTO NO CARGADO": "bg-muted text-muted-foreground",
};

export default function DriverAlertsPage() {
  const [filterNombre, setFilterNombre] = useState("");
  const [filterDoc, setFilterDoc] = useState("");
  const [filterBloqueo, setFilterBloqueo] = useState("");
  const [filterEstado, setFilterEstado] = useState("1"); // default: activos

  const { data: alertas = [], isLoading } = useExternalData<AlertaConductor>({
    view: "v_alertas_conductores",
    limit: 5000,
  });

  const docs = useMemo(() => [...new Set(alertas.map((a) => a.documento).filter(Boolean))].sort(), [alertas]);

  const filtered = useMemo(() => {
    return alertas.filter((a) => {
      if (filterEstado && a.conductor_estado !== Number(filterEstado)) return false;
      if (filterNombre && !a.nombre?.toLowerCase().includes(filterNombre.toLowerCase())) return false;
      if (filterDoc && a.documento !== filterDoc) return false;
      if (filterBloqueo && a.bloqueo_adm !== filterBloqueo) return false;
      return true;
    });
  }, [alertas, filterEstado, filterNombre, filterDoc, filterBloqueo]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const vencidos = filtered.filter((a) => a.estado_semaforo === "VENCIDO").length;
    const criticos = filtered.filter((a) => a.estado_semaforo === "CRÍTICO (< 60 DÍAS)").length;
    const bloqueados = filtered.filter((a) => a.bloqueo_adm === "Bloqueado").length;
    return { total, vencidos, criticos, bloqueados };
  }, [filtered]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ranking de <span className="text-primary">Conductores</span></h1>
        <p className="text-sm text-muted-foreground">Performance y cumplimiento documental</p>
      </div>

      {/* Filters */}
      <div className="card-executive p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Nombre</label>
            <Input className="h-8 text-xs" placeholder="Buscar conductor..." value={filterNombre} onChange={(e) => setFilterNombre(e.target.value)} />
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
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Bloqueo ADM</label>
            <Select value={filterBloqueo || "all"} onValueChange={(v) => setFilterBloqueo(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                <SelectItem value="Sin Bloqueo">Sin Bloqueo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Estado</label>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Activos</SelectItem>
                <SelectItem value="0">Inactivos</SelectItem>
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
            <KpiCard title="Total Registros" value={kpis.total.toString()} icon={<Users className="w-5 h-5" />} subtitle="Conductores" />
            <KpiCard title="Vencidos" value={kpis.vencidos.toString()} trend="down" change="Acción requerida" icon={<XCircle className="w-5 h-5" />} subtitle="Docs vencidos" />
            <KpiCard title="Críticos" value={kpis.criticos.toString()} trend="neutral" change="< 60 días" icon={<AlertTriangle className="w-5 h-5" />} subtitle="Próximos a vencer" />
            <KpiCard title="Bloqueados" value={kpis.bloqueados.toString()} trend="down" change="Bloqueo ADM" icon={<ShieldAlert className="w-5 h-5" />} subtitle="Con restricción" />
          </div>

          <div className="card-executive p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Detalle de Documentación</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs">RUT</TableHead>
                    <TableHead className="text-xs">Documento</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs">Bloqueo</TableHead>
                    <TableHead className="text-xs">Vencimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 50).map((a, i) => (
                    <TableRow key={`${a.conductor_id}-${a.documento}-${i}`}>
                      <TableCell className="text-xs font-medium">{a.nombre}</TableCell>
                      <TableCell className="text-xs font-mono">{a.rut}</TableCell>
                      <TableCell className="text-xs">{a.documento}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${SEMAFORO_COLORS[a.estado_semaforo] || "bg-muted text-muted-foreground"}`}>
                          {a.estado_semaforo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${a.bloqueo_adm === "Bloqueado" ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"}`}>
                          {a.bloqueo_adm}
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
