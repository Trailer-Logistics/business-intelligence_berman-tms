import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const email = "alexis.casas@trailerlogistics.cl";
  const password = "alana1905";

  // Check if user already exists
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existing?.users?.find((u) => u.email === email);

  if (existingUser) {
    // Update role to admin
    await supabaseAdmin
      .from("config_usuarios")
      .update({ rol: "admin", nombre: "Alex", activo: true })
      .eq("user_id", existingUser.id);

    return new Response(JSON.stringify({ message: "Admin already exists, role updated" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre: "Alex" },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  // Set admin role
  await supabaseAdmin
    .from("config_usuarios")
    .update({ rol: "admin", nombre: "Alex" })
    .eq("user_id", data.user.id);

  return new Response(JSON.stringify({ message: "Admin created", user_id: data.user.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
