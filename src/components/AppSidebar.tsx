import {
  Home, Brain, Truck, BarChart3, ClipboardList,
  ChevronDown, ShoppingCart, Package, Users, Factory,
  TrendingUp, Car, Award
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
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
  const isActive = (path: string) => location.pathname === path;

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
        {/* Home */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/" end activeClassName="bg-sidebar-accent text-primary font-medium">
                  <Home className="w-4 h-4 mr-2" />
                  {!collapsed && <span>Home</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Inteligencia Predictiva */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/forecasting" activeClassName="bg-sidebar-accent text-primary font-medium">
                  <Brain className="w-4 h-4 mr-2" />
                  {!collapsed && <span>Inteligencia Predictiva</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Operaciones */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="cursor-pointer flex items-center justify-between hover:text-primary transition-colors"
            onClick={() => toggle("operaciones")}
          >
            {!collapsed && (
              <>
                <span>Operaciones</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${openSections.operaciones ? "rotate-180" : ""}`} />
              </>
            )}
            {collapsed && <Factory className="w-4 h-4 mx-auto" />}
          </SidebarGroupLabel>
          {openSections.operaciones && !collapsed && (
            <SidebarGroupContent>
              <SidebarMenu>
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
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Gestión de Activos */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="cursor-pointer flex items-center justify-between hover:text-primary transition-colors"
            onClick={() => toggle("activos")}
          >
            {!collapsed && (
              <>
                <span>Gestión de Activos</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${openSections.activos ? "rotate-180" : ""}`} />
              </>
            )}
            {collapsed && <Package className="w-4 h-4 mx-auto" />}
          </SidebarGroupLabel>
          {openSections.activos && !collapsed && (
            <SidebarGroupContent>
              <SidebarMenu>
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
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* Planilla de Registro */}
        <SidebarGroup>
          <SidebarGroupLabel
            className="cursor-pointer flex items-center justify-between hover:text-primary transition-colors"
            onClick={() => toggle("planilla")}
          >
            {!collapsed && (
              <>
                <span>Planilla de Registro</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${openSections.planilla ? "rotate-180" : ""}`} />
              </>
            )}
            {collapsed && <ClipboardList className="w-4 h-4 mx-auto" />}
          </SidebarGroupLabel>
          {openSections.planilla && !collapsed && (
            <SidebarGroupContent>
              <SidebarMenu>
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
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
