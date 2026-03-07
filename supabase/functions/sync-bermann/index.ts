import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Secrets (stored in Supabase Dashboard > Edge Functions > Secrets) ───
// BERMANN_AUTH_KEY        → API auth key
// BERMANN_USUARIO         → Login username
// BERMANN_CLAVE           → Login password
// BERMANN_SUBDOMINIO      → Tenant subdomain
// SUPABASE_URL            → Auto-injected
// SUPABASE_SERVICE_ROLE_KEY → Auto-injected

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BERMANN_BASE = "https://appmovil.bermanntms.cl";

// ─── Bermann Auth ───────────────────────────────────────────────────────

async function obtenerToken(): Promise<string | null> {
  const authKey = Deno.env.get("BERMANN_AUTH_KEY");
  const usuario = Deno.env.get("BERMANN_USUARIO");
  const clave = Deno.env.get("BERMANN_CLAVE");
  const subdominio = Deno.env.get("BERMANN_SUBDOMINIO");

  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${BERMANN_BASE}/login/`, {
        method: "POST",
        headers: { Authorization: authKey!, "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, clave, subdominio }),
      });
      const data = await res.json();
      if (res.ok && data?.data?.token) return data.data.token;
      console.warn(`Login attempt ${i + 1}: ${data?.message || "no token"}`);
    } catch (e) {
      console.warn(`Login attempt ${i + 1} error:`, e);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

// ─── Bermann API fetch with pagination ──────────────────────────────────

async function fetchBermann(
  token: string,
  url: string,
  params: Record<string, string>,
  maxPages = 50
): Promise<any[]> {
  const all: any[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const qs = new URLSearchParams({ ...params, page: String(page), limit: "100" });
    const res = await fetch(`${url}?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      console.warn("Token expired mid-fetch");
      break;
    }
    if (!res.ok) {
      console.warn(`API ${res.status} on page ${page}`);
      break;
    }

    const data = await res.json();
    const registros = data?.data || [];
    if (registros.length === 0) break;

    all.push(...registros);

    // If we got less than 100, it's the last page
    if (registros.length < 100) break;
  }

  return all;
}

// ─── Transform Bermann records to Supabase format ───────────────────────

function buildPayload(tabla: string, registros: any[]): any[] {
  return registros
    .map((i: any) => {
      const id = i.id || i.viaje_id || i.rut || i.codigo;
      if (!id) return null;

      const row: any = { id, datos_completos: i, ultima_actualizacion: new Date().toISOString() };

      if (tabla === "b_viajes") {
        row.nro_viaje = i.nro_viaje;
        row.nro_guia = i.nro_guia;
        row.cliente = i.cliente;
        row.conductor_principal = i.conductor_principal;
        row.estado_viaje = i.estado_viaje;
        row.km_viaje = i.km_viaje || i.odometro_viaje;
        row.carga_id = i.carga_id || i.carga;
        row.estatus_viaje_id = i.estatus_viaje_id;
        const fecha = i.fecha || i.fecha_creacion;
        row.fecha_creacion = fecha ? String(fecha) : null;
        // Extract GPS timestamps for views
        const zonas = i.zonas || [];
        if (zonas[0]) {
          row.f_ent_orig_prog = zonas[0].fecha_entrada_planificada || null;
          row.f_ent_orig_gps = zonas[0].fecha_entrada_gps || null;
        }
        if (zonas[1]) {
          row.f_ent_dest_prog = zonas[1].fecha_entrada_planificada || null;
          row.f_ent_dest_gps = zonas[1].fecha_entrada_gps || null;
        }
      } else if (tabla === "b_finanzas_viaje") {
        row.monto = i.monto || i.total || 0;
      } else if (tabla === "b_conductores") {
        row.nombre = i.nombre || i.conductor_nombre;
        row.rut = i.rut;
        row.estado = i.estado;
      } else if (tabla === "b_vehiculos") {
        row.patente = i.patente;
        row.tipo_vehiculo = i.tipo_vehiculo;
        row.estado = i.estado;
      } else if (tabla === "b_clientes") {
        row.nombre = i.razon_social || i.nombre || i.cliente_nombre;
      } else if (tabla === "b_cargas") {
        row.codigo_carga = i.codigo || i.nombre;
        row.contenido_carga = i.descripcion || i.tipo;
        row.estado = i.estado;
      } else if (tabla === "b_rutas") {
        row.nombre = i.nombre || i.ruta_nombre || i.descripcion;
        row.nombre_ruta = row.nombre;
        row.estado = i.estado;
      } else if (tabla === "b_tipo_operacion") {
        row.nombre = i.nombre;
        row.estado = i.estado;
      } else if (tabla === "b_unidad_negocio") {
        row.nombre = i.nombre;
        row.estado = i.estado;
      } else if (tabla === "b_contratos") {
        row.nro_contrato = i.nro_contrato;
      } else if (tabla === "b_estado_pod") {
        row.nombre = i.nombre;
      } else if (tabla === "b_transportistas") {
        row.nombre = i.nombre || i.razon_social;
      }

      return row;
    })
    .filter(Boolean);
}

// ─── Upsert to Supabase ────────────────────────────────────────────────

async function upsertToSupabase(
  supabase: any,
  tabla: string,
  payload: any[]
): Promise<number> {
  if (payload.length === 0) return 0;

  // Batch in chunks of 500
  let total = 0;
  for (let i = 0; i < payload.length; i += 500) {
    const chunk = payload.slice(i, i + 500);
    const { error } = await supabase.from(tabla).upsert(chunk, {
      onConflict: "id",
      ignoreDuplicates: false,
    });
    if (error) {
      console.error(`Upsert ${tabla} chunk error:`, error.message);
    } else {
      total += chunk.length;
    }
  }
  return total;
}

// ─── Main sync logic ────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Optional: restrict to cron or admin
    // For cron via pg_cron/pg_net, no auth header — use a secret token instead
    const cronSecret = Deno.env.get("SYNC_CRON_SECRET");
    if (cronSecret) {
      const authHeader = req.headers.get("Authorization");
      const url = new URL(req.url);
      const tokenParam = url.searchParams.get("secret");
      if (authHeader !== `Bearer ${cronSecret}` && tokenParam !== cronSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Parse optional body for mode override
    let mode = "incremental"; // default
    let daysBack = 3;
    try {
      const body = await req.json();
      if (body?.mode === "full") mode = "full";
      if (body?.daysBack) daysBack = Number(body.daysBack);
    } catch {
      // No body = default incremental
    }

    console.log(`Sync mode: ${mode}, daysBack: ${daysBack}`);

    // ── Authenticate to Bermann ──
    const token = await obtenerToken();
    if (!token) {
      return new Response(JSON.stringify({ error: "Could not authenticate to Bermann" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Supabase client (service_role for writes) ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const subdominio = Deno.env.get("BERMANN_SUBDOMINIO") || "trailerlogistics";
    const hoy = new Date().toISOString().split("T")[0];

    // Calculate start date for incremental
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split("T")[0];

    const results: Record<string, number> = {};

    // ── 1. TRANSACTIONAL TABLES (incremental by date) ──
    const transactionalParams =
      mode === "full"
        ? { subdominio, starDate: "2024-01-01", endDate: hoy, typeRate: "1" }
        : { subdominio, starDate: startDateStr, endDate: hoy, typeRate: "1" };

    const maxPagesTransactional = mode === "full" ? 400 : 10;

    // b_viajes
    console.log(`Fetching b_viajes (${mode}, from ${transactionalParams.starDate})...`);
    const viajes = await fetchBermann(token, `${BERMANN_BASE}/trip/gettrips`, transactionalParams, maxPagesTransactional);
    results.b_viajes = await upsertToSupabase(supabase, "b_viajes", buildPayload("b_viajes", viajes));
    console.log(`b_viajes: ${results.b_viajes} synced`);

    // b_finanzas_viaje
    console.log(`Fetching b_finanzas_viaje...`);
    const finanzas = await fetchBermann(token, `${BERMANN_BASE}/trip/gettripfinances`, transactionalParams, maxPagesTransactional);
    results.b_finanzas_viaje = await upsertToSupabase(supabase, "b_finanzas_viaje", buildPayload("b_finanzas_viaje", finanzas));
    console.log(`b_finanzas_viaje: ${results.b_finanzas_viaje} synced`);

    // ── 2. MASTER TABLES (always full — they're tiny) ──
    const masterParams = { subdominio };

    const masters: [string, string, number][] = [
      ["b_clientes", `${BERMANN_BASE}/client`, 5],
      ["b_conductores", `${BERMANN_BASE}/driver`, 5],
      ["b_vehiculos", `${BERMANN_BASE}/vehicle`, 10],
      ["b_cargas", `${BERMANN_BASE}/charge`, 5],
      ["b_rutas", `${BERMANN_BASE}/route`, 30],
    ];

    for (const [tabla, url, maxPages] of masters) {
      console.log(`Fetching ${tabla}...`);
      const data = await fetchBermann(token, url, masterParams, maxPages);
      results[tabla] = await upsertToSupabase(supabase, tabla, buildPayload(tabla, data));
      console.log(`${tabla}: ${results[tabla]} synced`);
    }

    // ── 3. CATALOG TABLES (try if endpoints exist) ──
    const catalogs: [string, string][] = [
      ["b_tipo_operacion", `${BERMANN_BASE}/typeoperation`],
      ["b_unidad_negocio", `${BERMANN_BASE}/businessunit`],
      ["b_transportistas", `${BERMANN_BASE}/transporter`],
      ["b_estado_pod", `${BERMANN_BASE}/podstatus`],
      ["b_contratos", `${BERMANN_BASE}/contract`],
    ];

    for (const [tabla, url] of catalogs) {
      try {
        console.log(`Fetching ${tabla}...`);
        const data = await fetchBermann(token, url, masterParams, 5);
        if (data.length > 0) {
          results[tabla] = await upsertToSupabase(supabase, tabla, buildPayload(tabla, data));
          console.log(`${tabla}: ${results[tabla]} synced`);
        } else {
          results[tabla] = 0;
          console.log(`${tabla}: no data (endpoint may not exist)`);
        }
      } catch {
        results[tabla] = 0;
        console.log(`${tabla}: skipped (endpoint error)`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const summary = {
      mode,
      daysBack: mode === "full" ? "all" : daysBack,
      elapsed_seconds: elapsed,
      results,
      timestamp: new Date().toISOString(),
    };

    console.log("Sync complete:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Sync error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
