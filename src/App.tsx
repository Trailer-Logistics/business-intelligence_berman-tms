import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/MainLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardHome from "@/pages/DashboardHome";
import PlaceholderPage from "@/pages/PlaceholderPage";
import UserManagementPage from "@/pages/UserManagementPage";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <MainLayout>{children}</MainLayout>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const operacionesClientes = [
  "Walmart LOA", "Walmart Peñon", "Blue Express", "Ideal S.a.",
  "SMU", "Samex", "Cencosud", "CCU", "Nestlé", "Soprole", "Codelpa", "Otros Clientes"
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/forecasting" element={<ProtectedRoute><PlaceholderPage title="Inteligencia Predictiva" subtitle="Forecasting de Demanda" /></ProtectedRoute>} />
            {operacionesClientes.map(c => {
              const slug = c.toLowerCase().replace(/[\s.]+/g, "-");
              return <Route key={slug} path={`/operaciones/${slug}`} element={<ProtectedRoute><PlaceholderPage title={`Operaciones: ${c}`} subtitle="Panel de control operacional" /></ProtectedRoute>} />;
            })}
            <Route path="/activos/flota" element={<ProtectedRoute><PlaceholderPage title="Utilización de Flota" subtitle="Tractos y Ramplas" /></ProtectedRoute>} />
            <Route path="/activos/conductores" element={<ProtectedRoute><PlaceholderPage title="Ranking de Conductores" subtitle="Performance y cumplimiento" /></ProtectedRoute>} />
            <Route path="/registro/walmart-loa" element={<ProtectedRoute><PlaceholderPage title="Registro Walmart LOA" subtitle="UPSERT por ID de viaje" /></ProtectedRoute>} />
            <Route path="/registro/forecast" element={<ProtectedRoute><PlaceholderPage title="Forecast Contractual" subtitle="Matriz de registro" /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
