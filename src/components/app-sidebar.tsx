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
  Settings,
  Users,
  FolderLock,
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
import kkWaghLogo from "@/assets/kk-wagh-logo.png";

interface AppSidebarProps {
  onSelectTab?: (tab: WorkspaceTab) => void;
  onOpenSubmitModal?: () => void;
  activeTab?: WorkspaceTab;
  avatarUrl?: string | undefined;
}

export function AppSidebar({ onSelectTab, onOpenSubmitModal, activeTab, avatarUrl }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const groups = [
    {
      label: "WORKSPACE",
      items: [
        { title: "Overview", tab: "overview" as WorkspaceTab, icon: LayoutDashboard },
        {
          title: role === "STUDENT" ? "My Submissions" : "My Publications",
          tab: (role === "FACULTY" || role === "STUDENT") ? "my-publications" as WorkspaceTab : "publications" as WorkspaceTab,
          icon: LibraryBig,
        },
        { title: "My Research Vault", tab: "my-vault" as WorkspaceTab, icon: FolderLock, roles: ["FACULTY", "ADMIN"] },
        { title: "Submit Research", action: "modal", icon: FilePlus2, roles: ["FACULTY", "STUDENT", "ADMIN"] },
        { title: "Research Analytics", tab: "analytics" as WorkspaceTab, icon: BarChart3, roles: ["FACULTY", "RESEARCH_CELL", "ADMIN"] },
        { title: "Report Engine", tab: "reports" as WorkspaceTab, icon: FileSpreadsheet, roles: ["FACULTY", "RESEARCH_CELL", "ADMIN"] },
        { title: "Approval Queue", tab: "approvals" as WorkspaceTab, icon: CheckCircle2, roles: ["RESEARCH_CELL", "ADMIN"] },
      ]
    },
    {
      label: "RESEARCH",
      items: [
        { title: "Research Repository", tab: "publications" as WorkspaceTab, icon: FileStack },
        { title: "DOI & Metadata", tab: "scholar-sync" as WorkspaceTab, icon: RefreshCw, roles: ["FACULTY", "RESEARCH_CELL", "ADMIN"] },
        { title: "Faculty Directory", tab: "faculty" as WorkspaceTab, icon: Users, roles: ["FACULTY", "RESEARCH_CELL", "ADMIN"] },
        { title: "Students Directory", tab: "students" as WorkspaceTab, icon: GraduationCap, roles: ["ADMIN"] },
        { title: "Departments", tab: "departments" as WorkspaceTab, icon: Building2, roles: ["ADMIN"] },
        { title: "Research Activities", tab: "intelligence" as WorkspaceTab, icon: BrainCircuit },
        { title: "Knowledge Graph", tab: "knowledge-graph" as WorkspaceTab, icon: Compass, roles: ["FACULTY", "RESEARCH_CELL", "ADMIN"] },
        { title: "Data Auditor", tab: "audits" as WorkspaceTab, icon: ShieldCheck, roles: ["RESEARCH_CELL", "ADMIN"] },
      ]
    },
    {
      label: "ACCOUNT",
      items: [
        { title: "My Profile", tab: "profile" as WorkspaceTab, icon: UserRound },
        { title: "Settings", tab: "profile" as WorkspaceTab, icon: Settings },
      ]
    }
  ];

  // Filter items in each group by role
  const visibleGroups = groups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.roles || (role && item.roles.includes(role)))
  })).filter(group => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r border-[#E2E8F0] bg-white text-foreground shadow-none">
      {/* Header Branding */}
      <SidebarHeader className="border-b border-[#E2E8F0] p-4 bg-white">
        <div className="flex items-center gap-3 px-1 py-1">
          <img src={kkWaghLogo} alt="K. K. Wagh Logo" className="h-16 w-16 object-contain" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-gray-500 tracking-tight leading-normal uppercase">
                K. K. Wagh Education Society
              </p>
              <div className="mt-0.5">
                <h1 className="text-2xl font-bold tracking-tight text-[#000000] leading-none">
                  KRIYA
                </h1>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className="px-3 py-4 bg-white">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase font-bold tracking-widest text-black/60 px-2 mb-2">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.action === "modal" ? false : (item.tab ? activeTab === item.tab : false);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        onClick={() => {
                          if (item.action === "modal") {
                            onOpenSubmitModal?.();
                          } else if (item.tab) {
                            onSelectTab?.(item.tab);
                          }
                        }}
                        className={`group relative flex items-center justify-between rounded-md py-2.5 pl-4 pr-3 text-xs transition-all duration-150 ${isActive
                            ? "bg-[#B8891F]/5 border-y border-r border-[#E2E8F0] text-[#000000] font-bold"
                            : "text-black/85 hover:bg-[#F5F7FA] hover:text-black font-semibold"
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <item.icon
                            className={`h-4.5 w-4.5 shrink-0 transition-colors duration-150 ${isActive ? "text-[#000000]" : "text-black/60 group-hover:text-black"}`}
                          />
                          <span className="truncate text-xs">{item.title}</span>
                        </div>

                        {/* Active Left Indicator Bar */}
                        {isActive && (
                          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#B8891F]" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer User Profile Card */}
      <SidebarFooter className={`border-t border-[#E2E8F0] bg-white transition-all duration-150 ${collapsed ? "p-1" : "p-3"}`}>
        <div className={`rounded-md bg-white transition-all duration-150 ${collapsed ? "" : "border border-[#E2E8F0] p-3"}`}>
          <div className={`flex items-center justify-between gap-2 ${collapsed ? "justify-center" : ""}`}>
            <div className={`flex items-center min-w-0 ${collapsed ? "justify-center" : "gap-2.5"}`}>
              <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden border border-[#E2E8F0] bg-[#102A43] flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm uppercase">
                    {user?.name ? user.name[0] : "K"}
                  </span>
                )}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#000000] leading-tight">
                    {user?.name || "Kushal Birla"}
                  </p>
                  <p className="truncate text-[10px] font-medium text-black/60">
                    {user?.email || "kushalbirla2006@gmail.com"}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Logout"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-black/60 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
