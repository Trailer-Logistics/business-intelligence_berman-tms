import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus, Shield, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

type AppRole = "admin" | "operador" | "viewer";

interface UserRow {
  id: string;
  nombre: string;
  email: string;
  rol: AppRole;
  activo: boolean;
  creado_at: string;
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
      .select("id, nombre, email, rol, activo, creado_at")
      .order("creado_at", { ascending: false });

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
      default: return rol || "—";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-[hsl(191,100%,50%)]" strokeWidth={1.8} />
          <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[0.15em]">User Management</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Gestion de <span className="text-[hsl(191,100%,50%)]">Usuarios</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Crear y administrar usuarios de la plataforma</p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl bg-white p-6"
        style={{ border: "1px solid #00D0FF" }}
      >
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 rounded-xl bg-[#00D0FF]/10">
            <UserPlus className="w-4 h-4 text-[#00D0FF]" strokeWidth={1.8} />
          </div>
          <h2 className="text-sm font-semibold text-black uppercase tracking-wider">Crear Usuario</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-[11px] text-black/60 uppercase tracking-wider">Nombre</Label>
              <Input id="nombre" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} className="rounded-xl bg-white border-black text-black placeholder:text-black/40 focus:border-[#00D0FF]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido" className="text-[11px] text-black/60 uppercase tracking-wider">Apellido</Label>
              <Input id="apellido" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} className="rounded-xl bg-white border-black text-black placeholder:text-black/40 focus:border-[#00D0FF]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[11px] text-black/60 uppercase tracking-wider">Email</Label>
              <Input id="email" type="email" placeholder="correo@empresa.cl" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl bg-white border-black text-black placeholder:text-black/40 focus:border-[#00D0FF]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="usuario" className="text-[11px] text-black/60 uppercase tracking-wider">Usuario</Label>
              <Input id="usuario" placeholder="Nombre de usuario" value={usuario} onChange={e => setUsuario(e.target.value)} className="rounded-xl bg-white border-black text-black placeholder:text-black/40 focus:border-[#00D0FF]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clave" className="text-[11px] text-black/60 uppercase tracking-wider">Clave</Label>
              <div className="relative">
                <Input
                  id="clave"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={clave}
                  onChange={e => setClave(e.target.value)}
                  className="rounded-xl bg-white border-black text-black placeholder:text-black/40 focus:border-[#00D0FF] pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-black/60 uppercase tracking-wider">Tipo Usuario</Label>
              <Select value={tipoUsuario} onValueChange={v => setTipoUsuario(v as AppRole)}>
                <SelectTrigger className="rounded-xl bg-white border-black text-black focus:border-[#00D0FF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[160px] rounded-xl font-semibold text-black"
              style={{ background: "#00D0FF" }}
            >
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creando...</span>
              ) : "Guardar Usuario"}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl bg-white p-6"
        style={{ border: "1px solid #00D0FF" }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-[#00D0FF]/10">
            <Users className="w-4 h-4 text-[#00D0FF]" strokeWidth={1.8} />
          </div>
          <h2 className="text-sm font-semibold text-black uppercase tracking-wider">Usuarios Registrados</h2>
          <span className="text-[10px] font-mono text-black/50 bg-gray-100 px-2 py-0.5 rounded-md ml-auto">
            {users.length} total
          </span>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[#00D0FF]/30 border-t-[#00D0FF] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider text-black/50 font-semibold">Nombre</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-black/50 font-semibold">Email</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-black/50 font-semibold">Rol</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-black/50 font-semibold">Estado</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-black/50 font-semibold">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-black/40 py-12">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(u => (
                    <TableRow key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-sm text-black">{u.nombre || "—"}</TableCell>
                      <TableCell className="text-sm text-black/60 font-mono">{u.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                          u.rol === "admin"
                            ? "bg-[#00D0FF]/10 text-[#00D0FF]"
                            : u.rol === "operador"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            u.rol === "admin" ? "bg-[#00D0FF]" : u.rol === "operador" ? "bg-purple-500" : "bg-gray-400"
                          }`} />
                          {rolLabel(u.rol)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                          u.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? "bg-green-500" : "bg-red-500"}`} />
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-black/50 text-xs font-mono">
                        {new Date(u.creado_at).toLocaleDateString("es-CL")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
