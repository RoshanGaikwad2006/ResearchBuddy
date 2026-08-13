import { useNavigate } from "@tanstack/react-router";
import {
  BrainCircuit,
  FileStack,
  FilePlus2,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  UserRound,
  CheckCircle2,
  GraduationCap,
  Building2,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Compass,
  RefreshCw,
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
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { WorkspaceTab } from "@/routes/dashboard";

interface AppSidebarProps {
  onSelectTab?: (tab: WorkspaceTab) => void;
  onOpenSubmitModal?: () => void;
  activeTab?: WorkspaceTab;
}

export function AppSidebar({ onSelectTab, onOpenSubmitModal, activeTab }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const getSidebarItems = () => {
    if (role === "FACULTY") {
      return [
        { title: "My Dashboard", tab: "overview" as WorkspaceTab, icon: LayoutDashboard, color: "text-blue-500" },
        { title: "Submit Paper", action: "modal", icon: FilePlus2, isCta: true, color: "text-white" },
        { title: "Research Intelligence", tab: "intelligence" as WorkspaceTab, icon: BrainCircuit, badge: "AI Copilot", color: "text-emerald-500" },
        { title: "Knowledge Graph", tab: "knowledge-graph" as WorkspaceTab, icon: Compass, badge: "Network", color: "text-purple-500" },
        { title: "My Publications", tab: "my-publications" as WorkspaceTab, icon: LibraryBig, color: "text-amber-500" },
        { title: "Report Engine", tab: "reports" as WorkspaceTab, icon: FileSpreadsheet, color: "text-indigo-500" },
        { title: "My Profile & Scholar", tab: "profile" as WorkspaceTab, icon: UserRound, color: "text-teal-500" },
        { title: "My Research Audit", tab: "audits" as WorkspaceTab, icon: ShieldCheck, badge: "AI Audit", color: "text-purple-500" },
        { title: "Faculty Directory", tab: "faculty" as WorkspaceTab, icon: FileStack, color: "text-cyan-500" },
      ];
    }

    if (role === "STUDENT") {
      return [
        { title: "My Dashboard", tab: "overview" as WorkspaceTab, icon: LayoutDashboard, color: "text-blue-500" },
        { title: "Submit Paper", action: "modal", icon: FilePlus2, isCta: true, color: "text-white" },
        { title: "My Submissions", tab: "my-publications" as WorkspaceTab, icon: LibraryBig, color: "text-amber-500" },
        { title: "My Profile & Guide", tab: "profile" as WorkspaceTab, icon: GraduationCap, color: "text-teal-500" },
      ];
    }

    if (role === "RESEARCH_CELL") {
      return [
        { title: "Dashboard", tab: "overview" as WorkspaceTab, icon: LayoutDashboard, color: "text-blue-500" },
        { title: "Research Intelligence", tab: "intelligence" as WorkspaceTab, icon: BrainCircuit, badge: "AI Engine", color: "text-emerald-500" },
        { title: "Knowledge Graph", tab: "knowledge-graph" as WorkspaceTab, icon: Compass, badge: "Network", color: "text-purple-500" },
        { title: "Approval Queue", tab: "approvals" as WorkspaceTab, icon: CheckCircle2, badge: "Queue", color: "text-emerald-500" },
        { title: "Institutional Research", tab: "publications" as WorkspaceTab, icon: LibraryBig, color: "text-amber-500" },
        { title: "Scholar Sync Agent", tab: "scholar-sync" as WorkspaceTab, icon: RefreshCw, badge: "Agent", color: "text-teal-500" },
        { title: "Reports & Exports", tab: "reports" as WorkspaceTab, icon: FileSpreadsheet, color: "text-indigo-500" },
        { title: "Data Auditor", tab: "audits" as WorkspaceTab, icon: ShieldCheck, badge: "Integrity", color: "text-purple-500" },
        { title: "Institutional Analytics", tab: "analytics" as WorkspaceTab, icon: BarChart3, color: "text-emerald-500" },
      ];
    }

    // ADMIN
    return [
      { title: "Overview", tab: "overview" as WorkspaceTab, icon: LayoutDashboard, color: "text-blue-500" },
      { title: "Submit Paper", action: "modal", icon: FilePlus2, isCta: true, color: "text-white" },
      { title: "Research Intelligence", tab: "intelligence" as WorkspaceTab, icon: BrainCircuit, badge: "AI Engine", color: "text-emerald-500" },
      { title: "Knowledge Graph", tab: "knowledge-graph" as WorkspaceTab, icon: Compass, badge: "Network", color: "text-purple-500" },
      { title: "Approvals Queue", tab: "approvals" as WorkspaceTab, icon: CheckCircle2, badge: "Queue", color: "text-emerald-500" },
      { title: "Scholar Sync Agent", tab: "scholar-sync" as WorkspaceTab, icon: RefreshCw, badge: "Autonomous", color: "text-teal-500" },
      { title: "Publications", tab: "publications" as WorkspaceTab, icon: LibraryBig, color: "text-amber-500" },
      { title: "Data Auditor", tab: "audits" as WorkspaceTab, icon: ShieldCheck, badge: "AI Audit", color: "text-purple-500" },
      { title: "Reports Engine", tab: "reports" as WorkspaceTab, icon: FileSpreadsheet, color: "text-indigo-500" },
      { title: "Faculty Directory", tab: "faculty" as WorkspaceTab, icon: FileStack, color: "text-cyan-500" },
      { title: "Students", tab: "students" as WorkspaceTab, icon: GraduationCap, color: "text-orange-500" },
      { title: "Departments", tab: "departments" as WorkspaceTab, icon: Building2, color: "text-pink-500" },
      { title: "Analytics Engine", tab: "analytics" as WorkspaceTab, icon: BarChart3, color: "text-emerald-500" },
    ];
  };

  const items = getSidebarItems();

  const getRoleDisplayName = (r?: string) => {
    switch (r) {
      case "FACULTY":
        return "Faculty Portal";
      case "STUDENT":
        return "Student Portal";
      case "RESEARCH_CELL":
        return "Research Cell";
      case "ADMIN":
        return "System Admin";
      default:
        return "Research Portal";
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/80 bg-sidebar/95 text-sidebar-foreground shadow-sm">
      {/* Header Branding */}
      <SidebarHeader className="border-b border-border/60 p-3 bg-sidebar">
        <div className="flex items-center gap-3 px-1 py-1.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 shadow-md shadow-blue-500/20 text-white transition-all hover:scale-105">
            <BrainCircuit className="h-5.5 w-5.5" />
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold tracking-tight text-foreground">
                  KRIYA
                </h1>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="truncate text-[11px] font-semibold text-primary">
                {getRoleDisplayName(role)}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className="px-2.5 py-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-2 mb-1.5">
              Workspace Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {items.map((item) => {
                const isActive = item.tab ? activeTab === item.tab : false;

                if (item.isCta) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <button
                        onClick={() => onOpenSubmitModal?.()}
                        className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white transition-all duration-200 shadow-md ${collapsed
                            ? "justify-center bg-blue-600"
                            : "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                          }`}
                        title={item.title}
                      >
                        <item.icon className="h-4 w-4 shrink-0 stroke-[2.5]" />
                        {!collapsed && <span>{item.title}</span>}
                      </button>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      onClick={() => {
                        if (item.tab) {
                          onSelectTab?.(item.tab);
                        }
                      }}
                      className={`group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all duration-200 ${isActive
                          ? "bg-primary/15 text-foreground font-bold shadow-xs ring-1 ring-primary/30"
                          : "text-foreground/80 hover:bg-accent/60 hover:text-foreground font-medium"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon
                          className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${item.color || "text-primary"
                            }`}
                        />
                        <span className="truncate text-xs font-semibold text-foreground">{item.title}</span>
                      </div>

                      {item.badge && !collapsed && (
                        <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary tracking-wide uppercase">
                          {item.badge}
                        </span>
                      )}

                      {/* Active Left Indicator Bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer User Profile Card */}
      <SidebarFooter className="border-t border-border/60 p-2.5 bg-sidebar">
        <div className="rounded-xl border border-border/60 bg-muted/60 p-2.5 transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground font-bold text-xs uppercase shadow-xs">
                {user?.fullName ? user.fullName[0] : "U"}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-foreground leading-tight">
                    {user?.fullName || "User Account"}
                  </p>
                  <p className="truncate text-[10px] font-medium text-muted-foreground">
                    {user?.email || "logged_in"}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
