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
    queryKey: ["external", view, JSON.stringify(filters), limit, offset],
    queryFn: async () => {
      let query = supabase.from(view).select("*");

      // Apply filters
      if (filters) {
        for (const [key, condition] of Object.entries(filters)) {
          const col = key.includes("@") ? key.split("@")[0] : key;
          if (condition && typeof condition === "object" && "op" in condition) {
            const { op, value } = condition as FilterCondition;
            query = query.filter(col, op, value);
          } else {
            query = query.eq(col, condition as string | number);
          }
        }
      }

      if (limit) query = query.limit(limit);
      if (offset) query = query.range(offset, offset + (limit || 1000) - 1);

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return (data || []) as T[];
    },
    enabled,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: false,
  });
}
