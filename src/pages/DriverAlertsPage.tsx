import { useMemo, useState } from "react";
import { useExternalData } from "@/hooks/useExternalData";
import KpiCard from "@/components/KpiCard";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { Users, AlertTriangle, CheckCircle, XCircle, ShieldAlert, FileX, Loader2, Filter, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [filterDoc, setFilterDoc] = useState<string[]>([]);
  const [filterBloqueo, setFilterBloqueo] = useState<string[]>([]);
  const [filterEstado, setFilterEstado] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;

  const { data: alertas = [], isLoading } = useExternalData<AlertaConductor>({
    view: "v_alertas_conductores",
    limit: 5000,
  });

  // Only active conductors
  const activeAlertas = useMemo(() => alertas.filter((a) => Number(a.conductor_estado) === 1), [alertas]);

  const docs = useMemo(() => [...new Set(activeAlertas.map((a) => a.documento).filter(Boolean))].sort(), [activeAlertas]);
  const bloqueos = useMemo(() => [...new Set(activeAlertas.map((a) => a.bloqueo_adm).filter(Boolean))].sort(), [activeAlertas]);
  const estados = useMemo(() => [...new Set(activeAlertas.map((a) => a.estado_semaforo).filter(Boolean))].sort(), [activeAlertas]);

  const filtered = useMemo(() => {
    return activeAlertas.filter((a) => {
      if (filterNombre && !a.nombre?.toLowerCase().includes(filterNombre.toLowerCase())) return false;
      if (filterDoc.length > 0 && !filterDoc.includes(a.documento)) return false;
      if (filterBloqueo.length > 0 && !filterBloqueo.includes(a.bloqueo_adm)) return false;
      if (filterEstado.length > 0 && !filterEstado.includes(a.estado_semaforo)) return false;
      return true;
    });
  }, [activeAlertas, filterNombre, filterDoc, filterBloqueo, filterEstado]);

  const kpis = useMemo(() => {
    const uniqueConductores = new Set(filtered.map((a) => a.conductor_id)).size;
    const vencidos = filtered.filter((a) => a.estado_semaforo === "VENCIDO").length;
    const criticos = filtered.filter((a) => a.estado_semaforo === "CRÍTICO (< 60 DÍAS)").length;
    const bloqueados = new Set(filtered.filter((a) => a.bloqueo_adm === "Bloqueado").map((a) => a.conductor_id)).size;
    const noCargados = filtered.filter((a) => a.estado_semaforo === "DOCUMENTO NO CARGADO").length;
    return { uniqueConductores, vencidos, criticos, bloqueados, noCargados };
  }, [filtered]);

  const reset = () => {
    setFilterNombre("");
    setFilterDoc([]);
    setFilterBloqueo([]);
    setFilterEstado([]);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterDoc = (v: string[]) => { setFilterDoc(v); setPage(1); };
  const handleFilterBloqueo = (v: string[]) => { setFilterBloqueo(v); setPage(1); };
  const handleFilterEstado = (v: string[]) => { setFilterEstado(v); setPage(1); };
  const handleFilterNombre = (e: React.ChangeEvent<HTMLInputElement>) => { setFilterNombre(e.target.value); setPage(1); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ranking de <span className="text-primary">Conductores</span></h1>
        <p className="text-sm text-muted-foreground">Performance y cumplimiento documental</p>
      </div>

      {/* Filters */}
      <div className="card-executive p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Filtros</span>
          <button onClick={reset} className="ml-auto text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Nombre</label>
            <Input className="h-8 text-xs" placeholder="Buscar conductor..." value={filterNombre} onChange={handleFilterNombre} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Documento</label>
            <MultiSelectDropdown options={docs} selected={filterDoc} onChange={handleFilterDoc} placeholder="Todos" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Bloqueo ADM</label>
            <MultiSelectDropdown options={bloqueos} selected={filterBloqueo} onChange={handleFilterBloqueo} placeholder="Todos" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase">Estado</label>
            <MultiSelectDropdown options={estados} selected={filterEstado} onChange={handleFilterEstado} placeholder="Todos" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard title="Conductores Únicos" value={kpis.uniqueConductores.toString()} icon={<Users className="w-5 h-5" />} subtitle="Conductores activos" />
            <KpiCard title="Vencidos" value={kpis.vencidos.toString()} trend="down" change="Acción requerida" icon={<XCircle className="w-5 h-5" />} subtitle="Docs vencidos" />
            <KpiCard title="Críticos" value={kpis.criticos.toString()} trend="neutral" change="< 60 días" icon={<AlertTriangle className="w-5 h-5" />} subtitle="Próximos a vencer" />
            <KpiCard title="Bloqueados" value={kpis.bloqueados.toString()} trend="down" change="Bloqueo ADM" icon={<ShieldAlert className="w-5 h-5" />} subtitle="Con restricción" />
            <KpiCard title="No Cargados" value={kpis.noCargados.toString()} trend="down" change="Sin documentos" icon={<FileX className="w-5 h-5" />} subtitle="Documentos sin cargar" />
          </div>

          <div className="card-executive p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Detalle de Documentación</h3>
              <span className="text-xs text-muted-foreground">{filtered.length} registros · Página {page} de {totalPages}</span>
            </div>
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
                  {paginatedData.map((a, i) => (
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs rounded border border-input bg-background hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 text-xs rounded transition-colors ${
                        page === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "border border-input bg-background hover:bg-accent"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-xs rounded border border-input bg-background hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
