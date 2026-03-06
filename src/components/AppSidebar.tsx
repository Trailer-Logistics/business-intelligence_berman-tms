import {
  Home, Brain, Truck, ChevronDown, ShoppingCart, Package, Users, Factory,
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

const clienteIcons: Record<string, typeof ShoppingCart> = {};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    operaciones: true,
    activos: false,
    planilla: false,
  });

  const toggle = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  const isActive = (path: string) => location.pathname === path;
  const isInSection = (prefix: string) => location.pathname.startsWith(prefix);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-[hsl(222,44%,7%)]">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(191 100% 50% / 0.15), hsl(258 90% 66% / 0.08))",
                border: "1px solid hsl(191 100% 50% / 0.2)",
              }}
            >
              <Truck className="w-5 h-5 text-[hsl(191,100%,50%)]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                Trailer <span className="text-[hsl(191,100%,50%)]">Logistics</span>
              </h2>
              <p className="text-[10px] text-muted-foreground font-mono tracking-wider">BUSINESS INTELLIGENCE</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(191 100% 50% / 0.15), hsl(258 90% 66% / 0.08))",
                border: "1px solid hsl(191 100% 50% / 0.2)",
              }}
            >
              <Truck className="w-5 h-5 text-[hsl(191,100%,50%)]" strokeWidth={1.5} />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-1">
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
              Principal
            </p>
          )}
          <SidebarMenu>
            {/* Home */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/"
                  end
                  activeClassName="bg-[hsl(191,100%,50%,0.1)] text-[hsl(191,100%,50%)] border-[hsl(191,100%,50%,0.2)]"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 border border-transparent text-sm"
                >
                  <Home className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  {!collapsed && <span className="font-medium">Dashboard</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Inteligencia Predictiva */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/forecasting"
                  activeClassName="bg-[hsl(191,100%,50%,0.1)] text-[hsl(191,100%,50%)] border-[hsl(191,100%,50%,0.2)]"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 border border-transparent text-sm"
                >
                  <Brain className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  {!collapsed && <span className="font-medium">Inteligencia Predictiva</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Operaciones */}
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
              Operaciones
            </p>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => toggle("operaciones")}
                className={`cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 text-sm ${
                  isInSection("/operaciones") ? "text-[hsl(191,100%,50%)]" : ""
                }`}
              >
                <Factory className="w-[18px] h-[18px]" strokeWidth={1.8} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">Clientes</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-muted-foreground ${openSections.operaciones ? "rotate-180" : ""}`} />
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

            {openSections.operaciones && !collapsed && (
              <div className="ml-3 pl-3 border-l border-[hsl(222,25%,15%)] space-y-0.5 mt-1">
                {operacionesClientes.map((cliente) => {
                  const slug = cliente.toLowerCase().replace(/[\s.]+/g, "-");
                  const active = isActive(`/operaciones/${slug}`);
                  return (
                    <SidebarMenuItem key={slug}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={`/operaciones/${slug}`}
                          activeClassName="text-[hsl(191,100%,50%)] bg-[hsl(191,100%,50%,0.06)]"
                          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${active ? "bg-[hsl(191,100%,50%)]" : "bg-muted-foreground/30"}`} />
                          <span className="text-xs">{cliente}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Gestion de Activos */}
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
              Activos
            </p>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => toggle("activos")}
                className={`cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 text-sm ${
                  isInSection("/activos") ? "text-[hsl(191,100%,50%)]" : ""
                }`}
              >
                <Package className="w-[18px] h-[18px]" strokeWidth={1.8} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">Gestion de Activos</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-muted-foreground ${openSections.activos ? "rotate-180" : ""}`} />
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

            {openSections.activos && !collapsed && (
              <div className="ml-3 pl-3 border-l border-[hsl(222,25%,15%)] space-y-0.5 mt-1">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/activos/flota"
                      activeClassName="text-[hsl(191,100%,50%)] bg-[hsl(191,100%,50%,0.06)]"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
                    >
                      <Car className="w-3.5 h-3.5" strokeWidth={1.8} />
                      <span className="text-xs">Utilizacion de Flota</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/activos/conductores"
                      activeClassName="text-[hsl(191,100%,50%)] bg-[hsl(191,100%,50%,0.06)]"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
                    >
                      <Award className="w-3.5 h-3.5" strokeWidth={1.8} />
                      <span className="text-xs">Ranking Conductores</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Planilla de Registro */}
        <SidebarGroup>
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em]">
              Registro
            </p>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => toggle("planilla")}
                className={`cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 text-sm ${
                  isInSection("/registro") ? "text-[hsl(191,100%,50%)]" : ""
                }`}
              >
                <ClipboardList className="w-[18px] h-[18px]" strokeWidth={1.8} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">Planilla de Registro</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 text-muted-foreground ${openSections.planilla ? "rotate-180" : ""}`} />
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>

            {openSections.planilla && !collapsed && (
              <div className="ml-3 pl-3 border-l border-[hsl(222,25%,15%)] space-y-0.5 mt-1">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/registro/walmart-loa"
                      activeClassName="text-[hsl(191,100%,50%)] bg-[hsl(191,100%,50%,0.06)]"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
                    >
                      <ClipboardList className="w-3.5 h-3.5" strokeWidth={1.8} />
                      <span className="text-xs">Registro Walmart LOA</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/registro/forecast"
                      activeClassName="text-[hsl(191,100%,50%)] bg-[hsl(191,100%,50%,0.06)]"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
                    >
                      <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.8} />
                      <span className="text-xs">Forecast Contractual</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="px-2 py-3 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/usuarios"
                activeClassName="bg-[hsl(191,100%,50%,0.1)] text-[hsl(191,100%,50%)] border-[hsl(191,100%,50%,0.2)]"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 border border-transparent text-sm"
              >
                <Shield className="w-[18px] h-[18px]" strokeWidth={1.8} />
                {!collapsed && <span className="font-medium">Usuarios</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Version badge */}
        {!collapsed && (
          <div className="px-3 pt-2">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40">
              <Zap className="w-3 h-3" />
              <span className="font-mono">v2.0.0 · BI Platform</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
