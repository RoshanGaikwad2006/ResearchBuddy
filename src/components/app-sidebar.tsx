import { Link, useRouterState } from "@tanstack/react-router";
import {
  BrainCircuit,
  FileStack,
  FilePlus2,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  UserRound,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Submit Publication", url: "/dashboard", icon: FilePlus2 },
  { title: "My Submissions", url: "/dashboard", icon: FileStack },
  { title: "Publications", url: "/dashboard", icon: LibraryBig },
  { title: "Profile", url: "/dashboard", icon: UserRound },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-soft">
            <BrainCircuit className="h-5 w-5 text-primary-foreground" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">IRP</p>
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                Research Platform
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={currentPath === item.url && item.title === "Dashboard"}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Link to="/">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
