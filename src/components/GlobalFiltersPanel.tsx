import { useState, useCallback } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { useViajes } from "@/hooks/useViajes";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { CalendarIcon, SlidersHorizontal, RotateCcw } from "lucide-react";
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

  const closeDateFrom = useCallback((d: Date | undefined) => {
    if (d) setFilters({ dateFrom: format(d, "yyyy-MM-dd") });
    setTimeout(() => setDateFromOpen(false), 0);
  }, [setFilters]);

  const closeDateTo = useCallback((d: Date | undefined) => {
    if (d) setFilters({ dateTo: format(d, "yyyy-MM-dd") });
    setTimeout(() => setDateToOpen(false), 0);
  }, [setFilters]);

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

  const activeCount = [
    filters.estadoViaje.length > 0,
    filters.tipoOperacion.length > 0,
    filters.tracto.length > 0,
    filters.rampla.length > 0,
    filters.codigoCarga.length > 0,
    filters.sentidoViaje !== "all",
  ].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-[hsl(222,25%,15%)] p-4 mb-2" style={{ background: "linear-gradient(145deg, hsl(222 40% 9%), hsl(222 40% 10.5%))" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[hsl(191,100%,50%,0.1)]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[hsl(191,100%,50%)]" strokeWidth={1.8} />
          </div>
          <span className="text-xs font-semibold text-foreground tracking-wide">Filtros</span>
          {activeCount > 0 && (
            <span className="text-[10px] font-mono text-[hsl(191,100%,50%)] bg-[hsl(191,100%,50%,0.1)] px-2 py-0.5 rounded-md">
              {activeCount} activos
            </span>
          )}
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-[hsl(191,100%,50%)] transition-colors px-2.5 py-1 rounded-lg hover:bg-[hsl(191,100%,50%,0.06)]"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Date From */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Desde</label>
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex h-8 w-full items-center gap-1.5 rounded-lg border border-[hsl(222,25%,18%)] bg-[hsl(222,30%,11%)] px-2.5 text-xs hover:border-[hsl(191,100%,50%,0.3)] transition-colors",
                !dateFromValue && "text-muted-foreground"
              )}>
                <CalendarIcon className="h-3 w-3 text-muted-foreground/60" />
                {dateFromValue ? format(dateFromValue, "dd/MM/yy") : "Desde"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFromValue} onSelect={closeDateFrom} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Hasta</label>
          <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex h-8 w-full items-center gap-1.5 rounded-lg border border-[hsl(222,25%,18%)] bg-[hsl(222,30%,11%)] px-2.5 text-xs hover:border-[hsl(191,100%,50%,0.3)] transition-colors",
                !dateToValue && "text-muted-foreground"
              )}>
                <CalendarIcon className="h-3 w-3 text-muted-foreground/60" />
                {dateToValue ? format(dateToValue, "dd/MM/yy") : "Hasta"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateToValue} onSelect={closeDateTo} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Estado</label>
          <MultiSelectDropdown options={uniqueValues.estados} selected={filters.estadoViaje} onChange={(v) => setFilters({ estadoViaje: v })} placeholder="Todos" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Operacion</label>
          <MultiSelectDropdown options={uniqueValues.operaciones} selected={filters.tipoOperacion} onChange={(v) => setFilters({ tipoOperacion: v })} placeholder="Todos" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Tracto</label>
          <MultiSelectDropdown options={uniqueValues.tractos} selected={filters.tracto} onChange={(v) => setFilters({ tracto: v })} placeholder="Todos" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Rampla</label>
          <MultiSelectDropdown options={uniqueValues.ramplas} selected={filters.rampla} onChange={(v) => setFilters({ rampla: v })} placeholder="Todos" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Carga</label>
          <MultiSelectDropdown options={uniqueValues.cargas} selected={filters.codigoCarga} onChange={(v) => setFilters({ codigoCarga: v })} placeholder="Todos" />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">Sentido</label>
          <Select value={filters.sentidoViaje} onValueChange={(v) => setFilters({ sentidoViaje: v })}>
            <SelectTrigger className="h-8 text-xs rounded-lg border-[hsl(222,25%,18%)] bg-[hsl(222,30%,11%)] hover:border-[hsl(191,100%,50%,0.3)] transition-colors">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              {SENTIDO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
