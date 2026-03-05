import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useViajes } from "@/hooks/useViajes";
import { toast } from "@/hooks/use-toast";
import KpiCard from "@/components/KpiCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Save, Calculator, DollarSign, Loader2, Plus, Download, Upload, Pencil } from "lucide-react";
import * as XLSX from "xlsx";

interface ForecastRow {
  id: string;
  cliente_estandar: string;
  mes_proyeccion: string;
  lunes_clp: number;
  martes_clp: number;
  miercoles_clp: number;
  jueves_clp: number;
  viernes_clp: number;
  sabado_clp: number;
  monto_total_semanal: number;
  venta_base_proyectada: number;
  monto_extras: number;
  forecast_final_contractual: number;
  usuario_registro: string | null;
}

const DAYS = ["lunes_clp", "martes_clp", "miercoles_clp", "jueves_clp", "viernes_clp", "sabado_clp"] as const;
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_EXCEL_HEADERS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function countWeekdaysInMonth(year: number, month: number) {
  const counts = [0, 0, 0, 0, 0, 0];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow >= 1 && dow <= 6) counts[dow - 1]++;
  }
  return counts;
}

function getBusinessDays(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow >= 1 && dow <= 6) count++;
  }
  return count;
}

export default function ForecastContractualPage() {
  const { user } = useAuth();
  const { uniqueValues } = useViajes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rows, setRows] = useState<ForecastRow[]>([]);
  const [editData, setEditData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingClient, setAddingClient] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [montoExtrasGlobal, setMontoExtrasGlobal] = useState("0");

  const mesDate = `${selectedMonth}-01`;
  const [year, monthNum] = selectedMonth.split("-").map(Number);
  const weekdayCounts = useMemo(() => countWeekdaysInMonth(year, monthNum - 1), [year, monthNum]);
  const businessDays = useMemo(() => getBusinessDays(year, monthNum - 1), [year, monthNum]);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("r_forecast_contractual")
      .select("*")
      .eq("mes_proyeccion", mesDate)
      .order("cliente_estandar");
    if (!error && data) {
      setRows(data as ForecastRow[]);
      const edit: Record<string, Record<string, string>> = {};
      for (const r of data as ForecastRow[]) {
        edit[r.cliente_estandar] = {
          ...Object.fromEntries(DAYS.map(d => [d, (r[d] || 0).toString()])),
        };
      }
      setEditData(edit);
      // Sum all monto_extras from rows to set the global extras
      const totalExtras = (data as ForecastRow[]).reduce((s, r) => s + (r.monto_extras || 0), 0);
      setMontoExtrasGlobal(totalExtras.toString());
      setEditMode(false);
      setHasUnsavedChanges(false);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, [mesDate]);

  // Determine if data already exists for this month (saved rows)
  const hasSavedData = rows.length > 0;

  const handleCellChange = (client: string, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [client]: { ...(prev[client] || {}), [field]: value },
    }));
    setHasUnsavedChanges(true);
  };

  const calcVentaBase = (client: string) => {
    const d = editData[client] || {};
    let total = 0;
    for (let i = 0; i < DAYS.length; i++) {
      total += (parseFloat(d[DAYS[i]] || "0") || 0) * weekdayCounts[i];
    }
    return Math.round(total);
  };

  const calcForecast = (client: string) => {
    return calcVentaBase(client);
  };

  // ── Save All ──
  const handleSaveAll = async () => {
    setSaving(true);
    const extras = parseFloat(montoExtrasGlobal || "0") || 0;
    const payloads = allClients.map((client, index) => {
      const d = editData[client] || {};
      const ventaBase = calcVentaBase(client);
      // Store the global extras only on the first client row for persistence
      const clientExtras = index === 0 ? extras : 0;
      return {
        cliente_estandar: client,
        mes_proyeccion: mesDate,
        lunes_clp: parseFloat(d.lunes_clp || "0") || 0,
        martes_clp: parseFloat(d.martes_clp || "0") || 0,
        miercoles_clp: parseFloat(d.miercoles_clp || "0") || 0,
        jueves_clp: parseFloat(d.jueves_clp || "0") || 0,
        viernes_clp: parseFloat(d.viernes_clp || "0") || 0,
        sabado_clp: parseFloat(d.sabado_clp || "0") || 0,
        venta_base_proyectada: ventaBase,
        monto_extras: clientExtras,
        forecast_final_contractual: ventaBase,
        usuario_registro: user?.email || "",
        actualizado_el: new Date().toISOString(),
      };
    });

    console.log('PAYLOAD FORECAST:', JSON.stringify(payloads));
    const { error } = await supabase
      .from("r_forecast_contractual")
      .upsert(payloads, { onConflict: "cliente_estandar,mes_proyeccion" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Guardado", description: `${payloads.length} registros actualizados para ${selectedMonth}.` });
      fetchRows();
    }
    setSaving(false);
  };

  const handleAddClient = () => {
    if (!addingClient) return;
    if (editData[addingClient]) { toast({ title: "Ya existe", variant: "destructive" }); return; }
    setEditData(prev => ({
      ...prev,
      [addingClient]: Object.fromEntries(DAYS.map(d => [d, "0"])),
    }));
    setAddingClient("");
    setHasUnsavedChanges(true);
    if (!editMode) setEditMode(true);
  };

  const allClients = useMemo(() => {
    const set = new Set([...Object.keys(editData), ...rows.map(r => r.cliente_estandar)]);
    return [...set].sort();
  }, [editData, rows]);

  const formatCLP = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`;

  const totalVentaBase = allClients.reduce((s, c) => s + calcVentaBase(c), 0);
  const extrasGlobal = parseFloat(montoExtrasGlobal || "0") || 0;
  const totalForecast = totalVentaBase + Math.round(extrasGlobal);

  const months = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    for (let i = -3; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return result;
  }, []);

  // ── Download Excel Template ──
  const handleDownloadTemplate = () => {
    const clients = uniqueValues.clientes.sort();
    const wsData = [
      ["Cliente", ...DAY_EXCEL_HEADERS],
      ...clients.map(c => {
        const existing = editData[c];
        if (existing) {
          return [c, ...DAYS.map(d => parseFloat(existing[d] || "0") || 0)];
        }
        return [c, 0, 0, 0, 0, 0, 0];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Set column widths
    ws["!cols"] = [{ wch: 30 }, ...Array(6).fill({ wch: 14 })];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Forecast");
    XLSX.writeFile(wb, `Forecast_Contractual_${selectedMonth}.xlsx`);
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

        const newEdit: Record<string, Record<string, string>> = { ...editData };
        let imported = 0;

        for (const row of jsonData) {
          const client = (row["Cliente"] || "").toString().trim();
          if (!client) continue;
          newEdit[client] = {
            lunes_clp: (row["Lunes"] ?? 0).toString(),
            martes_clp: (row["Martes"] ?? 0).toString(),
            miercoles_clp: (row["Miércoles"] ?? row["Miercoles"] ?? 0).toString(),
            jueves_clp: (row["Jueves"] ?? 0).toString(),
            viernes_clp: (row["Viernes"] ?? 0).toString(),
            sabado_clp: (row["Sábado"] ?? row["Sabado"] ?? 0).toString(),
          };
          imported++;
        }

        setEditData(newEdit);
        setHasUnsavedChanges(true);
        if (!editMode) setEditMode(true);
        toast({ title: "Importado", description: `${imported} clientes cargados desde Excel. Presiona Guardar Todo para confirmar.` });
      } catch {
        toast({ title: "Error", description: "No se pudo leer el archivo Excel.", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Whether inputs are editable
  const isEditable = !hasSavedData || editMode;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Forecast <span className="text-primary">Contractual</span></h1>
          <p className="text-sm text-muted-foreground">Matriz de registro — N Clientes × Días (Lun-Sáb)</p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard title="Venta Base Total" value={formatCLP(totalVentaBase)} icon={<TrendingUp className="w-5 h-5" />} subtitle={selectedMonth} />
        <KpiCard title="Monto Extras" value={formatCLP(extrasGlobal)} icon={<DollarSign className="w-5 h-5" />} subtitle="Acumulado" />
        <KpiCard title="Forecast Total" value={formatCLP(totalForecast)} icon={<DollarSign className="w-5 h-5" />} subtitle="Base + Extras" />
        <KpiCard title="Clientes / Días Hábiles" value={`${allClients.length} / ${businessDays}`} icon={<Calculator className="w-5 h-5" />} subtitle={`${selectedMonth} (Lun-Sáb)`} />
      </div>

      {/* Monto Extras Global */}
      <div className="card-executive p-4 flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase font-semibold">Monto Extras (acumulado mensual)</label>
          {isEditable ? (
            <Input
              className="h-8 w-48 text-xs"
              type="number"
              value={montoExtrasGlobal}
              onChange={(e) => { setMontoExtrasGlobal(e.target.value); setHasUnsavedChanges(true); }}
              placeholder="0"
            />
          ) : (
            <p className="text-sm font-semibold text-primary">{formatCLP(extrasGlobal)}</p>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground pb-1">Este monto se suma al total de venta base para calcular el Forecast Final.</p>
      </div>

      {/* Actions bar */}
      <div className="card-executive p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Agregar Cliente</label>
          <Select value={addingClient} onValueChange={setAddingClient}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              {uniqueValues.clientes.filter(c => !editData[c]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-8" onClick={handleAddClient} disabled={!addingClient}>
          <Plus className="w-3 h-3 mr-1" /> Agregar
        </Button>

        <div className="border-l border-border h-6 mx-1" />

        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleDownloadTemplate}>
          <Download className="w-3 h-3 mr-1" /> Descargar Plantilla
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-3 h-3 mr-1" /> Cargar Excel
        </Button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUploadExcel} />

        {hasSavedData && !editMode && (
          <>
            <div className="border-l border-border h-6 mx-1" />
            <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => setEditMode(true)}>
              <Pencil className="w-3 h-3 mr-1" /> Editar
            </Button>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <div className="card-executive p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Matriz de Forecast</h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Ingrese el monto diario por cliente. Ocurrencias: {DAY_LABELS.map((d, i) => `${d}=${weekdayCounts[i]}`).join(", ")}
              </p>
            </div>
            {isEditable && allClients.length > 0 && (
              <Button size="sm" className="h-8 text-xs px-4" onClick={handleSaveAll} disabled={saving}>
                {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                Guardar Todo
              </Button>
            )}
          </div>

          {hasUnsavedChanges && (
            <div className="bg-warning/10 border border-warning/30 rounded-md px-3 py-1.5 mb-3">
              <p className="text-[10px] text-warning font-medium">⚠ Hay cambios sin guardar. Presiona "Guardar Todo" para confirmar.</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs min-w-[120px]">Cliente</TableHead>
                  {DAY_LABELS.map(d => <TableHead key={d} className="text-xs text-center">{d}</TableHead>)}
                  <TableHead className="text-xs text-center">Semanal</TableHead>
                  <TableHead className="text-xs text-center">Venta Base</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allClients.map(client => {
                  const d = editData[client] || {};
                  const semanal = DAYS.reduce((s, day) => s + (parseFloat(d[day] || "0") || 0), 0);
                  const ventaBase = calcVentaBase(client);

                  return (
                    <TableRow key={client}>
                      <TableCell className="text-xs font-medium">{client}</TableCell>
                      {DAYS.map(day => (
                        <TableCell key={day}>
                          {isEditable ? (
                            <Input
                              className="h-7 w-20 text-xs text-center"
                              type="number"
                              value={d[day] || "0"}
                              onChange={(e) => handleCellChange(client, day, e.target.value)}
                            />
                          ) : (
                            <span className="text-xs font-mono">{formatCLP(parseFloat(d[day] || "0") || 0)}</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-xs text-center font-mono">{formatCLP(semanal)}</TableCell>
                      <TableCell className="text-xs text-center font-semibold text-electric-blue">{formatCLP(ventaBase)}</TableCell>
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
