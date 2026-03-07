import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { LogOut, Bell, Activity } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/forecasting": "Inteligencia Predictiva",
  "/activos/flota": "Flota",
  "/activos/conductores": "Conductores",
  "/registro/walmart-loa": "Walmart LOA",
  "/registro/forecast": "Forecast",
  "/usuarios": "Usuarios",
};

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const currentTitle = ROUTE_TITLES[location.pathname]
    || (location.pathname.startsWith("/operaciones/")
      ? location.pathname.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
      : "");

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-mesh-animated">
          {/* Glass header */}
          <header className="h-12 flex items-center justify-between px-5 sticky top-0 z-20 glass">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground/60 hover:text-[hsl(191,100%,50%)] transition-colors" />
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-px h-4 bg-[hsl(222,25%,14%)]" />
                <Activity className="w-3 h-3 text-[hsl(152,69%,45%)]" />
                <span className="text-[10px] text-muted-foreground/50 font-mono tracking-[0.15em] uppercase">
                  {currentTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="relative p-2 rounded-xl hover:bg-[hsl(222,30%,11%)] transition-all text-muted-foreground/50 hover:text-[hsl(191,100%,50%)]">
                <Bell className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>

              <div className="w-px h-4 bg-[hsl(222,25%,14%)] mx-1 hidden sm:block" />

              <div className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-[hsl(222,30%,11%)] transition-colors cursor-default">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, hsl(191 100% 50% / 0.25), hsl(258 90% 66% / 0.15))",
                    color: "hsl(191 100% 50%)",
                    boxShadow: "0 0 12px hsl(191 100% 50% / 0.15)",
                  }}
                >
                  {userInitial}
                </div>
                <span className="text-[11px] text-muted-foreground/60 hidden md:inline max-w-[130px] truncate font-mono">
                  {user?.email}
                </span>
              </div>

              <button
                onClick={signOut}
                className="p-2 rounded-xl hover:bg-[hsl(0,72%,51%,0.08)] transition-all text-muted-foreground/40 hover:text-[hsl(0,72%,51%)]"
                title="Cerrar sesion"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-5 md:p-7 overflow-auto relative z-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
