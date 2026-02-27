import { useViajes } from "@/hooks/useViajes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, RotateCcw } from "lucide-react";

const SENTIDO_OPTIONS = [
  { value: "all", label: "Todos", color: "text-foreground" },
  { value: "ida", label: "Ida", color: "text-primary" },
  { value: "retorno", label: "Retorno", color: "text-violet-accent" },
  { value: "admin", label: "Admin", color: "text-foreground" },
];

export default function GlobalFiltersPanel() {
  const { filters, setFilters, uniqueValues } = useViajes();

  const reset = () => {
    setFilters({
      dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      dateTo: new Date().toISOString().slice(0, 10),
      estadoViaje: "",
      tipoOperacion: "",
      tracto: "",
      rampla: "",
      codigoCarga: "",
      sentidoViaje: "all",
    });
  };

  return (
    <div className="card-executive p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Filtros Globales</span>
        <button onClick={reset} className="ml-auto text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Dates */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Desde</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ dateFrom: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Hasta</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ dateTo: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        {/* Estado Viaje */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Estado</label>
          <Select value={filters.estadoViaje || "all"} onValueChange={(v) => setFilters({ estadoViaje: v === "all" ? "" : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueValues.estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo Operación */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Operación</label>
          <Select value={filters.tipoOperacion || "all"} onValueChange={(v) => setFilters({ tipoOperacion: v === "all" ? "" : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueValues.operaciones.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tracto */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Tracto</label>
          <Select value={filters.tracto || "all"} onValueChange={(v) => setFilters({ tracto: v === "all" ? "" : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueValues.tractos.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Rampla */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Rampla</label>
          <Select value={filters.rampla || "all"} onValueChange={(v) => setFilters({ rampla: v === "all" ? "" : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueValues.ramplas.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Código Carga */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Carga</label>
          <Select value={filters.codigoCarga || "all"} onValueChange={(v) => setFilters({ codigoCarga: v === "all" ? "" : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueValues.cargas.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Sentido del Viaje */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Sentido</label>
          <div className="flex gap-1">
            {SENTIDO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilters({ sentidoViaje: opt.value })}
                className={`flex-1 px-1.5 py-1.5 text-[10px] rounded font-medium transition-all ${
                  filters.sentidoViaje === opt.value
                    ? opt.value === "ida" ? "bg-primary text-primary-foreground"
                      : opt.value === "retorno" ? "bg-violet-accent text-white"
                      : "bg-secondary text-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
