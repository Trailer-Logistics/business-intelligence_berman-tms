import { useState, KeyboardEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError("Credenciales invalidas. Intente nuevamente.");
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 dot-grid opacity-[0.03]" />

      {/* Floating orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(circle, hsl(191 100% 50% / 0.08) 0%, transparent 60%)",
          filter: "blur(60px)",
          top: "10%",
          left: "20%",
        }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 30, -50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(circle, hsl(258 90% 66% / 0.06) 0%, transparent 60%)",
          filter: "blur(60px)",
          bottom: "10%",
          right: "15%",
        }}
      />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] px-6"
      >
        <div className="glass-card rounded-2xl p-8 glow-cyan relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(191,100%,50%)] to-transparent opacity-60" />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative mb-5">
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full" style={{
                background: "hsl(191 100% 50% / 0.1)",
                animation: "pulse-ring 3s ease-out infinite",
              }} />
              <div className="absolute inset-0 rounded-full" style={{
                background: "hsl(191 100% 50% / 0.1)",
                animation: "pulse-ring 3s ease-out infinite 1s",
              }} />

              <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center glow-cyan-pulse"
                style={{
                  background: "linear-gradient(135deg, hsl(191 100% 50% / 0.15), hsl(258 90% 66% / 0.1))",
                  border: "1px solid hsl(191 100% 50% / 0.3)",
                }}
              >
                <Truck className="w-10 h-10 text-[hsl(191,100%,50%)]" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-foreground tracking-tight font-[Montserrat]">
              Trailer <span className="text-[hsl(191,100%,50%)] text-glow-cyan">Logistics</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 tracking-wide">
              Business Intelligence Platform
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="space-y-5"
            onKeyDown={handleKeyDown}
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] block">
                Email
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[hsl(191,100%,50%)] rounded-xl text-black placeholder:text-black/40 focus:outline-none focus:border-[hsl(191,100%,45%)] focus:shadow-[0_0_0_3px_hsl(191,100%,50%,0.25)] hover:shadow-[0_0_0_3px_hsl(191,100%,50%,0.15)] transition-all duration-300 text-sm"
                  placeholder="usuario@trailerlogistics.cl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.1em] block">
                Contrasena
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 bg-white border-2 border-[hsl(191,100%,50%)] rounded-xl text-black placeholder:text-black/40 focus:outline-none focus:border-[hsl(191,100%,45%)] focus:shadow-[0_0_0_3px_hsl(191,100%,50%,0.25)] hover:shadow-[0_0_0_3px_hsl(191,100%,50%,0.15)] transition-all duration-300 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-destructive text-sm text-center py-1 px-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                {error}
              </motion.p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-[hsl(222,47%,6%)] transition-all duration-300 disabled:opacity-50 group relative overflow-hidden hover:brightness-110 hover:shadow-[0_0_20px_hsl(191,100%,50%,0.5)] active:scale-[0.98]"
              style={{
                background: "hsl(191, 100%, 50%)",
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              {/* Hover shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            </button>
          </motion.div>

          <p className="text-center text-muted-foreground/50 text-[11px] mt-8 tracking-wide">
            &copy; 2026 Trailer Logistics &middot; Plataforma BI v2.0
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
