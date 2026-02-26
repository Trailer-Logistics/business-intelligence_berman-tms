import { useState, KeyboardEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError("Credenciales inválidas. Intente nuevamente.");
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh relative overflow-hidden">
      {/* Animated orb */}
      <div className="absolute w-[500px] h-[500px] rounded-full animate-spin-slow opacity-20"
        style={{
          background: "radial-gradient(circle, hsl(185 100% 50% / 0.4) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div className="absolute w-[300px] h-[300px] rounded-full animate-float opacity-30"
        style={{
          background: "radial-gradient(circle, hsl(185 100% 50% / 0.3) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="card-executive p-8 glow-cyan">
          {/* Logo area */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pulse-glow"
              style={{ background: "hsl(185 100% 50% / 0.1)", border: "2px solid hsl(185 100% 50% / 0.3)" }}>
              <Truck className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Trailer <span className="text-primary text-glow-cyan">Logistics</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Business Intelligence Platform</p>
          </div>

          {/* Form */}
          <div className="space-y-4" onKeyDown={handleKeyDown}>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                placeholder="usuario@trailerlogistics.cl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-primary-foreground bg-primary hover:opacity-90 transition-all glow-cyan disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </div>

          <p className="text-center text-muted-foreground text-xs mt-6">
            © 2026 Trailer Logistics · Plataforma BI
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
