import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  Filter,
  History,
  Info,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAuditHealth,
  useAuditIssueDetail,
  useAuditIssues,
  useAuditRuns,
  useResolveAuditIssue,
  useRunAudit,
  useRunAutoFix,
} from "../hooks/useAudit";
import { useDepartmentList } from "@/features/departments/hooks/useDepartments";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function AuditDashboardView() {
  const { user } = useAuth();
  const isAdminOrCell = user?.role === "ADMIN" || user?.role === "RESEARCH_CELL";

  const [activeTab, setActiveTab] = useState<"health" | "issues" | "runs">("health");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");

  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Queries & Mutations
  const { data: healthRes, isLoading: isHealthLoading, refetch: refetchHealth } = useAuditHealth();
  const { data: runsRes, isLoading: isRunsLoading } = useAuditRuns();
  const { data: issuesRes, isLoading: isIssuesLoading } = useAuditIssues({
    severity: severityFilter,
    issueType: issueTypeFilter,
    status: statusFilter,
    departmentId: departmentFilter,
  });
  const { data: deptRes } = useDepartmentList();
  const { data: issueDetailRes, isLoading: isDetailLoading } = useAuditIssueDetail(selectedIssueId || undefined);

  const runAuditMutation = useRunAudit();
  const resolveMutation = useResolveAuditIssue();
  const autoFixMutation = useRunAutoFix();

  const health = healthRes?.health || {
    overallHealth: 100,
    completeness: 100,
    consistency: 100,
    uniqueness: 100,
    identityMapping: 100,
    metadataQuality: 100,
    totalAudited: 0,
  };
  const departmentHealth = healthRes?.departmentHealth || [];
  const runs = runsRes?.runs || [];
  const issues = issuesRes?.issues || [];
  const departments = deptRes?.departments || [];
  const activeIssue = issueDetailRes?.issue;

  const handleRunInstitutionalAudit = () => {
    runAuditMutation.mutate({ scopeType: "INSTITUTIONAL" });
  };

  const handleRunAutoFix = () => {
    autoFixMutation.mutate();
  };

  const handleResolveAction = (action: "ACCEPT_SCHOLAR" | "ACCEPT_OPENALEX" | "ACCEPT_CROSSREF" | "ACCEPT_EXTERNAL" | "KEEP_KRIYA" | "MERGE" | "IGNORE") => {
    if (!selectedIssueId) return;
    resolveMutation.mutate(
      { id: selectedIssueId, action },
      {
        onSuccess: () => {
          setSelectedIssueId(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Research Data Quality & Integrity Auditor
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Automated reconciliation across KRIYA PostgreSQL, OpenAlex, Crossref, and Google Scholar with explainable health scoring.
          </p>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {isAdminOrCell && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunAutoFix}
                disabled={autoFixMutation.isPending}
                className="gap-1.5 text-xs font-semibold"
              >
                <Wrench className="h-3.5 w-3.5 text-amber-500" />
                {autoFixMutation.isPending ? "Fixing..." : "Safe Auto-Fix"}
              </Button>

              <Button
                size="sm"
                onClick={handleRunInstitutionalAudit}
                disabled={runAuditMutation.isPending}
                className="gap-1.5 text-xs font-semibold shadow-sm"
              >
                {runAuditMutation.isPending ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {runAuditMutation.isPending ? "Auditing..." : "Run Audit"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* HEALTH SCORE OVERVIEW CARDS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {/* Overall Score Card */}
        <div className="sm:col-span-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Overall Research Data Health</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold text-foreground">{health.overallHealth}</span>
              <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Based on {health.totalAudited} audited research publications.
            </p>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary flex items-center justify-center font-bold text-primary text-sm">
              {health.overallHealth}%
            </div>
          </div>
        </div>

        {/* 5 Dimensional Score Breakdown Cards */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Completeness</p>
          <p className="text-xl font-bold text-foreground mt-1">{health.completeness}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">DOI, Abstract & Keywords</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Consistency</p>
          <p className="text-xl font-bold text-foreground mt-1">{health.consistency}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Metadata Alignment</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Uniqueness</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{health.uniqueness}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Zero Internal Duplicates</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Identity Link</p>
          <p className="text-xl font-bold text-primary mt-1">{health.identityMapping}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Scholar / ORCID Verified</p>
        </div>
      </div>

      {/* MAIN NAVIGATION TABS */}
      <div className="flex items-center gap-2 rounded-xl bg-muted p-1 border border-border w-fit">
        <Button
          variant={activeTab === "health" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("health")}
          className="gap-1.5 text-xs font-medium"
        >
          <Database className="h-3.5 w-3.5" /> Department Data Health
        </Button>
        <Button
          variant={activeTab === "issues" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("issues")}
          className="gap-1.5 text-xs font-medium"
        >
          <AlertTriangle className="h-3.5 w-3.5" /> Issue Queue ({issues.length})
        </Button>
        <Button
          variant={activeTab === "runs" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("runs")}
          className="gap-1.5 text-xs font-medium"
        >
          <History className="h-3.5 w-3.5" /> Audit Runs History ({runs.length})
        </Button>
      </div>

      {/* TAB 1: DEPARTMENT DATA HEALTH */}
      {activeTab === "health" && (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="border-b border-border bg-muted/40 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Institutional Department Health Metrics
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Departmental breakdown of metadata quality, completeness, and open review issues.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchHealth()} className="h-8 text-xs gap-1">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3 font-semibold">Department Code</th>
                  <th className="px-5 py-3 font-semibold">Department Name</th>
                  <th className="px-5 py-3 font-semibold">Data Health Score</th>
                  <th className="px-5 py-3 font-semibold">Open Audit Issues</th>
                  <th className="px-5 py-3 font-semibold">Status Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departmentHealth.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      No departmental health metrics calculated yet. Click <strong>Run Audit</strong> to scan.
                    </td>
                  </tr>
                ) : (
                  departmentHealth.map((dept) => (
                    <tr key={dept.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-primary">{dept.code}</td>
                      <td className="px-5 py-3.5 font-medium text-foreground">{dept.name}</td>
                      <td className="px-5 py-3.5 font-extrabold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="w-8">{dept.healthScore}%</span>
                          <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${dept.healthScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {dept.openIssues > 0 ? (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 font-semibold border-amber-500/20">
                            {dept.openIssues} Open Issues
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                            ✓ Verified Clean
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {dept.healthScore >= 90 ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Excellent
                          </span>
                        ) : dept.healthScore >= 75 ? (
                          <span className="text-amber-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Good (Minor Issues)
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> Needs Review
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT ISSUE QUEUE */}
      {activeTab === "issues" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-soft text-xs">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="font-bold text-foreground uppercase tracking-wider">Queue Filters:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Severity Filter */}
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="LOW">LOW</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="Status: OPEN" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">OPEN</SelectItem>
                  <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                  <SelectItem value="IGNORED">IGNORED</SelectItem>
                  <SelectItem value="AUTO_RESOLVED">AUTO RESOLVED</SelectItem>
                </SelectContent>
              </Select>

              {/* Department Filter */}
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-8 text-xs w-44">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Issue Data Table */}
          <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Severity</th>
                    <th className="px-4 py-3 font-semibold">Issue Type</th>
                    <th className="px-4 py-3 font-semibold">Audited Publication / Target</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Match Confidence</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isIssuesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        Loading issue queue...
                      </td>
                    </tr>
                  ) : issues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                        No open audit issues found matching filter criteria!
                      </td>
                    </tr>
                  ) : (
                    issues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold py-0.5 ${
                              issue.severity === "CRITICAL"
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                : issue.severity === "HIGH"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : issue.severity === "MEDIUM"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                : "bg-slate-500/10 text-slate-600 border-slate-500/30"
                            }`}
                          >
                            {issue.severity}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 font-bold text-foreground">{issue.issueType}</td>

                        <td className="px-4 py-3 max-w-xs truncate font-medium text-foreground">
                          {issue.research?.title || issue.faculty?.user?.name || "Institutional Record"}
                        </td>

                        <td className="px-4 py-3 font-medium text-muted-foreground">{issue.externalSource}</td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-bold text-primary">
                            <span>{issue.confidence}%</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {issue.status}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setSelectedIssueId(issue.id)}
                            className="h-7 text-xs font-semibold px-2.5"
                          >
                            Inspect & Resolve
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT RUNS HISTORY */}
      {activeTab === "runs" && (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="px-5 py-3 font-semibold">Audit Run ID</th>
                  <th className="px-5 py-3 font-semibold">Scope</th>
                  <th className="px-5 py-3 font-semibold">Triggered By</th>
                  <th className="px-5 py-3 font-semibold">Records Scanned</th>
                  <th className="px-5 py-3 font-semibold">Issues Detected</th>
                  <th className="px-5 py-3 font-semibold">Data Health Result</th>
                  <th className="px-5 py-3 font-semibold">Started At</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                      No past audit runs logged yet. Click <strong>Run Audit</strong> to execute your first scan!
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-primary">{run.id.slice(0, 8)}...</td>
                      <td className="px-5 py-3.5 font-bold text-foreground">{run.scopeType}</td>
                      <td className="px-5 py-3.5 font-medium text-foreground">{run.triggeredBy?.name || "System"}</td>
                      <td className="px-5 py-3.5 font-bold text-foreground">{run.recordsScanned}</td>
                      <td className="px-5 py-3.5 font-bold text-amber-600">{run.issuesDetected}</td>
                      <td className="px-5 py-3.5 font-extrabold text-foreground">{run.healthScore}%</td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant="outline"
                          className={
                            run.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                          }
                        >
                          {run.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISUAL MULTI-SOURCE FIELD-BY-FIELD COMPARISON & HUMAN REVIEW MODAL */}
      <Dialog open={!!selectedIssueId} onOpenChange={(open) => !open && setSelectedIssueId(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Multi-Source Audit Inspection & Comparative Matrix
            </DialogTitle>
            <DialogDescription className="text-xs">
              Side-by-side comparison across KRIYA, Google Scholar, OpenAlex, and Crossref with 1-click source selection.
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading || !activeIssue ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Top Banner */}
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3 border border-border">
                <div>
                  <span className="font-bold text-foreground block">Issue Type: {activeIssue.issueType}</span>
                  <span className="text-[11px] text-muted-foreground">
                    Target: {activeIssue.research?.title || activeIssue.faculty?.user?.name || "Institutional Record"} • Detected: {new Date(activeIssue.detectedAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs font-bold text-primary">
                    Confidence: {activeIssue.confidence}%
                  </Badge>
                </div>
              </div>

              {/* Confidence Checklist Reasons */}
              {activeIssue.confidenceReasons && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
                  <span className="font-bold text-primary block text-[11px]">Match Confidence Reasons:</span>
                  <div className="space-y-0.5 text-[11px] text-muted-foreground">
                    {JSON.parse(activeIssue.confidenceReasons).map((r: string, idx: number) => (
                      <div key={idx}>{r}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Source Comparison Matrix Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/80 font-bold border-b border-border">
                    <tr>
                      <th className="px-3.5 py-2.5">Field</th>
                      <th className="px-3.5 py-2.5 bg-blue-500/10 text-blue-900">KRIYA (Local DB)</th>
                      <th className="px-3.5 py-2.5 bg-amber-500/10 text-amber-900">Google Scholar</th>
                      <th className="px-3.5 py-2.5 bg-emerald-500/10 text-emerald-900">OpenAlex</th>
                      <th className="px-3.5 py-2.5 bg-indigo-500/10 text-indigo-900">Crossref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeIssue.fieldDiffs ? (
                      JSON.parse(activeIssue.fieldDiffs).map((diff: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3.5 py-3 font-bold text-muted-foreground">{diff.label}</td>
                          <td className="px-3.5 py-3 font-bold bg-blue-500/5 text-blue-950">{String(diff.kriyaValue)}</td>
                          <td className="px-3.5 py-3 font-bold bg-amber-500/5 text-amber-950">
                            {diff.scholarValue !== undefined ? String(diff.scholarValue) : String(diff.externalValue)}
                          </td>
                          <td className="px-3.5 py-3 font-bold bg-emerald-500/5 text-emerald-950">
                            {diff.openalexValue !== undefined ? String(diff.openalexValue) : String(diff.externalValue)}
                          </td>
                          <td className="px-3.5 py-3 font-bold bg-indigo-500/5 text-indigo-950">
                            {diff.crossrefValue !== undefined ? String(diff.crossrefValue) : String(diff.externalValue)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">
                          No field diffs registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 1-Click Multi-Source Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                  <span>Select source to update KRIYA database:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolveAction("IGNORE")}
                    disabled={resolveMutation.isPending}
                    className="text-xs"
                  >
                    Ignore Issue
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolveAction("KEEP_KRIYA")}
                    disabled={resolveMutation.isPending}
                    className="text-xs font-semibold border-blue-500/30 text-blue-700 bg-blue-50/50"
                  >
                    Keep KRIYA Value
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleResolveAction("ACCEPT_SCHOLAR")}
                    disabled={resolveMutation.isPending}
                    className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Accept Scholar
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleResolveAction("ACCEPT_OPENALEX")}
                    disabled={resolveMutation.isPending}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Accept OpenAlex
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleResolveAction("ACCEPT_CROSSREF")}
                    disabled={resolveMutation.isPending}
                    className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Accept Crossref
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
