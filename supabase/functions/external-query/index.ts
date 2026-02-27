import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_VIEWS = [
  "v_viajes_inteligentes",
  "v_alertas_flota",
  "v_alertas_conductores",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller against the LOCAL Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const localUrl = Deno.env.get("SUPABASE_URL");
    const localAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!localUrl || !localAnonKey) {
      throw new Error("Local Supabase env vars not configured");
    }

    const localSupabase = createClient(localUrl, localAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await localSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { view, filters, limit, offset } = await req.json();

    if (!view || !ALLOWED_VIEWS.includes(view)) {
      return new Response(
        JSON.stringify({
          error: `Invalid view. Allowed: ${ALLOWED_VIEWS.join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Connect to EXTERNAL Supabase
    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (!extUrl || !extKey) {
      throw new Error("External Supabase credentials not configured");
    }

    const extSupabase = createClient(extUrl, extKey);

    // Build query
    let query = extSupabase.from(view).select("*");

    // Apply optional filters: { column: value } or { column: { op: "gte", value: "2024-01-01" } }
    if (filters && typeof filters === "object") {
      for (const [col, condition] of Object.entries(filters)) {
        if (condition && typeof condition === "object" && "op" in (condition as any)) {
          const { op, value } = condition as { op: string; value: any };
          query = query.filter(col, op, value);
        } else {
          query = query.eq(col, condition);
        }
      }
    }

    if (limit) query = query.limit(Number(limit));
    if (offset) query = query.range(Number(offset), Number(offset) + (Number(limit) || 1000) - 1);

    const { data, error } = await query;

    if (error) {
      console.error("External query error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data, count: data?.length ?? 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
