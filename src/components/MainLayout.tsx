import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { LogOut, Bell, User, Activity } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard General",
  "/forecasting": "Inteligencia Predictiva",
  "/activos/flota": "Utilizacion de Flota",
  "/activos/conductores": "Ranking Conductores",
  "/registro/walmart-loa": "Registro Walmart LOA",
  "/registro/forecast": "Forecast Contractual",
  "/usuarios": "Gestion de Usuarios",
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const currentTitle = ROUTE_TITLES[location.pathname]
    || (location.pathname.startsWith("/operaciones/")
      ? `Operaciones — ${location.pathname.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`
      : "");

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Glass header */}
          <header className="h-14 flex items-center justify-between px-5 sticky top-0 z-20 glass border-b border-[hsl(222,25%,13%)]">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-[hsl(191,100%,50%)] transition-colors" />
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-px h-5 bg-border" />
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[hsl(152,69%,45%)]" />
                  <span className="text-xs text-muted-foreground font-mono tracking-wider">
                    {currentTitle.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-secondary transition-all duration-200 text-muted-foreground hover:text-[hsl(191,100%,50%)] group">
                <Bell className="w-4 h-4" strokeWidth={1.8} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[hsl(191,100%,50%)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <div className="w-px h-5 bg-border hidden sm:block" />

              {/* User */}
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg, hsl(191 100% 50% / 0.2), hsl(258 90% 66% / 0.15))",
                    color: "hsl(191 100% 50%)",
                    border: "1px solid hsl(191 100% 50% / 0.15)",
                  }}
                >
                  {userInitial}
                </div>
                <span className="text-xs text-muted-foreground hidden md:inline max-w-[140px] truncate">
                  {user?.email}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={signOut}
                className="p-2 rounded-xl hover:bg-destructive/10 transition-all duration-200 text-muted-foreground hover:text-destructive"
                title="Cerrar sesion"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-5 md:p-7 overflow-auto relative">
            <div className="absolute inset-0 gradient-mesh opacity-50 pointer-events-none" />
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
