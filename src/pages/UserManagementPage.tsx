import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus, Shield, Users } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRow {
  id: string;
  nombre: string;
  email: string;
  rol: AppRole;
  activo: boolean;
  created_at: string;
}

export default function UserManagementPage() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<AppRole>("viewer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("config_usuarios")
      .select("id, nombre, email, rol, activo, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers((data as UserRow[]) || []);
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !apellido.trim() || !email.trim() || !clave.trim()) {
      toast({ title: "Error", description: "Todos los campos son obligatorios.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Create auth user via edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            email: email.trim(),
            password: clave,
            nombre: `${nombre.trim()} ${apellido.trim()}`,
            rol: tipoUsuario,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al crear usuario");
      }

      toast({ title: "Usuario creado", description: `${nombre} ${apellido} registrado exitosamente.` });
      setNombre("");
      setApellido("");
      setEmail("");
      setUsuario("");
      setClave("");
      setTipoUsuario("viewer");
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const rolLabel = (rol: AppRole) => {
    switch (rol) {
      case "admin": return "Admin";
      case "operador": return "Operador";
      case "viewer": return "Visualizador";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Gestión de Usuarios
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Crear y administrar usuarios de la plataforma</p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-6">
          <UserPlus className="w-5 h-5 text-primary" />
          CREAR USUARIO
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input id="apellido" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="correo@empresa.cl" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usuario">Usuario</Label>
              <Input id="usuario" placeholder="Nombre de usuario" value={usuario} onChange={e => setUsuario(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clave">Clave</Label>
              <div className="relative">
                <Input
                  id="clave"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={clave}
                  onChange={e => setClave(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo Usuario</Label>
              <Select value={tipoUsuario} onValueChange={v => setTipoUsuario(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="min-w-[160px]">
              {loading ? "Creando..." : "Guardar Usuario"}
            </Button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          Usuarios Registrados
        </h2>

        {loadingUsers ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              ) : (
                users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nombre || "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.rol === "admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {rolLabel(u.rol)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs ${u.activo ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"}`}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.created_at).toLocaleDateString("es-CL")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
