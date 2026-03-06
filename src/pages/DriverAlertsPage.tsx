import { useMemo, useState } from "react";
import { useExternalData } from "@/hooks/useExternalData";
import KpiCard from "@/components/KpiCard";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { Users, AlertTriangle, CheckCircle, XCircle, ShieldAlert, FileX, SlidersHorizontal, RotateCcw, Award } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

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

const SEMAFORO_STYLES: Record<string, string> = {
  "VENCIDO": "bg-destructive/10 text-destructive",
  "CRITICO (< 60 DIAS)": "bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)]",
  "ADVERTENCIA (60-90 DIAS)": "bg-[hsl(217,91%,60%,0.1)] text-[hsl(217,91%,60%)]",
  "OPTIMO (> 90 DIAS)": "bg-[hsl(152,69%,45%,0.1)] text-[hsl(152,69%,45%)]",
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
    const criticos = filtered.filter((a) => a.estado_semaforo?.includes("CRITICO") || a.estado_semaforo?.includes("CRÍTICO")).length;
    const bloqueados = new Set(filtered.filter((a) => a.bloqueo_adm === "Bloqueado").map((a) => a.conductor_id)).size;
    const noCargados = filtered.filter((a) => a.estado_semaforo === "DOCUMENTO NO CARGADO").length;
    return { uniqueConductores, vencidos, criticos, bloqueados, noCargados };
  }, [filtered]);

  const reset = () => { setFilterNombre(""); setFilterDoc([]); setFilterBloqueo([]); setFilterEstado([]); setPage(1); };
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-4 h-4 text-[hsl(191,100%,50%)]" strokeWidth={1.8} />
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[0.15em]">Driver Management</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Ranking de <span className="text-[hsl(191,100%,50%)]">Conductores</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Performance y cumplimiento documental</p>
      </motion.div>

      {/* Filters */}
      <div className="rounded-xl border border-[hsl(222,25%,15%)] p-4" style={{ background: "linear-gradient(145deg, hsl(222 40% 9%), hsl(222 40% 10.5%))" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[hsl(191,100%,50%,0.1)]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[hsl(191,100%,50%)]" strokeWidth={1.8} />
            </div>
            <span className="text-xs font-semibold text-foreground tracking-wide">Filtros</span>
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-[hsl(191,100%,50%)] transition-colors px-2.5 py-1 rounded-lg hover:bg-[hsl(191,100%,50%,0.06)]">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Nombre</label>
            <Input className="h-8 text-xs rounded-lg bg-[hsl(222,30%,11%)] border-[hsl(222,25%,18%)]" placeholder="Buscar conductor..." value={filterNombre} onChange={(e) => { setFilterNombre(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Documento</label>
            <MultiSelectDropdown options={docs} selected={filterDoc} onChange={(v) => { setFilterDoc(v); setPage(1); }} placeholder="Todos" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Bloqueo ADM</label>
            <MultiSelectDropdown options={bloqueos} selected={filterBloqueo} onChange={(v) => { setFilterBloqueo(v); setPage(1); }} placeholder="Todos" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Estado</label>
            <MultiSelectDropdown options={estados} selected={filterEstado} onChange={(v) => { setFilterEstado(v); setPage(1); }} placeholder="Todos" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[hsl(191,100%,50%,0.2)] border-t-[hsl(191,100%,50%)] animate-spin" />
          <span className="text-sm text-muted-foreground">Cargando datos...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KpiCard title="Conductores" value={kpis.uniqueConductores.toString()} icon={<Users className="w-5 h-5" strokeWidth={1.8} />} subtitle="Activos" accentColor="191 100% 50%" index={0} />
            <KpiCard title="Vencidos" value={kpis.vencidos.toString()} trend="down" change="Accion requerida" icon={<XCircle className="w-5 h-5" strokeWidth={1.8} />} subtitle="Docs vencidos" accentColor="0 72% 51%" index={1} />
            <KpiCard title="Criticos" value={kpis.criticos.toString()} trend="neutral" change="< 60 dias" icon={<AlertTriangle className="w-5 h-5" strokeWidth={1.8} />} subtitle="Proximos a vencer" accentColor="38 92% 50%" index={2} />
            <KpiCard title="Bloqueados" value={kpis.bloqueados.toString()} trend="down" change="Bloqueo ADM" icon={<ShieldAlert className="w-5 h-5" strokeWidth={1.8} />} subtitle="Con restriccion" accentColor="340 82% 52%" index={3} />
            <KpiCard title="No Cargados" value={kpis.noCargados.toString()} trend="down" change="Sin documentos" icon={<FileX className="w-5 h-5" strokeWidth={1.8} />} subtitle="Sin cargar" accentColor="215 15% 50%" index={4} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-[hsl(222,25%,15%)] p-5"
            style={{ background: "linear-gradient(145deg, hsl(222 40% 9%), hsl(222 40% 10.5%))" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Detalle de Documentacion</h3>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {filtered.length} registros · Pag {page}/{totalPages}
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-[hsl(222,25%,13%)]">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[hsl(222,25%,13%)] hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Nombre</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">RUT</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Documento</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Estado</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Bloqueo</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Vencimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((a, i) => (
                    <TableRow key={`${a.conductor_id}-${a.documento}-${i}`} className="border-b border-[hsl(222,25%,11%)] hover:bg-[hsl(222,30%,11%)] transition-colors">
                      <TableCell className="text-xs font-medium">{a.nombre}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{a.rut}</TableCell>
                      <TableCell className="text-xs">{a.documento}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-medium ${SEMAFORO_STYLES[a.estado_semaforo] || "bg-muted text-muted-foreground"}`}>
                          {a.estado_semaforo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-medium ${
                          a.bloqueo_adm === "Bloqueado"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-[hsl(152,69%,45%,0.1)] text-[hsl(152,69%,45%)]"
                        }`}>
                          {a.bloqueo_adm}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {a.fecha_vencimiento && !a.fecha_vencimiento.startsWith("1900") ? new Date(a.fecha_vencimiento).toLocaleDateString("es-CL") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs rounded-lg border border-[hsl(222,25%,18%)] bg-[hsl(222,30%,11%)] hover:bg-secondary disabled:opacity-30 transition-colors">Anterior</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) pageNum = i + 1;
                  else if (page <= 4) pageNum = i + 1;
                  else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                  else pageNum = page - 3 + i;
                  return (
                    <button key={pageNum} onClick={() => setPage(pageNum)} className={`w-8 h-8 text-xs rounded-lg transition-all ${page === pageNum ? "bg-[hsl(191,100%,50%)] text-[hsl(222,47%,6%)] font-bold" : "border border-[hsl(222,25%,18%)] bg-[hsl(222,30%,11%)] hover:bg-secondary"}`}>{pageNum}</button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs rounded-lg border border-[hsl(222,25%,18%)] bg-[hsl(222,30%,11%)] hover:bg-secondary disabled:opacity-30 transition-colors">Siguiente</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
