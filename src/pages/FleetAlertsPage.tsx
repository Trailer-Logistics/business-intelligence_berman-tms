import { useMemo, useState } from "react";
import { useExternalData } from "@/hooks/useExternalData";
import KpiCard from "@/components/KpiCard";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { Car, AlertTriangle, CheckCircle, XCircle, FileX, SlidersHorizontal, RotateCcw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

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

const SEMAFORO_STYLES: Record<string, string> = {
  "VENCIDO": "bg-destructive/10 text-destructive",
  "CRITICO (< 60 DIAS)": "bg-[hsl(38,92%,50%,0.1)] text-[hsl(38,92%,50%)]",
  "[60 - 90 DIAS]": "bg-[hsl(217,91%,60%,0.1)] text-[hsl(217,91%,60%)]",
  "OPTIMO (> 90 DIAS)": "bg-[hsl(152,69%,45%,0.1)] text-[hsl(152,69%,45%)]",
  "SIN DATO": "bg-muted text-muted-foreground",
  "DOCUMENTO NO CARGADO": "bg-muted text-muted-foreground",
  "AL DIA": "bg-[hsl(152,69%,45%,0.1)] text-[hsl(152,69%,45%)]",
};

export default function FleetAlertsPage() {
  const [filterTipo, setFilterTipo] = useState<string[]>([]);
  const [filterPatente, setFilterPatente] = useState("");
  const [filterDoc, setFilterDoc] = useState<string[]>([]);
  const [filterSemaforo, setFilterSemaforo] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 30;
  const { data: alertas = [], isLoading } = useExternalData<AlertaFlota>({
    view: "v_alertas_flota",
    limit: 5000,
  });

  const activeAlertas = useMemo(() => alertas.filter((a) => Number(a.vehiculo_estado) === 1), [alertas]);
  const tipos = useMemo(() => [...new Set(activeAlertas.map((a) => a.tipo_vehiculo).filter(Boolean))].sort(), [activeAlertas]);
  const docs = useMemo(() => [...new Set(activeAlertas.map((a) => a.documento).filter(Boolean))].sort(), [activeAlertas]);
  const semaforos = useMemo(() => [...new Set(activeAlertas.map((a) => a.estado_semaforo).filter(Boolean))].sort(), [activeAlertas]);

  const filtered = useMemo(() => {
    return activeAlertas.filter((a) => {
      if (filterTipo.length > 0 && !filterTipo.includes(a.tipo_vehiculo)) return false;
      if (filterPatente && !a.patente?.toLowerCase().includes(filterPatente.toLowerCase())) return false;
      if (filterDoc.length > 0 && !filterDoc.includes(a.documento)) return false;
      if (filterSemaforo.length > 0 && !filterSemaforo.includes(a.estado_semaforo)) return false;
      return true;
    });
  }, [activeAlertas, filterTipo, filterPatente, filterDoc, filterSemaforo]);

  const kpis = useMemo(() => {
    const uniquePatentes = new Set(filtered.map((a) => a.patente)).size;
    const vencidos = filtered.filter((a) => a.estado_semaforo === "VENCIDO").length;
    const criticos = filtered.filter((a) => a.estado_semaforo?.includes("CRITICO") || a.estado_semaforo?.includes("CRÍTICO")).length;
    const optimos = filtered.filter((a) => a.estado_semaforo?.includes("OPTIMO") || a.estado_semaforo === "AL DIA" || a.estado_semaforo === "AL DÍA").length;
    const noCargados = filtered.filter((a) => a.estado_semaforo === "DOCUMENTO NO CARGADO" || a.estado_semaforo === "SIN DATO").length;
    return { uniquePatentes, vencidos, criticos, optimos, noCargados };
  }, [filtered]);

  const reset = () => { setFilterTipo([]); setFilterPatente(""); setFilterDoc([]); setFilterSemaforo([]); setPage(1); };
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Car className="w-4 h-4 text-[hsl(191,100%,50%)]" strokeWidth={1.8} />
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[0.15em]">Fleet Management</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Utilizacion de <span className="text-[hsl(191,100%,50%)]">Flota</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tractos y Ramplas — Alertas documentales</p>
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
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Tipo Vehiculo</label>
            <MultiSelectDropdown options={tipos} selected={filterTipo} onChange={(v) => { setFilterTipo(v); setPage(1); }} placeholder="Todos" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Patente</label>
            <Input className="h-8 text-xs rounded-lg bg-[hsl(222,30%,11%)] border-[hsl(222,25%,18%)]" placeholder="Buscar patente..." value={filterPatente} onChange={(e) => { setFilterPatente(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Documento</label>
            <MultiSelectDropdown options={docs} selected={filterDoc} onChange={(v) => { setFilterDoc(v); setPage(1); }} placeholder="Todos" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Estado</label>
            <MultiSelectDropdown options={semaforos} selected={filterSemaforo} onChange={(v) => { setFilterSemaforo(v); setPage(1); }} placeholder="Todos" />
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
            <KpiCard title="Patentes Unicas" value={kpis.uniquePatentes.toString()} icon={<Car className="w-5 h-5" strokeWidth={1.8} />} subtitle="Vehiculos activos" accentColor="191 100% 50%" index={0} />
            <KpiCard title="Vencidos" value={kpis.vencidos.toString()} trend="down" change="Accion requerida" icon={<XCircle className="w-5 h-5" strokeWidth={1.8} />} subtitle="Documentos vencidos" accentColor="0 72% 51%" index={1} />
            <KpiCard title="Criticos" value={kpis.criticos.toString()} trend="neutral" change="< 60 dias" icon={<AlertTriangle className="w-5 h-5" strokeWidth={1.8} />} subtitle="Proximos a vencer" accentColor="38 92% 50%" index={2} />
            <KpiCard title="Optimos" value={kpis.optimos.toString()} trend="up" change="> 90 dias" icon={<CheckCircle className="w-5 h-5" strokeWidth={1.8} />} subtitle="Al dia" accentColor="152 69% 45%" index={3} />
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
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Patente</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Tipo</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Documento</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Semaforo</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Estado</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Vencimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((a, i) => (
                    <TableRow key={`${a.vehiculo_id}-${a.documento}-${i}`} className="border-b border-[hsl(222,25%,11%)] hover:bg-[hsl(222,30%,11%)] transition-colors">
                      <TableCell className="text-xs font-mono text-[hsl(191,100%,50%)]">{a.patente}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.tipo_vehiculo}</TableCell>
                      <TableCell className="text-xs">{a.documento}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-medium ${SEMAFORO_STYLES[a.semaforo] || "bg-muted text-muted-foreground"}`}>
                          {a.semaforo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-medium ${SEMAFORO_STYLES[a.estado_semaforo] || "bg-muted text-muted-foreground"}`}>
                          {a.estado_semaforo}
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
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[hsl(222,25%,18%)] bg-[hsl(222,30%,11%)] hover:bg-secondary disabled:opacity-30 transition-colors"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) pageNum = i + 1;
                  else if (page <= 4) pageNum = i + 1;
                  else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                  else pageNum = page - 3 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-xs rounded-lg transition-all ${
                        page === pageNum
                          ? "bg-[hsl(191,100%,50%)] text-[hsl(222,47%,6%)] font-bold"
                          : "border border-[hsl(222,25%,18%)] bg-[hsl(222,30%,11%)] hover:bg-secondary"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[hsl(222,25%,18%)] bg-[hsl(222,30%,11%)] hover:bg-secondary disabled:opacity-30 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
