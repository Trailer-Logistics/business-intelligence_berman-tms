import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { useExternalData } from "@/hooks/useExternalData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import KpiCard from "@/components/KpiCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Save, Search, Loader2, Clock, Timer, Download, Upload, Pencil, CalendarIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface Viaje {
  viaje_id: number;
  nro_viaje: string;
  cliente_estandar: string;
  conductor_principal: string | null;
  patente_tracto: string;
  nombre_ruta: string | null;
  fecha_salida_origen: string | null;
  estado_viaje_estandar: string;
}

interface RegistroRow {
  id: string;
  viaje_id: number;
  nro_viaje: string | null;
  tiempo_carga_hrs: number;
  tiempo_descarga_hrs: number;
  lead_time_hrs: number;
  tiempo_retorno_hrs: number;
  tiempo_total_hrs: number;
  usuario_registro: string | null;
  editado_el: string;
}

interface EditState {
  tiempo_carga_hrs: string;
  tiempo_descarga_hrs: string;
  lead_time_hrs: string;
  tiempo_retorno_hrs: string;
}

const FIELDS = ["tiempo_carga_hrs", "tiempo_descarga_hrs", "lead_time_hrs", "tiempo_retorno_hrs"] as const;
const FIELD_LABELS = ["Carga (h)", "Descarga (h)", "Lead Time (h)", "Retorno (h)"];
const EXCEL_HEADERS = ["Nro Viaje", "Viaje ID", "Carga (h)", "Descarga (h)", "Lead Time (h)", "Retorno (h)"];

export default function WalmartLoaRegistroPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchViaje, setSearchViaje] = useState("");
  const [registros, setRegistros] = useState<RegistroRow[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Bulk edit state: viaje_id -> field values
  const [bulkEdit, setBulkEdit] = useState<Record<number, EditState>>({});

  // Calendar filters
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const dateFromValue = dateFrom ? parse(dateFrom, "yyyy-MM-dd", new Date()) : undefined;
  const dateToValue = dateTo ? parse(dateTo, "yyyy-MM-dd", new Date()) : undefined;

  const closeDateFrom = useCallback((d: Date | undefined) => {
    if (d) setDateFrom(format(d, "yyyy-MM-dd"));
    setTimeout(() => setDateFromOpen(false), 0);
  }, []);

  const closeDateTo = useCallback((d: Date | undefined) => {
    if (d) setDateTo(format(d, "yyyy-MM-dd"));
    setTimeout(() => setDateToOpen(false), 0);
  }, []);

  // Build query filters for external data
  const queryFilters = useMemo(() => {
    const f: Record<string, any> = { cliente_estandar: "Walmart LOA" };
    if (dateFrom) f.fecha_salida_origen = { op: "gte", value: dateFrom };
    if (dateTo) f["fecha_salida_origen@lte"] = { op: "lte", value: dateTo, column: "fecha_salida_origen" };
    return f;
  }, [dateFrom, dateTo]);

  const { data: viajes = [], isLoading: loadingViajes } = useExternalData<Viaje>({
    view: "v_viajes_inteligentes",
    filters: queryFilters,
    limit: 5000,
  });

  // Fetch local registros
  const fetchRegistros = async () => {
    setLoadingRegistros(true);
    const { data, error } = await supabase
      .from("r_registro_walmart_loa")
      .select("*")
      .order("editado_el", { ascending: false });
    if (!error && data) setRegistros(data as RegistroRow[]);
    setLoadingRegistros(false);
  };

  useEffect(() => { fetchRegistros(); }, []);

  const registroMap = useMemo(() => {
    const map = new Map<number, RegistroRow>();
    for (const r of registros) map.set(r.viaje_id, r);
    return map;
  }, [registros]);

  // Sort viajes by fecha_salida_origen ascending (oldest first)
  const sortedViajes = useMemo(() => {
    return [...viajes].sort((a, b) => {
      const da = a.fecha_salida_origen || "";
      const db = b.fecha_salida_origen || "";
      return da.localeCompare(db);
    });
  }, [viajes]);

  const filteredViajes = useMemo(() => {
    if (!searchViaje.trim()) return sortedViajes;
    const q = searchViaje.toLowerCase();
    return sortedViajes.filter(v =>
      v.nro_viaje?.toLowerCase().includes(q) ||
      v.conductor_principal?.toLowerCase().includes(q) ||
      v.patente_tracto?.toLowerCase().includes(q) ||
      v.nombre_ruta?.toLowerCase().includes(q)
    );
  }, [sortedViajes, searchViaje]);

  // Initialize bulk edit state from existing registros
  const initBulkEdit = () => {
    const edit: Record<number, EditState> = {};
    for (const v of filteredViajes) {
      const reg = registroMap.get(v.viaje_id);
      edit[v.viaje_id] = {
        tiempo_carga_hrs: reg ? reg.tiempo_carga_hrs.toString() : "0",
        tiempo_descarga_hrs: reg ? reg.tiempo_descarga_hrs.toString() : "0",
        lead_time_hrs: reg ? reg.lead_time_hrs.toString() : "0",
        tiempo_retorno_hrs: reg ? reg.tiempo_retorno_hrs.toString() : "0",
      };
    }
    setBulkEdit(edit);
  };

  const handleEnterEditMode = () => {
    initBulkEdit();
    setEditMode(true);
    setHasUnsavedChanges(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setBulkEdit({});
    setHasUnsavedChanges(false);
  };

  const handleCellChange = (viajeId: number, field: string, value: string) => {
    setBulkEdit(prev => ({
      ...prev,
      [viajeId]: { ...(prev[viajeId] || { tiempo_carga_hrs: "0", tiempo_descarga_hrs: "0", lead_time_hrs: "0", tiempo_retorno_hrs: "0" }), [field]: value },
    }));
    setHasUnsavedChanges(true);
  };

  const calcTotal = (edit: EditState) => {
    return FIELDS.reduce((s, f) => s + Math.max(0, parseFloat(edit[f]) || 0), 0);
  };

  // ── Guardar Todo ──
  const handleSaveAll = async () => {
    setSaving(true);
    const changedIds = Object.keys(bulkEdit).map(Number);
    const payloads = changedIds.map(viajeId => {
      const v = viajes.find(x => x.viaje_id === viajeId);
      const edit = bulkEdit[viajeId];
      if (!edit) return null;
      const carga = Math.max(0, parseFloat(edit.tiempo_carga_hrs) || 0);
      const descarga = Math.max(0, parseFloat(edit.tiempo_descarga_hrs) || 0);
      const lead = Math.max(0, parseFloat(edit.lead_time_hrs) || 0);
      const retorno = Math.max(0, parseFloat(edit.tiempo_retorno_hrs) || 0);
      return {
        viaje_id: viajeId,
        nro_viaje: v?.nro_viaje || null,
        tiempo_carga_hrs: carga,
        tiempo_descarga_hrs: descarga,
        lead_time_hrs: lead,
        tiempo_retorno_hrs: retorno,
        tiempo_total_hrs: carga + descarga + lead + retorno,
        usuario_registro: user?.email || "",
        editado_el: new Date().toISOString(),
      };
    }).filter(Boolean);

    // Filter only rows with at least one non-zero value
    const nonEmpty = payloads.filter((p: any) => p.tiempo_total_hrs > 0);

    if (nonEmpty.length === 0) {
      toast({ title: "Sin datos", description: "No hay registros con valores para guardar.", variant: "destructive" });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("r_registro_walmart_loa")
      .upsert(nonEmpty as any[], { onConflict: "viaje_id" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Guardado", description: `${nonEmpty.length} registros actualizados correctamente.` });
      setEditMode(false);
      setHasUnsavedChanges(false);
      setBulkEdit({});
      fetchRegistros();
    }
    setSaving(false);
  };

  // ── Download Excel ──
  const handleDownloadTemplate = () => {
    const wsData = [
      EXCEL_HEADERS,
      ...filteredViajes.map(v => {
        const reg = registroMap.get(v.viaje_id);
        return [
          v.nro_viaje,
          v.viaje_id,
          reg?.tiempo_carga_hrs ?? 0,
          reg?.tiempo_descarga_hrs ?? 0,
          reg?.lead_time_hrs ?? 0,
          reg?.tiempo_retorno_hrs ?? 0,
        ];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registro");
    XLSX.writeFile(wb, `Registro_WalmartLOA_${dateFrom}_${dateTo}.xlsx`);
    toast({ title: "Descargado", description: "Plantilla Excel generada." });
  };

  // ── Upload Excel ──
  const handleUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const newEdit: Record<number, EditState> = { ...bulkEdit };
        let imported = 0;

        for (const row of jsonData) {
          const viajeId = parseInt(row["Viaje ID"] ?? row["viaje_id"] ?? "0");
          if (!viajeId) continue;
          newEdit[viajeId] = {
            tiempo_carga_hrs: (row["Carga (h)"] ?? row["tiempo_carga_hrs"] ?? 0).toString(),
            tiempo_descarga_hrs: (row["Descarga (h)"] ?? row["tiempo_descarga_hrs"] ?? 0).toString(),
            lead_time_hrs: (row["Lead Time (h)"] ?? row["lead_time_hrs"] ?? 0).toString(),
            tiempo_retorno_hrs: (row["Retorno (h)"] ?? row["tiempo_retorno_hrs"] ?? 0).toString(),
          };
          imported++;
        }

        setBulkEdit(newEdit);
        setHasUnsavedChanges(true);
        if (!editMode) setEditMode(true);
        toast({ title: "Importado", description: `${imported} viajes cargados desde Excel. Presiona "Guardar Todo" para confirmar.` });
      } catch {
        toast({ title: "Error", description: "No se pudo leer el archivo Excel.", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = registros.length;
    const avgTotal = total > 0 ? registros.reduce((s, r) => s + (r.tiempo_total_hrs || 0), 0) / total : 0;
    const avgLead = total > 0 ? registros.reduce((s, r) => s + (r.lead_time_hrs || 0), 0) / total : 0;
    return { total, avgTotal: avgTotal.toFixed(1), avgLead: avgLead.toFixed(1) };
  }, [registros]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Registro <span className="text-primary">Walmart LOA</span></h1>
        <p className="text-sm text-muted-foreground">Tiempos operativos — UPSERT masivo por viaje_id</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Viajes Registrados" value={kpis.total.toString()} icon={<ClipboardList className="w-5 h-5" />} subtitle="Con tiempos" />
        <KpiCard title="Tiempo Total Prom." value={`${kpis.avgTotal}h`} icon={<Clock className="w-5 h-5" />} subtitle="Promedio" />
        <KpiCard title="Lead Time Prom." value={`${kpis.avgLead}h`} icon={<Timer className="w-5 h-5" />} subtitle="Promedio" />
      </div>

      {/* Filtros: Calendario + Búsqueda */}
      <div className="card-executive p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Date From */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Desde</label>
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger asChild>
                <button className={cn(
                  "flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2 text-xs min-w-[110px]",
                  !dateFromValue && "text-muted-foreground"
                )}>
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  {dateFromValue ? format(dateFromValue, "dd/MM/yy") : "Desde"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFromValue} onSelect={closeDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Hasta</label>
            <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
              <PopoverTrigger asChild>
                <button className={cn(
                  "flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2 text-xs min-w-[110px]",
                  !dateToValue && "text-muted-foreground"
                )}>
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                  {dateToValue ? format(dateToValue, "dd/MM/yy") : "Hasta"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateToValue} onSelect={closeDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Buscar</label>
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="h-8 text-xs flex-1"
                placeholder="Nro Viaje, Conductor, Patente, Destino..."
                value={searchViaje}
                onChange={(e) => setSearchViaje(e.target.value)}
              />
            </div>
          </div>

          <span className="text-[10px] text-muted-foreground pb-1">{filteredViajes.length} viajes</span>
        </div>
      </div>

      {/* Actions bar */}
      <div className="card-executive p-4 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleDownloadTemplate}>
          <Download className="w-3 h-3 mr-1" /> Descargar Plantilla
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-3 h-3 mr-1" /> Cargar Excel
        </Button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUploadExcel} />

        {!editMode ? (
          <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={handleEnterEditMode}>
            <Pencil className="w-3 h-3 mr-1" /> Editar
          </Button>
        ) : (
          <>
            <Button size="sm" className="h-8 text-xs px-4" onClick={handleSaveAll} disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Guardar Todo
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleCancelEdit}>
              <RotateCcw className="w-3 h-3 mr-1" /> Cancelar
            </Button>
          </>
        )}

        {hasUnsavedChanges && (
          <div className="bg-warning/10 border border-warning/30 rounded-md px-3 py-1.5">
            <p className="text-[10px] text-warning font-medium">⚠ Cambios sin guardar</p>
          </div>
        )}
      </div>

      {/* Table */}
      {loadingViajes || loadingRegistros ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <div className="card-executive p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Viajes Walmart LOA</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nro Viaje</TableHead>
                  <TableHead className="text-xs">Fecha Salida Origen</TableHead>
                  <TableHead className="text-xs">Destino</TableHead>
                  <TableHead className="text-xs">Conductor</TableHead>
                  <TableHead className="text-xs">Tracto</TableHead>
                  {FIELD_LABELS.map(l => <TableHead key={l} className="text-xs">{l}</TableHead>)}
                  <TableHead className="text-xs">Total (h)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredViajes.map((v) => {
                  const reg = registroMap.get(v.viaje_id);
                  const edit = bulkEdit[v.viaje_id];

                  return (
                    <TableRow key={v.viaje_id} className={reg ? "bg-success/5" : ""}>
                      <TableCell className="text-xs font-mono">{v.nro_viaje}</TableCell>
                      <TableCell className="text-xs">{v.fecha_salida_origen || "—"}</TableCell>
                      <TableCell className="text-xs">{v.nombre_ruta || "—"}</TableCell>
                      <TableCell className="text-xs">{v.conductor_principal || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{v.patente_tracto}</TableCell>

                      {editMode && edit ? (
                        <>
                          {FIELDS.map(f => (
                            <TableCell key={f}>
                              <Input
                                className="h-7 w-16 text-xs text-center"
                                type="number"
                                step="0.25"
                                value={edit[f]}
                                onChange={(e) => handleCellChange(v.viaje_id, f, e.target.value)}
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-xs font-semibold text-primary">
                            {calcTotal(edit).toFixed(2)}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-xs">{reg ? reg.tiempo_carga_hrs : "—"}</TableCell>
                          <TableCell className="text-xs">{reg ? reg.tiempo_descarga_hrs : "—"}</TableCell>
                          <TableCell className="text-xs">{reg ? reg.lead_time_hrs : "—"}</TableCell>
                          <TableCell className="text-xs">{reg ? reg.tiempo_retorno_hrs : "—"}</TableCell>
                          <TableCell className="text-xs font-semibold">{reg ? reg.tiempo_total_hrs : "—"}</TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
