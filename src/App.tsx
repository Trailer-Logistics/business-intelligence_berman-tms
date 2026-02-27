import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ViajesProvider } from "@/hooks/useViajes";
import MainLayout from "@/components/MainLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardHome from "@/pages/DashboardHome";
import ForecastingPage from "@/pages/ForecastingPage";
import OperationsClientPage from "@/pages/OperationsClientPage";
import FleetAlertsPage from "@/pages/FleetAlertsPage";
import DriverAlertsPage from "@/pages/DriverAlertsPage";
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
  return (
    <MainLayout>
      <ViajesProvider>{children}</ViajesProvider>
    </MainLayout>
  );
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
            <Route path="/forecasting" element={<ProtectedRoute><ForecastingPage /></ProtectedRoute>} />
            {operacionesClientes.map(c => {
              const slug = c.toLowerCase().replace(/[\s.]+/g, "-");
              return <Route key={slug} path={`/operaciones/${slug}`} element={<ProtectedRoute><OperationsClientPage /></ProtectedRoute>} />;
            })}
            <Route path="/activos/flota" element={<ProtectedRoute><FleetAlertsPage /></ProtectedRoute>} />
            <Route path="/activos/conductores" element={<ProtectedRoute><DriverAlertsPage /></ProtectedRoute>} />
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
