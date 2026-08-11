import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileStack,
  Search,
  XCircle,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | AI-Powered Institutional Research Platform" },
      {
        name: "description",
        content:
          "Submit publications, track submission status and review recent research activity in your IRP workspace.",
      },
      { property: "og:title", content: "Dashboard | AI-Powered Institutional Research Platform" },
      {
        property: "og:description",
        content:
          "Your research workspace for publication submission, approval tracking and recent activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const quickActions = [
  { title: "Submit Publication", icon: FilePlus2, href: "#" },
  { title: "My Submissions", icon: FileStack, href: "#" },
  { title: "Search Publications", icon: Search, href: "#" },
];

const statusCards = [
  { label: "Pending", icon: Clock3, className: "bg-accent text-accent-foreground" },
  { label: "Approved", icon: CheckCircle2, className: "bg-primary/12 text-primary" },
  { label: "Rejected", icon: XCircle, className: "bg-destructive/12 text-destructive" },
];

function DashboardPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <p className="truncate text-sm font-medium text-foreground">Research Workspace</p>
            <div className="ml-auto flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">Dr. Ananya Rao</p>
                <p className="text-xs text-muted-foreground">Faculty</p>
              </div>
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </Link>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-5 sm:px-6 lg:px-8">
            {/* Welcome */}
            <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-navy px-5 py-5 text-navy-foreground shadow-card sm:px-6">
              <div className="pointer-events-none absolute inset-0 grid-pattern opacity-70" aria-hidden />
              <div
                className="pointer-events-none absolute -top-20 -right-12 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <h1 className="text-xl font-semibold sm:text-2xl">Research Publication Dashboard</h1>
                <p className="mt-1 max-w-2xl text-sm text-navy-foreground/70">
                  Manage submissions and track review progress in one place.
                </p>
              </div>
            </section>

            {/* Quick actions */}
            <section aria-labelledby="quick-actions">
              <h2 id="quick-actions" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-primary shadow-soft">
                      <action.icon className="h-5 w-5 text-primary-foreground" />
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      {action.title}
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Status overview */}
            <section aria-labelledby="status-overview">
              <h2 id="status-overview" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Status Overview
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {statusCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft"
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${card.className}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{card.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* Recent submissions */}
              <section
                aria-labelledby="recent-submissions"
                className="rounded-xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <h2 id="recent-submissions" className="text-base font-semibold text-foreground">
                    Recent Submissions
                  </h2>
                  <Button variant="ghost" size="sm" className="text-primary">
                    View all
                  </Button>
                </div>
                <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-10 text-center">
                  <FileStack className="h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-3 text-sm font-medium text-foreground">No submissions yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Submitted publications will appear here.</p>
                </div>
              </section>

              {/* Review status */}
              <section
                aria-labelledby="review-status"
                className="rounded-xl border border-border bg-card p-5 shadow-soft"
              >
                <h2 id="review-status" className="text-base font-semibold text-foreground">
                  Review Status
                </h2>
                <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-10 text-center">
                  <Clock3 className="h-8 w-8 text-muted-foreground/60" />
                  <p className="mt-3 text-sm font-medium text-foreground">No recent activity</p>
                  <p className="mt-1 text-xs text-muted-foreground">Review updates will appear here.</p>
                </div>
              </section>
            </div>

          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
