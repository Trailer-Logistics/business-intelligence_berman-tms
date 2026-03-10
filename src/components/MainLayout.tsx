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
          <header className="h-12 flex items-center justify-between px-5 sticky top-0 z-20 border-b"
            style={{
              background: "hsl(211 65% 13% / 0.95)",
              borderColor: "hsl(211 60% 18%)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger className="transition-colors"
                style={{ color: "rgba(255,255,255,0.7)" }}
              />
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.15)" }} />
                <Activity className="w-3 h-3" style={{ color: "hsl(152,69%,45%)" }} />
                <span className="text-[10px] font-mono tracking-[0.15em] uppercase"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {currentTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="relative p-2 rounded-xl transition-all"
                style={{ color: "rgba(255,255,255,0.6)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              >
                <Bell className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>

              <div className="w-px h-4 mx-1 hidden sm:block" style={{ background: "rgba(255,255,255,0.15)" }} />

              <div className="flex items-center gap-2 px-2 py-1 rounded-xl transition-colors cursor-default">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, hsl(208 72% 70% / 0.2), hsl(194 36% 47% / 0.1))",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {userInitial}
                </div>
                <span className="text-[11px] hidden md:inline max-w-[130px] truncate font-mono"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                >
                  {user?.email}
                </span>
              </div>

              <button
                onClick={signOut}
                className="p-2 rounded-xl transition-all"
                style={{ color: "rgba(255,255,255,0.5)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "hsl(0,72%,60%)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                title="Cerrar sesion"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-5 md:p-7 overflow-auto relative z-10 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
