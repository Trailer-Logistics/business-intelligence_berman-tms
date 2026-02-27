import { useState, useMemo, createContext, useContext, ReactNode } from "react";
import { useExternalData } from "@/hooks/useExternalData";

interface Viaje {
  viaje_id: number;
  nro_viaje: string;
  cliente_estandar: string;
  estado_viaje_estandar: string;
  terminado: string;
  km_recorridos: number;
  tarifa_venta: number;
  tarifa_costo: number;
  ts_entrada_origen_plan: string | null;
  ts_entrada_origen_gps: string | null;
  fecha_salida_origen: string | null;
  fecha_creacion_viaje: string | null;
  tipo_operacion: string;
  unidad_negocio: string;
  patente_tracto: string;
  patente_rampla: string;
  descripcion_carga: string;
  conductor_principal: string | null;
  nombre_ruta: string | null;
  nro_guia: string;
  estado_pod_detalle: string;
  estado_prefactura: string;
  nro_factura: string | null;
  fecha_prefactura: string | null;
}

interface GlobalFilters {
  dateFrom: string;
  dateTo: string;
  estadoViaje: string[];
  tipoOperacion: string[];
  tracto: string[];
  rampla: string[];
  codigoCarga: string[];
  sentidoViaje: string; // ida | retorno | admin | all
}

interface ViajesContextType {
  viajes: Viaje[];
  filteredViajes: Viaje[];
  isLoading: boolean;
  filters: GlobalFilters;
  setFilters: (f: Partial<GlobalFilters>) => void;
  uniqueValues: {
    estados: string[];
    operaciones: string[];
    tractos: string[];
    ramplas: string[];
    cargas: string[];
    clientes: string[];
  };
}

const defaultFilters: GlobalFilters = {
  dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  dateTo: new Date().toISOString().slice(0, 10),
  estadoViaje: [],
  tipoOperacion: [],
  tracto: [],
  rampla: [],
  codigoCarga: [],
  sentidoViaje: "all",
};

const ViajesContext = createContext<ViajesContextType | undefined>(undefined);

export function ViajesProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<GlobalFilters>(defaultFilters);

  const queryFilters = useMemo(() => {
    const f: Record<string, any> = {};
    if (filters.dateFrom) f.fecha_salida_origen = { op: "gte", value: filters.dateFrom };
    if (filters.dateTo) {
      // Use a separate key for the upper bound
      f["fecha_salida_origen@lte"] = { op: "lte", value: filters.dateTo, column: "fecha_salida_origen" };
    }
    return f;
  }, [filters.dateFrom, filters.dateTo]);

  const { data: viajes = [], isLoading } = useExternalData<Viaje>({
    view: "v_viajes_inteligentes",
    filters: queryFilters,
    limit: 50000,
  });

  const setFilters = (partial: Partial<GlobalFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  };

  const uniqueValues = useMemo(() => {
    const estados = new Set<string>();
    const operaciones = new Set<string>();
    const tractos = new Set<string>();
    const ramplas = new Set<string>();
    const cargas = new Set<string>();
    const clientes = new Set<string>();

    for (const v of viajes) {
      if (v.estado_viaje_estandar) estados.add(v.estado_viaje_estandar);
      if (v.tipo_operacion) operaciones.add(v.tipo_operacion);
      if (v.patente_tracto && v.patente_tracto !== "S/I") tractos.add(v.patente_tracto);
      if (v.patente_rampla && v.patente_rampla !== "S/I") ramplas.add(v.patente_rampla);
      if (v.descripcion_carga) cargas.add(v.descripcion_carga);
      if (v.cliente_estandar) clientes.add(v.cliente_estandar);
    }

    return {
      estados: [...estados].sort(),
      operaciones: [...operaciones].sort(),
      tractos: [...tractos].sort(),
      ramplas: [...ramplas].sort(),
      cargas: [...cargas].sort(),
      clientes: [...clientes].sort(),
    };
  }, [viajes]);

  const filteredViajes = useMemo(() => {
    return viajes.filter((v) => {
      if (v.fecha_salida_origen) {
        const d = v.fecha_salida_origen;
        if (filters.dateFrom && d < filters.dateFrom) return false;
        if (filters.dateTo && d > filters.dateTo) return false;
      } else {
        return false;
      }

      if (filters.estadoViaje.length > 0 && !filters.estadoViaje.includes(v.estado_viaje_estandar)) return false;
      if (filters.tipoOperacion.length > 0 && !filters.tipoOperacion.includes(v.tipo_operacion)) return false;
      if (filters.tracto.length > 0 && !filters.tracto.includes(v.patente_tracto)) return false;
      if (filters.rampla.length > 0 && !filters.rampla.includes(v.patente_rampla)) return false;
      if (filters.codigoCarga.length > 0 && !filters.codigoCarga.includes(v.descripcion_carga)) return false;

      return true;
    });
  }, [viajes, filters]);

  return (
    <ViajesContext.Provider value={{ viajes, filteredViajes, isLoading, filters, setFilters, uniqueValues }}>
      {children}
    </ViajesContext.Provider>
  );
}

export function useViajes() {
  const ctx = useContext(ViajesContext);
  if (!ctx) throw new Error("useViajes must be used within ViajesProvider");
  return ctx;
}

export type { Viaje, GlobalFilters };
