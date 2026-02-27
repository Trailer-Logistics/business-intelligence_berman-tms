import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type ViewName = "v_viajes_inteligentes" | "v_alertas_flota" | "v_alertas_conductores";

interface FilterCondition {
  op: string;
  value: any;
}

type Filters = Record<string, string | number | FilterCondition>;

interface UseExternalDataOptions {
  view: ViewName;
  filters?: Filters;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useExternalData<T = any>({
  view,
  filters,
  limit = 1000,
  offset,
  enabled = true,
}: UseExternalDataOptions) {
  return useQuery<T[]>({
    queryKey: ["external", view, filters, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("external-query", {
        body: { view, filters, limit, offset },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data.data as T[];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
