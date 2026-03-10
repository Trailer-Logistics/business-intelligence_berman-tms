import {
  Home, Brain, Truck, ChevronDown, Package, Factory,
  TrendingUp, Car, Award, Shield, ClipboardList, Zap
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const operacionesClientes = [
  "Walmart LOA", "Walmart Penon", "Blue Express", "Ideal S.a.",
  "SMU", "Samex", "Cencosud", "CCU", "Nestle", "Soprole", "Codelpa", "Otros Clientes"
];

function SidebarNavItem({ to, icon: Icon, label, end }: { to: string; icon: any; label: string; end?: boolean }) {
  const location = useLocation();
  const active = end ? location.pathname === to : location.pathname.startsWith(to);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={to}
          end={end}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm ${
            active
              ? "text-[hsl(191,100%,50%)] bg-[hsl(191,100%,50%,0.08)]"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-gradient-to-b from-[hsl(191,100%,50%)] to-[hsl(258,90%,66%)]"
              style={{ boxShadow: "0 0 12px hsl(191 100% 50% / 0.5), 0 0 4px hsl(191 100% 50% / 0.3)" }}
            />
          )}
          <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={active ? 2 : 1.6} />
          {!collapsed && <span className={active ? "font-semibold" : "font-medium"}>{label}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    operaciones: false,
    activos: false,
    planilla: false,
  });

  const toggle = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }));
  const isInSection = (prefix: string) => location.pathname.startsWith(prefix);
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-4 py-5 border-b border-[hsl(222,25%,10%)]">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
              style={{
                background: "linear-gradient(135deg, hsl(191 100% 50% / 0.2), hsl(258 90% 66% / 0.1))",
                border: "1px solid hsl(191 100% 50% / 0.2)",
              }}
            >
              <Truck className="w-5 h-5 text-[hsl(191,100%,50%)]" strokeWidth={1.8} />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[hsl(152,69%,45%)] border-2 border-[hsl(222,47%,5%)]" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold text-foreground tracking-tight">
                Trailer <span className="text-[hsl(191,100%,50%)] text-glow-cyan">Logistics</span>
              </h2>
              <p className="text-[9px] text-muted-foreground/50 font-mono tracking-[0.2em]">BUSINESS INTELLIGENCE</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(191 100% 50% / 0.2), hsl(258 90% 66% / 0.1))",
                border: "1px solid hsl(191 100% 50% / 0.2)",
              }}
            >
              <Truck className="w-5 h-5 text-[hsl(191,100%,50%)]" strokeWidth={1.8} />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 space-y-6">
        {/* Principal */}
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 mb-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
              Principal
            </p>
          )}
          <SidebarMenu className="space-y-1">
            <SidebarNavItem to="/" icon={Home} label="Dashboard" end />
            <SidebarNavItem to="/forecasting" icon={Brain} label="Inteligencia Predictiva" />
          </SidebarMenu>
        </SidebarGroup>

        {/* Operaciones */}
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 mb-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
              Operaciones
            </p>
          )}
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => toggle("operaciones")}
                className={`cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm ${
                  isInSection("/operaciones") ? "text-[hsl(191,100%,50%)]" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Factory className="w-[18px] h-[18px]" strokeWidth={1.6} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">Clientes</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-muted-foreground/40 ${openSections.operaciones ? "rotate-180" : ""}`} />
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

            {openSections.operaciones && !collapsed && (
              <div className="ml-[15px] pl-3 border-l border-[hsl(222,25%,12%)] space-y-0.5 mt-1 relative">
                {operacionesClientes.map((cliente) => {
                  const slug = cliente.toLowerCase().replace(/[\s.]+/g, "-");
                  const active = isActive(`/operaciones/${slug}`);
                  return (
                    <SidebarMenuItem key={slug}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={`/operaciones/${slug}`}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                            active
                              ? "text-[hsl(191,100%,50%)] bg-[hsl(191,100%,50%,0.06)]"
                              : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                            active
                              ? "bg-[hsl(191,100%,50%)] shadow-[0_0_8px_hsl(191_100%_50%_/_0.5)]"
                              : "bg-muted-foreground/20"
                          }`} />
                          <span className="text-[12px]">{cliente}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Activos */}
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 mb-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
              Activos
            </p>
          )}
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => toggle("activos")}
                className={`cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm ${
                  isInSection("/activos") ? "text-[hsl(191,100%,50%)]" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Package className="w-[18px] h-[18px]" strokeWidth={1.6} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">Gestion de Activos</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-muted-foreground/40 ${openSections.activos ? "rotate-180" : ""}`} />
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {openSections.activos && !collapsed && (
              <div className="ml-[15px] pl-3 border-l border-[hsl(222,25%,12%)] space-y-0.5 mt-1">
                <SidebarNavItem to="/activos/flota" icon={Car} label="Flota" />
                <SidebarNavItem to="/activos/conductores" icon={Award} label="Conductores" />
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Registro */}
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 mb-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
              Registro
            </p>
          )}
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => toggle("planilla")}
                className={`cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-sm ${
                  isInSection("/registro") ? "text-[hsl(191,100%,50%)]" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <ClipboardList className="w-[18px] h-[18px]" strokeWidth={1.6} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">Planilla</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-muted-foreground/40 ${openSections.planilla ? "rotate-180" : ""}`} />
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {openSections.planilla && !collapsed && (
              <div className="ml-[15px] pl-3 border-l border-[hsl(222,25%,12%)] space-y-0.5 mt-1">
                <SidebarNavItem to="/registro/walmart-loa" icon={ClipboardList} label="Walmart LOA" />
                <SidebarNavItem to="/registro/forecast" icon={TrendingUp} label="Forecast" />
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-4 border-t border-[hsl(222,25%,10%)]">
        <SidebarMenu>
          <SidebarNavItem to="/usuarios" icon={Shield} label="Usuarios" />
        </SidebarMenu>
        {!collapsed && (
          <div className="px-3 pt-3 flex items-center gap-2 text-[9px] text-muted-foreground/25 font-mono tracking-wider">
            <Zap className="w-3 h-3" />
            <span>v2.0 · TL Platform</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
