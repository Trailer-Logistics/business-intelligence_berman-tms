import {
  Home, Brain, Truck, ChevronDown, ShoppingCart, Package, Users, Factory,
  TrendingUp, Car, Award, Shield, ClipboardList
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const operacionesClientes = [
  "Walmart LOA", "Walmart Peñon", "Blue Express", "Ideal S.a.",
  "SMU", "Samex", "Cencosud", "CCU", "Nestlé", "Soprole", "Codelpa", "Otros Clientes"
];

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

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Trailer <span className="text-primary">Logistics</span></h2>
              <p className="text-[10px] text-muted-foreground">Business Intelligence</p>
            </div>
          </div>
        )}
        {collapsed && <Truck className="w-6 h-6 text-primary mx-auto" />}
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarMenu>
            {/* Home */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/" end activeClassName="bg-sidebar-accent text-primary font-medium">
                  <Home className="w-4 h-4 mr-2" />
                  {!collapsed && <span>Home</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Inteligencia Predictiva */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/forecasting" activeClassName="bg-sidebar-accent text-primary font-medium">
                  <Brain className="w-4 h-4 mr-2" />
                  {!collapsed && <span>Inteligencia Predictiva</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Operaciones - collapsible */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => toggle("operaciones")}
                className="cursor-pointer"
              >
                <Factory className="w-4 h-4 mr-2" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Operaciones</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${openSections.operaciones ? "rotate-180" : ""}`} />
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {openSections.operaciones && !collapsed && (
              <div className="ml-4 border-l border-sidebar-border pl-2">
                {operacionesClientes.map((cliente) => {
                  const slug = cliente.toLowerCase().replace(/[\s.]+/g, "-");
                  return (
                    <SidebarMenuItem key={slug}>
                      <SidebarMenuButton asChild>
                        <NavLink to={`/operaciones/${slug}`} activeClassName="bg-sidebar-accent text-primary font-medium">
                          <ShoppingCart className="w-3 h-3 mr-2 opacity-60" />
                          <span className="text-xs">{cliente}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </div>
            )}

            {/* Gestión de Activos - collapsible */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => toggle("activos")}
                className="cursor-pointer"
              >
                <Package className="w-4 h-4 mr-2" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Gestión de Activos</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${openSections.activos ? "rotate-180" : ""}`} />
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {openSections.activos && !collapsed && (
              <div className="ml-4 border-l border-sidebar-border pl-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/activos/flota" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <Car className="w-3 h-3 mr-2 opacity-60" />
                      <span className="text-xs">Utilización de Flota</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/activos/conductores" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <Award className="w-3 h-3 mr-2 opacity-60" />
                      <span className="text-xs">Ranking Conductores</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            )}

            {/* Planilla de Registro - collapsible */}
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => toggle("planilla")}
                className="cursor-pointer"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Planilla de Registro</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${openSections.planilla ? "rotate-180" : ""}`} />
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {openSections.planilla && !collapsed && (
              <div className="ml-4 border-l border-sidebar-border pl-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/registro/walmart-loa" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <ClipboardList className="w-3 h-3 mr-2 opacity-60" />
                      <span className="text-xs">Registro Walmart LOA</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/registro/forecast" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <TrendingUp className="w-3 h-3 mr-2 opacity-60" />
                      <span className="text-xs">Forecast Contractual</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Gestión de Usuarios at bottom */}
      <SidebarFooter className="px-2 py-3 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/usuarios" activeClassName="bg-sidebar-accent text-primary font-medium">
                <Shield className="w-4 h-4 mr-2" />
                {!collapsed && <span>Gestión de Usuarios</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
