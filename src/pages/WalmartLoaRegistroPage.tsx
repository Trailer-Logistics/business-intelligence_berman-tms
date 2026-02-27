import { useState, useMemo, useEffect } from "react";
import { useExternalData } from "@/hooks/useExternalData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import KpiCard from "@/components/KpiCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Save, Search, Loader2, Clock, Truck, Timer, RotateCcw } from "lucide-react";

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

export default function WalmartLoaRegistroPage() {
  const { user } = useAuth();
  const [searchViaje, setSearchViaje] = useState("");
  const [registros, setRegistros] = useState<RegistroRow[]>([]);
  const [loadingRegistros, setLoadingRegistros] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({ tiempo_carga_hrs: "0", tiempo_descarga_hrs: "0", lead_time_hrs: "0", tiempo_retorno_hrs: "0" });
  const [saving, setSaving] = useState(false);

  // Get Walmart LOA trips from external
  const { data: viajes = [], isLoading: loadingViajes } = useExternalData<Viaje>({
    view: "v_viajes_inteligentes",
    filters: { cliente_estandar: "Walmart LOA" },
    limit: 2000,
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

  const filteredViajes = useMemo(() => {
    if (!searchViaje.trim()) return viajes.slice(0, 50);
    const q = searchViaje.toLowerCase();
    return viajes.filter(v =>
      v.nro_viaje?.toLowerCase().includes(q) ||
      v.conductor_principal?.toLowerCase().includes(q) ||
      v.patente_tracto?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [viajes, searchViaje]);

  const startEdit = (viaje: Viaje) => {
    const existing = registroMap.get(viaje.viaje_id);
    setEditingId(viaje.viaje_id);
    setEditState({
      tiempo_carga_hrs: existing ? existing.tiempo_carga_hrs.toString() : "0",
      tiempo_descarga_hrs: existing ? existing.tiempo_descarga_hrs.toString() : "0",
      lead_time_hrs: existing ? existing.lead_time_hrs.toString() : "0",
      tiempo_retorno_hrs: existing ? existing.tiempo_retorno_hrs.toString() : "0",
    });
  };

  const handleSave = async (viaje: Viaje) => {
    setSaving(true);
    const payload = {
      viaje_id: viaje.viaje_id,
      nro_viaje: viaje.nro_viaje,
      tiempo_carga_hrs: Math.max(0, parseFloat(editState.tiempo_carga_hrs) || 0),
      tiempo_descarga_hrs: Math.max(0, parseFloat(editState.tiempo_descarga_hrs) || 0),
      lead_time_hrs: Math.max(0, parseFloat(editState.lead_time_hrs) || 0),
      tiempo_retorno_hrs: Math.max(0, parseFloat(editState.tiempo_retorno_hrs) || 0),
      usuario_registro: user?.email || "",
      editado_el: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("r_registro_walmart_loa")
      .upsert(payload, { onConflict: "viaje_id" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Guardado", description: `Viaje ${viaje.nro_viaje} registrado correctamente.` });
      setEditingId(null);
      fetchRegistros();
    }
    setSaving(false);
  };

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
        <p className="text-sm text-muted-foreground">UPSERT por ID de viaje — Tiempos operativos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Viajes Registrados" value={kpis.total.toString()} icon={<ClipboardList className="w-5 h-5" />} subtitle="Con tiempos" />
        <KpiCard title="Tiempo Total Prom." value={`${kpis.avgTotal}h`} icon={<Clock className="w-5 h-5" />} subtitle="Promedio" />
        <KpiCard title="Lead Time Prom." value={`${kpis.avgLead}h`} icon={<Timer className="w-5 h-5" />} subtitle="Promedio" />
      </div>

      {/* Search */}
      <div className="card-executive p-4">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            className="h-8 text-xs flex-1"
            placeholder="Buscar por Nro Viaje, Conductor o Patente..."
            value={searchViaje}
            onChange={(e) => setSearchViaje(e.target.value)}
          />
          <span className="text-[10px] text-muted-foreground">{filteredViajes.length} viajes</span>
        </div>
      </div>

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
                  <TableHead className="text-xs">Fecha</TableHead>
                  <TableHead className="text-xs">Conductor</TableHead>
                  <TableHead className="text-xs">Tracto</TableHead>
                  <TableHead className="text-xs">Carga (h)</TableHead>
                  <TableHead className="text-xs">Descarga (h)</TableHead>
                  <TableHead className="text-xs">Lead Time (h)</TableHead>
                  <TableHead className="text-xs">Retorno (h)</TableHead>
                  <TableHead className="text-xs">Total (h)</TableHead>
                  <TableHead className="text-xs">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredViajes.map((v) => {
                  const reg = registroMap.get(v.viaje_id);
                  const isEditing = editingId === v.viaje_id;

                  return (
                    <TableRow key={v.viaje_id} className={reg ? "bg-success/5" : ""}>
                      <TableCell className="text-xs font-mono">{v.nro_viaje}</TableCell>
                      <TableCell className="text-xs">{v.fecha_salida_origen || "—"}</TableCell>
                      <TableCell className="text-xs">{v.conductor_principal || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{v.patente_tracto}</TableCell>

                      {isEditing ? (
                        <>
                          <TableCell><Input className="h-7 w-16 text-xs" type="number" step="0.25" value={editState.tiempo_carga_hrs} onChange={(e) => setEditState(s => ({ ...s, tiempo_carga_hrs: e.target.value }))} /></TableCell>
                          <TableCell><Input className="h-7 w-16 text-xs" type="number" step="0.25" value={editState.tiempo_descarga_hrs} onChange={(e) => setEditState(s => ({ ...s, tiempo_descarga_hrs: e.target.value }))} /></TableCell>
                          <TableCell><Input className="h-7 w-16 text-xs" type="number" step="0.25" value={editState.lead_time_hrs} onChange={(e) => setEditState(s => ({ ...s, lead_time_hrs: e.target.value }))} /></TableCell>
                          <TableCell><Input className="h-7 w-16 text-xs" type="number" step="0.25" value={editState.tiempo_retorno_hrs} onChange={(e) => setEditState(s => ({ ...s, tiempo_retorno_hrs: e.target.value }))} /></TableCell>
                          <TableCell className="text-xs font-semibold text-primary">
                            {(Math.max(0, parseFloat(editState.tiempo_carga_hrs) || 0) + Math.max(0, parseFloat(editState.tiempo_descarga_hrs) || 0) + Math.max(0, parseFloat(editState.lead_time_hrs) || 0) + Math.max(0, parseFloat(editState.tiempo_retorno_hrs) || 0)).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleSave(v)} disabled={saving}>
                                <Save className="w-3 h-3 mr-1" />{saving ? "…" : "OK"}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditingId(null)}>
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-xs">{reg ? reg.tiempo_carga_hrs : "—"}</TableCell>
                          <TableCell className="text-xs">{reg ? reg.tiempo_descarga_hrs : "—"}</TableCell>
                          <TableCell className="text-xs">{reg ? reg.lead_time_hrs : "—"}</TableCell>
                          <TableCell className="text-xs">{reg ? reg.tiempo_retorno_hrs : "—"}</TableCell>
                          <TableCell className="text-xs font-semibold">{reg ? reg.tiempo_total_hrs : "—"}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => startEdit(v)}>
                              {reg ? "Editar" : "Registrar"}
                            </Button>
                          </TableCell>
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
