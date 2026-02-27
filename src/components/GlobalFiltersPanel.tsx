import { useState, useCallback } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { useViajes } from "@/hooks/useViajes";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { CalendarIcon, Filter, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const SENTIDO_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "ida", label: "Ida" },
  { value: "retorno", label: "Retorno" },
  { value: "admin", label: "Admin" },
];

export default function GlobalFiltersPanel() {
  const { filters, setFilters, uniqueValues } = useViajes();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const reset = () => {
    setFilters({
      dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      dateTo: new Date().toISOString().slice(0, 10),
      estadoViaje: [],
      tipoOperacion: [],
      tracto: [],
      rampla: [],
      codigoCarga: [],
      sentidoViaje: "all",
    });
  };

  const dateFromValue = filters.dateFrom ? parse(filters.dateFrom, "yyyy-MM-dd", new Date()) : undefined;
  const dateToValue = filters.dateTo ? parse(filters.dateTo, "yyyy-MM-dd", new Date()) : undefined;

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
        {/* Date From */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Desde</label>
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex h-8 w-full items-center gap-1 rounded-md border border-input bg-background px-2 text-xs",
                !dateFromValue && "text-muted-foreground"
              )}>
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                {dateFromValue ? format(dateFromValue, "dd/MM/yy") : "Desde"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFromValue}
                onSelect={(d) => {
                  if (d) setFilters({ dateFrom: format(d, "yyyy-MM-dd") });
                  setDateFromOpen(false);
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Hasta</label>
          <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex h-8 w-full items-center gap-1 rounded-md border border-input bg-background px-2 text-xs",
                !dateToValue && "text-muted-foreground"
              )}>
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                {dateToValue ? format(dateToValue, "dd/MM/yy") : "Hasta"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateToValue}
                onSelect={(d) => {
                  if (d) setFilters({ dateTo: format(d, "yyyy-MM-dd") });
                  setDateToOpen(false);
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Estado Viaje - Multi */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Estado</label>
          <MultiSelectDropdown
            options={uniqueValues.estados}
            selected={filters.estadoViaje}
            onChange={(v) => setFilters({ estadoViaje: v })}
            placeholder="Todos"
          />
        </div>

        {/* Tipo Operación - Multi */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Operación</label>
          <MultiSelectDropdown
            options={uniqueValues.operaciones}
            selected={filters.tipoOperacion}
            onChange={(v) => setFilters({ tipoOperacion: v })}
            placeholder="Todos"
          />
        </div>

        {/* Tracto - Multi */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Tracto</label>
          <MultiSelectDropdown
            options={uniqueValues.tractos}
            selected={filters.tracto}
            onChange={(v) => setFilters({ tracto: v })}
            placeholder="Todos"
          />
        </div>

        {/* Rampla - Multi */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Rampla</label>
          <MultiSelectDropdown
            options={uniqueValues.ramplas}
            selected={filters.rampla}
            onChange={(v) => setFilters({ rampla: v })}
            placeholder="Todos"
          />
        </div>

        {/* Código Carga - Multi */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Carga</label>
          <MultiSelectDropdown
            options={uniqueValues.cargas}
            selected={filters.codigoCarga}
            onChange={(v) => setFilters({ codigoCarga: v })}
            placeholder="Todos"
          />
        </div>

        {/* Sentido - Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Sentido</label>
          <Select value={filters.sentidoViaje} onValueChange={(v) => setFilters({ sentidoViaje: v })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              {SENTIDO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className={cn(
                    opt.value === "ida" && "text-primary",
                    opt.value === "retorno" && "text-[hsl(var(--violet-accent))]"
                  )}>
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
