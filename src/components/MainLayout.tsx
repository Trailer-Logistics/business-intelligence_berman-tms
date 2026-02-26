import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Bell } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 flex items-center justify-between border-b border-border px-4 glass-panel sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
              <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                TRAILER LOGISTICS BI
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary">
                <Bell className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
              <button
                onClick={signOut}
                className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
