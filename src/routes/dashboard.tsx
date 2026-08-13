import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileStack,
  LayoutDashboard,
  LibraryBig,
  Users,
  GraduationCap,
  Building2,
  BarChart3,
  Plus,
  Quote,
  UserCheck,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDashboardMetrics } from "@/features/dashboard/hooks/useDashboard";
import { ScholarSyncDashboardView } from "@/features/scholar/components/ScholarSyncDashboardView";
import { ResearchListView } from "@/features/research/components/ResearchListView";
import { MyPublicationsView } from "@/features/research/components/MyPublicationsView";
import { FacultyListView } from "@/features/faculty/components/FacultyListView";
import { FacultyProfileCard } from "@/features/faculty/components/FacultyProfileCard";
import { StudentListView } from "@/features/students/components/StudentListView";
import { StudentProfileCard } from "@/features/students/components/StudentProfileCard";
import { DepartmentListView } from "@/features/departments/components/DepartmentListView";
import { ApprovalQueueView } from "@/features/approvals/components/ApprovalQueueView";
import { AnalyticsView } from "@/features/analytics/components/AnalyticsView";
import { ReportBuilderView } from "@/features/reports/components/ReportBuilderView";
import { AuditDashboardView } from "@/features/audit/components/AuditDashboardView";
import { ResearchIntelligenceDashboardView } from "@/features/intelligence/components/ResearchIntelligenceDashboardView";
import { FacultyResearchIntelligenceView } from "@/features/intelligence/components/FacultyResearchIntelligenceView";
import { KnowledgeGraphView } from "@/features/knowledgeGraph/components/KnowledgeGraphView";
import { ResearchSubmissionModal } from "@/features/research/components/ResearchSubmissionModal";
import { FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | AI-Powered Institutional Research Platform" },
      {
        name: "description",
        content:
          "Submit publications, track submission status and review recent research activity in your IRP workspace.",
      },
    ],
  }),
  component: DashboardPageRoute,
});

function DashboardPageRoute() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}

export type WorkspaceTab =
  | "overview"
  | "intelligence"
  | "knowledge-graph"
  | "my-publications"
  | "publications"
  | "approvals"
  | "faculty"
  | "profile"
  | "students"
  | "departments"
  | "analytics"
  | "reports"
  | "scholar-sync"
  | "audits";

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const { data: metricsData, isLoading: isMetricsLoading } = useDashboardMetrics();

  const handleSignOut = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const formattedRole = role
    ? role.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : "Faculty";

  const greetingDisplayName = user?.name || user?.email?.split("@")[0] || "Researcher";

  const summary = metricsData?.summary || {
    totalPublications: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    departmentCount: 0,
    totalCitations: 0,
  };

  // Define tabs per role
  const getTabsForRole = () => {
    if (role === "FACULTY") {
      return [
        { id: "overview" as WorkspaceTab, label: "My Dashboard", icon: LayoutDashboard },
        { id: "my-publications" as WorkspaceTab, label: "My Publications", icon: LibraryBig },
        { id: "reports" as WorkspaceTab, label: "Report Engine", icon: FileSpreadsheet },
        { id: "profile" as WorkspaceTab, label: "My Profile & Scholar", icon: UserCheck },
        { id: "faculty" as WorkspaceTab, label: "Faculty Directory", icon: Users },
      ];
    }

    if (role === "STUDENT") {
      return [
        { id: "overview" as WorkspaceTab, label: "My Dashboard", icon: LayoutDashboard },
        { id: "my-publications" as WorkspaceTab, label: "My Submissions", icon: LibraryBig },
        { id: "profile" as WorkspaceTab, label: "My Profile & Guide", icon: GraduationCap },
      ];
    }

    if (role === "RESEARCH_CELL") {
      return [
        { id: "overview" as WorkspaceTab, label: "Dashboard", icon: LayoutDashboard },
        { id: "approvals" as WorkspaceTab, label: "Approval Queue", icon: CheckCircle2 },
        { id: "publications" as WorkspaceTab, label: "Institutional Research", icon: LibraryBig },
        { id: "reports" as WorkspaceTab, label: "Reports & Exports", icon: FileSpreadsheet },
        { id: "analytics" as WorkspaceTab, label: "Institutional Analytics", icon: BarChart3 },
      ];
    }

    // ADMIN
    return [
      { id: "overview" as WorkspaceTab, label: "Overview", icon: LayoutDashboard },
      { id: "publications" as WorkspaceTab, label: "Publications", icon: LibraryBig },
      { id: "approvals" as WorkspaceTab, label: "Approvals Queue", icon: CheckCircle2 },
      { id: "reports" as WorkspaceTab, label: "Reports Engine", icon: FileSpreadsheet },
      { id: "faculty" as WorkspaceTab, label: "Faculty Directory", icon: Users },
      { id: "students" as WorkspaceTab, label: "Students", icon: GraduationCap },
      { id: "departments" as WorkspaceTab, label: "Departments", icon: Building2 },
      { id: "analytics" as WorkspaceTab, label: "Analytics Engine", icon: BarChart3 },
    ];
  };

  const visibleTabs = getTabsForRole();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          activeTab={activeTab}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <p className="truncate text-sm font-medium text-foreground">Research Workspace</p>

            <div className="ml-auto flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{user?.name || user?.email || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">{formattedRole}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
              >
                Sign out
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            {/* Header Banner */}
            <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-navy px-5 py-5 text-navy-foreground shadow-card sm:px-6">
              <div className="pointer-events-none absolute inset-0 grid-pattern opacity-70" aria-hidden />
              <div
                className="pointer-events-none absolute -top-20 -right-12 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
                aria-hidden
              />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">
                    Welcome, {greetingDisplayName}
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-navy-foreground/70">
                    {role === "FACULTY"
                      ? "Manage your publication submissions, Google Scholar profile, and personal citation trajectory."
                      : role === "STUDENT"
                      ? "Track your research paper submissions and guide faculty review progress."
                      : "Manage institutional publication submissions, review queues, and aggregate analytics."}
                  </p>
                </div>

                <Button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="bg-primary-glow text-navy hover:bg-primary-glow/90 gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Submit Paper
                </Button>
              </div>
            </section>

            {/* Navigation Tabs Bar */}
            <div className="flex overflow-x-auto rounded-xl border border-border bg-card p-1 text-xs shadow-soft">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Metrics */}
                <section aria-labelledby="status-overview">
                  <h2 id="status-overview" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {role === "FACULTY" || role === "STUDENT" ? "Personal Metrics" : "Institutional Metrics"}
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                        <FileStack className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {role === "FACULTY" || role === "STUDENT" ? "My Publications" : "Total Publications"}
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {isMetricsLoading ? "..." : summary.totalPublications}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                        <Clock3 className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">Pending Review</p>
                        <p className="text-xl font-bold text-foreground">
                          {isMetricsLoading ? "..." : summary.pendingCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">Approved Papers</p>
                        <p className="text-xl font-bold text-foreground">
                          {isMetricsLoading ? "..." : summary.approvedCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Quote className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {role === "FACULTY" || role === "STUDENT" ? "My Citations" : "Total Citations"}
                        </p>
                        <p className="text-xl font-bold text-primary">
                          {isMetricsLoading ? "..." : summary.totalCitations}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Quick actions */}
                <section aria-labelledby="quick-actions">
                  <h2 id="quick-actions" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick Actions
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-primary shadow-soft">
                        <FilePlus2 className="h-5 w-5 text-primary-foreground" />
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        Submit Publication
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab(role === "FACULTY" || role === "STUDENT" ? "my-publications" : "publications")}
                      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-primary shadow-soft">
                        <LibraryBig className="h-5 w-5 text-primary-foreground" />
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        {role === "FACULTY" || role === "STUDENT" ? "My Publications" : "Browse Research"}
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </button>

                    {role === "FACULTY" && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("profile")}
                        className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-primary shadow-soft">
                          <UserCheck className="h-5 w-5 text-primary-foreground" />
                        </span>
                        <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                          Scholar Profile & Sync
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </button>
                    )}
                  </div>
                </section>

                {/* Recent Activity Feed */}
                <section aria-labelledby="recent-activity" className="rounded-xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <h2 id="recent-activity" className="text-base font-semibold text-foreground">
                      Recent Activity Feed
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab(role === "FACULTY" || role === "STUDENT" ? "my-publications" : "publications")}
                      className="text-primary text-xs"
                    >
                      View all
                    </Button>
                  </div>

                  {metricsData?.recentSubmissions && metricsData.recentSubmissions.length > 0 ? (
                    <div className="mt-4 divide-y divide-border">
                      {metricsData.recentSubmissions.map((paper) => (
                        <div key={paper.id} className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{paper.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {paper.createdBy?.name} • {paper.department?.name || "General"}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-primary font-medium">{paper.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
                      <FileStack className="h-7 w-7 text-muted-foreground/60" />
                      <p className="mt-2 text-sm font-medium text-foreground">No recent submissions</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Submitted papers will appear here live.</p>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* TAB CONTENT: My Publications */}
            {activeTab === "my-publications" && <MyPublicationsView />}

            {/* TAB CONTENT: All Publications */}
            {activeTab === "publications" && <ResearchListView />}

            {/* TAB CONTENT: Profile (Faculty / Student) */}
            {activeTab === "profile" && (
              role === "FACULTY" ? <FacultyProfileCard /> : <StudentProfileCard />
            )}

            {/* TAB CONTENT: Approvals */}
            {activeTab === "approvals" && <ApprovalQueueView />}

            {/* TAB CONTENT: Faculty Directory */}
            {activeTab === "faculty" && <FacultyListView />}

            {/* TAB CONTENT: Students Directory */}
            {activeTab === "students" && <StudentListView />}

            {/* TAB CONTENT: Departments */}
            {activeTab === "departments" && <DepartmentListView />}

            {/* TAB CONTENT: Analytics */}
            {activeTab === "analytics" && <AnalyticsView />}

            {/* TAB CONTENT: Reports Engine */}
            {activeTab === "reports" && <ReportBuilderView />}

            {/* TAB CONTENT: Scholar Sync Agent */}
            {activeTab === "scholar-sync" && <ScholarSyncDashboardView />}

            {/* TAB CONTENT: Research Data Auditor */}
            {activeTab === "audits" && <AuditDashboardView />}

            {/* TAB CONTENT: AI Research Intelligence Engine */}
            {activeTab === "intelligence" && (
              role === "FACULTY" ? <FacultyResearchIntelligenceView /> : <ResearchIntelligenceDashboardView />
            )}

            {/* TAB CONTENT: Advanced Research Knowledge Graph */}
            {activeTab === "knowledge-graph" && <KnowledgeGraphView />}

          </main>
        </div>
      </div>

      <ResearchSubmissionModal
        open={isSubmitModalOpen}
        onOpenChange={setIsSubmitModalOpen}
      />
    </SidebarProvider>
  );
}
