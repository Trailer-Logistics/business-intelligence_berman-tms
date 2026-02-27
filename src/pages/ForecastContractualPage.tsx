import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useViajes } from "@/hooks/useViajes";
import { toast } from "@/hooks/use-toast";
import KpiCard from "@/components/KpiCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Save, Calculator, DollarSign, Loader2, Plus } from "lucide-react";

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

function countWeekdaysInMonth(year: number, month: number) {
  const counts = [0, 0, 0, 0, 0, 0]; // Mon-Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay(); // 0=Sun
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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rows, setRows] = useState<ForecastRow[]>([]);
  const [editData, setEditData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingClient, setAddingClient] = useState("");

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
          monto_extras: (r.monto_extras || 0).toString(),
        };
      }
      setEditData(edit);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, [mesDate]);

  const handleCellChange = (client: string, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [client]: { ...(prev[client] || {}), [field]: value },
    }));
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
    const extras = parseFloat(editData[client]?.monto_extras || "0") || 0;
    return calcVentaBase(client) + Math.round(extras);
  };

  const handleSave = async (client: string) => {
    setSaving(true);
    const d = editData[client] || {};
    const ventaBase = calcVentaBase(client);
    const extras = parseFloat(d.monto_extras || "0") || 0;

    const payload = {
      cliente_estandar: client,
      mes_proyeccion: mesDate,
      lunes_clp: parseFloat(d.lunes_clp || "0") || 0,
      martes_clp: parseFloat(d.martes_clp || "0") || 0,
      miercoles_clp: parseFloat(d.miercoles_clp || "0") || 0,
      jueves_clp: parseFloat(d.jueves_clp || "0") || 0,
      viernes_clp: parseFloat(d.viernes_clp || "0") || 0,
      sabado_clp: parseFloat(d.sabado_clp || "0") || 0,
      venta_base_proyectada: ventaBase,
      monto_extras: extras,
      forecast_final_contractual: ventaBase + Math.round(extras),
      usuario_registro: user?.email || "",
      actualizado_el: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("r_forecast_contractual")
      .upsert(payload, { onConflict: "cliente_estandar,mes_proyeccion" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Guardado", description: `Forecast ${client} actualizado.` });
      fetchRows();
    }
    setSaving(false);
  };

  const handleAddClient = () => {
    if (!addingClient) return;
    if (editData[addingClient]) { toast({ title: "Ya existe", variant: "destructive" }); return; }
    setEditData(prev => ({
      ...prev,
      [addingClient]: Object.fromEntries([...DAYS.map(d => [d, "0"]), ["monto_extras", "0"]]),
    }));
    setAddingClient("");
  };

  const allClients = useMemo(() => {
    const set = new Set([...Object.keys(editData), ...rows.map(r => r.cliente_estandar)]);
    return [...set].sort();
  }, [editData, rows]);

  const formatCLP = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`;

  const totalForecast = allClients.reduce((s, c) => s + calcForecast(c), 0);

  const months = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    for (let i = -3; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return result;
  }, []);

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Forecast Total" value={formatCLP(totalForecast)} icon={<DollarSign className="w-5 h-5" />} subtitle={selectedMonth} />
        <KpiCard title="Clientes Registrados" value={allClients.length.toString()} icon={<TrendingUp className="w-5 h-5" />} subtitle="En matriz" />
        <KpiCard title="Días Hábiles" value={businessDays.toString()} icon={<Calculator className="w-5 h-5" />} subtitle={`${selectedMonth} (Lun-Sáb)`} />
      </div>

      {/* Add client */}
      <div className="card-executive p-4 flex items-end gap-3">
        <div className="flex-1 space-y-1">
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <div className="card-executive p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Matriz de Forecast</h3>
          <p className="text-[10px] text-muted-foreground mb-4">
            Ingrese el monto diario por cliente. La Venta Base se calcula como (Monto × Ocurrencias del día en el mes).
            Ocurrencias: {DAY_LABELS.map((d, i) => `${d}=${weekdayCounts[i]}`).join(", ")}
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs min-w-[120px]">Cliente</TableHead>
                  {DAY_LABELS.map(d => <TableHead key={d} className="text-xs text-center">{d}</TableHead>)}
                  <TableHead className="text-xs text-center">Semanal</TableHead>
                  <TableHead className="text-xs text-center">Venta Base</TableHead>
                  <TableHead className="text-xs text-center">Extras</TableHead>
                  <TableHead className="text-xs text-center">Forecast</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allClients.map(client => {
                  const d = editData[client] || {};
                  const semanal = DAYS.reduce((s, day) => s + (parseFloat(d[day] || "0") || 0), 0);
                  const ventaBase = calcVentaBase(client);
                  const forecast = calcForecast(client);

                  return (
                    <TableRow key={client}>
                      <TableCell className="text-xs font-medium">{client}</TableCell>
                      {DAYS.map(day => (
                        <TableCell key={day}>
                          <Input
                            className="h-7 w-20 text-xs text-center"
                            type="number"
                            value={d[day] || "0"}
                            onChange={(e) => handleCellChange(client, day, e.target.value)}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-xs text-center font-mono">{formatCLP(semanal)}</TableCell>
                      <TableCell className="text-xs text-center font-semibold text-electric-blue">{formatCLP(ventaBase)}</TableCell>
                      <TableCell>
                        <Input
                          className="h-7 w-20 text-xs text-center"
                          type="number"
                          value={d.monto_extras || "0"}
                          onChange={(e) => handleCellChange(client, "monto_extras", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-center font-bold text-primary">{formatCLP(forecast)}</TableCell>
                      <TableCell>
                        <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleSave(client)} disabled={saving}>
                          <Save className="w-3 h-3" />
                        </Button>
                      </TableCell>
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
