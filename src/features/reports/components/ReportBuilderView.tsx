import { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Filter,
  CheckSquare,
  Square,
  Save,
  History,
  BookOpen,
  Building2,
  Search,
  Award,
  RefreshCw,
  Layers,
  ArrowUpDown,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartmentList } from "@/features/departments/hooks/useDepartments";
import { useFacultyList } from "@/features/faculty/hooks/useFaculty";
import {
  useExportExcel,
  useExportPdf,
  useReportHistory,
  useReportPreview,
  useReportTemplates,
  useSaveReportConfig,
  useSavedReports,
} from "../hooks/useReports";
import type { ReportFilterPayload } from "@/services/report.service";

const ALL_AVAILABLE_COLUMNS = [
  { key: "slNo", label: "Sl. No." },
  { key: "title", label: "Paper Title" },
  { key: "authors", label: "All Authors" },
  { key: "primaryAuthor", label: "Primary Author" },
  { key: "coAuthors", label: "Co-Author(s)" },
  { key: "facultyName", label: "Faculty Name" },
  { key: "employeeId", label: "Employee ID" },
  { key: "department", label: "Department" },
  { key: "journal", label: "Journal / Conference" },
  { key: "publicationYear", label: "Publication Year" },
  { key: "citationCount", label: "Citation Count" },
  { key: "doi", label: "DOI Handle" },
  { key: "researchArea", label: "Research Area" },
  { key: "status", label: "Publication Status" },
];

export function ReportBuilderView() {
  const [activeTab, setActiveTab] = useState<"builder" | "saved" | "history">("builder");

  // Template & Department/Faculty Data
  const { data: templatesRes } = useReportTemplates();
  const { data: deptRes } = useDepartmentList();
  const { data: facultyRes } = useFacultyList();

  const templates = templatesRes?.templates || [];
  const departments = deptRes?.departments || [];
  const facultyMembers = facultyRes?.items || (facultyRes as any)?.faculties || [];

  // Filter Payload State
  const [reportType, setReportType] = useState<string>("INSTITUTIONAL");
  const [departmentId, setDepartmentId] = useState<string>("ALL");
  const [facultyId, setFacultyId] = useState<string>("ALL");
  const [yearStart, setYearStart] = useState<string>("");
  const [yearEnd, setYearEnd] = useState<string>("");
  const [researchArea, setResearchArea] = useState<string>("");
  const [status, setStatus] = useState<string>("ALL");
  const [journalOrConference, setJournalOrConference] = useState<"JOURNAL" | "CONFERENCE" | "ALL">("ALL");
  const [citationMin, setCitationMin] = useState<string>("0");
  const [search, setSearch] = useState<string>("");
  const [grouping, setGrouping] = useState<"department" | "year" | "status" | "none">("none");
  const [sorting, setSorting] = useState<"year_desc" | "year_asc" | "citations_desc" | "citations_asc" | "title_asc">("year_desc");

  // Columns Selected
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "title",
    "authors",
    "department",
    "journal",
    "publicationYear",
    "citationCount",
    "status",
    "doi",
  ]);

  // Saved Config Modal
  const [saveName, setSaveName] = useState("");
  const [isSavingModalOpen, setIsSavingModalOpen] = useState(false);

  // Selected Template Object
  const currentTemplate = templates.find((t) => t.id === reportType) || {
    id: "INSTITUTIONAL",
    title: "Comprehensive Institutional Research Report",
    category: "Institutional",
    description: "Full institutional research portfolio across departments.",
  };

  // Payload for Query Preview
  const payload: ReportFilterPayload = {
    reportType,
    reportTitle: currentTemplate.title,
    departmentId: departmentId !== "ALL" ? departmentId : undefined,
    facultyId: facultyId !== "ALL" ? facultyId : undefined,
    yearStart: yearStart ? Number(yearStart) : undefined,
    yearEnd: yearEnd ? Number(yearEnd) : undefined,
    researchArea: researchArea || undefined,
    status: status !== "ALL" ? status : undefined,
    journalOrConference,
    citationMin: citationMin ? Number(citationMin) : undefined,
    search: search || undefined,
    columns: selectedColumns,
    grouping,
    sorting,
    page: 1,
    limit: 100,
  };

  // TanStack Query & Mutations
  const { data: previewRes, isLoading: isPreviewLoading, refetch: refetchPreview } = useReportPreview(payload);
  const exportExcelMutation = useExportExcel();
  const exportPdfMutation = useExportPdf();
  const saveConfigMutation = useSaveReportConfig();
  const { data: savedRes } = useSavedReports();
  const { data: historyRes } = useReportHistory();

  const previewData = previewRes?.data;
  const savedReportsList = savedRes?.reports || [];
  const historyList = historyRes?.history || [];

  // Toggle Column Selection
  const toggleColumn = (key: string) => {
    if (selectedColumns.includes(key)) {
      if (selectedColumns.length > 1) {
        setSelectedColumns(selectedColumns.filter((k) => k !== key));
      }
    } else {
      setSelectedColumns([...selectedColumns, key]);
    }
  };

  const selectAllColumns = () => {
    setSelectedColumns(ALL_AVAILABLE_COLUMNS.map((c) => c.key));
  };

  const clearAllColumns = () => {
    setSelectedColumns(["title", "authors", "citationCount"]);
  };

  const handleSelectTemplate = (tId: string) => {
    setReportType(tId);
    const tmpl = templates.find((t) => t.id === tId);
    if (tmpl && tmpl.defaultColumns) {
      setSelectedColumns(tmpl.defaultColumns);
    }
  };

  const handleSaveConfig = async () => {
    if (!saveName.trim()) return;
    await saveConfigMutation.mutateAsync({
      name: saveName,
      description: `Saved configuration for ${currentTemplate.title}`,
      reportType,
      filters: payload,
      columns: selectedColumns,
      grouping,
      sorting,
    });
    setSaveName("");
    setIsSavingModalOpen(false);
  };

  const handleLoadSavedConfig = (saved: any) => {
    setReportType(saved.reportType);
    if (saved.columns && Array.isArray(saved.columns)) {
      setSelectedColumns(saved.columns);
    }
    if (saved.grouping) setGrouping(saved.grouping);
    if (saved.sorting) setSorting(saved.sorting);
    try {
      const f = JSON.parse(saved.filters || "{}");
      if (f.departmentId) setDepartmentId(f.departmentId);
      if (f.facultyId) setFacultyId(f.facultyId);
      if (f.yearStart) setYearStart(String(f.yearStart));
      if (f.yearEnd) setYearEnd(String(f.yearEnd));
    } catch {}
    setActiveTab("builder");
    refetchPreview();
  };

  const moveColumnUp = (index: number) => {
    if (index <= 0) return;
    const newCols = [...selectedColumns];
    const temp = newCols[index - 1];
    newCols[index - 1] = newCols[index]!;
    newCols[index] = temp!;
    setSelectedColumns(newCols);
  };

  const moveColumnDown = (index: number) => {
    if (index >= selectedColumns.length - 1) return;
    const newCols = [...selectedColumns];
    const temp = newCols[index + 1];
    newCols[index + 1] = newCols[index]!;
    newCols[index] = temp!;
    setSelectedColumns(newCols);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Institutional Research Report & Export Engine
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configurable NAAC Criterion 3 & NIRF Research Data Templates with 1-Click Excel and Printable PDF Generation.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 rounded-xl bg-muted p-1 border border-border self-start sm:self-center">
          <Button
            variant={activeTab === "builder" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("builder")}
            className="gap-1.5 text-xs font-medium"
          >
            <Filter className="h-3.5 w-3.5" /> Report Builder
          </Button>
          <Button
            variant={activeTab === "saved" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("saved")}
            className="gap-1.5 text-xs font-medium"
          >
            <Save className="h-3.5 w-3.5" /> Saved Configs ({savedReportsList.length})
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("history")}
            className="gap-1.5 text-xs font-medium"
          >
            <History className="h-3.5 w-3.5" /> Audit History ({historyList.length})
          </Button>
        </div>
      </div>

      {/* TAB 1: REPORT BUILDER */}
      {activeTab === "builder" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT SIDEBAR: FILTERS & CONFIGURATION (4 COLS) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Template Selector Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" /> Select Report Template
              </h2>

              <Select value={reportType} onValueChange={handleSelectTemplate}>
                <SelectTrigger className="w-full font-medium">
                  <SelectValue placeholder="Choose report template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="font-semibold text-foreground">{t.title}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-primary block mb-1">
                  {currentTemplate.title} ({currentTemplate.category})
                </span>
                {currentTemplate.description}
              </div>
            </div>

            {/* Filter Panel Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Filter className="h-4 w-4" /> Filter Parameters
              </h2>

              <div className="space-y-3 text-xs">
                {/* Department Filter */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" /> Department
                  </Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger className="h-9 text-xs">
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

                {/* Faculty Filter */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-muted-foreground" /> Faculty Member
                  </Label>
                  <Select value={facultyId} onValueChange={setFacultyId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="All Faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Faculty Members</SelectItem>
                      {facultyMembers.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.user?.name} ({f.employeeId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Start Year</Label>
                    <Input
                      type="number"
                      placeholder="2020"
                      className="h-9 text-xs"
                      value={yearStart}
                      onChange={(e) => setYearStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Year</Label>
                    <Input
                      type="number"
                      placeholder="2026"
                      className="h-9 text-xs"
                      value={yearEnd}
                      onChange={(e) => setYearEnd(e.target.value)}
                    />
                  </div>
                </div>

                {/* Publication Status & Venue */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                        <SelectItem value="UNDER_REVIEW">UNDER REVIEW</SelectItem>
                        <SelectItem value="SUBMITTED">SUBMITTED</SelectItem>
                        <SelectItem value="DRAFT">DRAFT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Venue Type</Label>
                    <Select value={journalOrConference} onValueChange={(v: any) => setJournalOrConference(v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Journal + Conf" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Venues</SelectItem>
                        <SelectItem value="JOURNAL">Journals Only</SelectItem>
                        <SelectItem value="CONFERENCE">Conferences Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Search & Citation Threshold */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Min Citations</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-9 text-xs"
                      value={citationMin}
                      onChange={(e) => setCitationMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Keyword Search</Label>
                    <Input
                      placeholder="Search title/doi..."
                      className="h-9 text-xs"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column Customization & Reordering Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Layers className="h-4 w-4" /> Column Customization & Reordering
                </h2>
                <div className="flex gap-2">
                  <button onClick={selectAllColumns} className="text-[10px] text-primary hover:underline font-medium">
                    Select All
                  </button>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <button onClick={clearAllColumns} className="text-[10px] text-muted-foreground hover:underline">
                    Reset
                  </button>
                </div>
              </div>

              {/* Active Column Reordering Section */}
              <div className="space-y-2 border-b border-border pb-3">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Export Column Order (Use ← → to reorder)
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedColumns.map((colKey, idx) => {
                    const colObj = ALL_AVAILABLE_COLUMNS.find((c) => c.key === colKey);
                    return (
                      <div
                        key={colKey}
                        className="inline-flex items-center gap-1 bg-primary/10 border border-primary/30 text-primary px-2.5 py-1 rounded-lg text-xs font-medium"
                      >
                        <span>{colObj ? colObj.label : colKey}</span>
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => moveColumnUp(idx)}
                            disabled={idx === 0}
                            className="hover:bg-primary/20 rounded p-0.5 disabled:opacity-30"
                            title="Move Left/Up"
                          >
                            ◄
                          </button>
                          <button
                            onClick={() => moveColumnDown(idx)}
                            disabled={idx === selectedColumns.length - 1}
                            className="hover:bg-primary/20 rounded p-0.5 disabled:opacity-30"
                            title="Move Right/Down"
                          >
                            ►
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Available Column Selection Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {ALL_AVAILABLE_COLUMNS.map((col) => {
                  const isSelected = selectedColumns.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                        isSelected
                          ? "border-primary/40 bg-primary/5 text-primary font-medium"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {isSelected ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5" />}
                      <span className="truncate">{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grouping & Sorting Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <ArrowUpDown className="h-4 w-4" /> Grouping & Sorting
              </h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs">Group By</Label>
                  <Select value={grouping} onValueChange={(v: any) => setGrouping(v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="No Grouping" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Grouping</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="year">Publication Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Sort By</Label>
                  <Select value={sorting} onValueChange={(v: any) => setSorting(v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Year (Newest)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year_desc">Year (Newest First)</SelectItem>
                      <SelectItem value="year_asc">Year (Oldest First)</SelectItem>
                      <SelectItem value="citations_desc">Citations (Highest)</SelectItem>
                      <SelectItem value="title_asc">Title (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN PANEL: LIVE PREVIEW & EXPORT ACTIONS (8 COLS) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Top Action Bar: Export Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary bg-primary/5 border-primary/20 text-xs py-1 px-3">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-primary" /> Live PostgreSQL Query Preview
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => setIsSavingModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-medium"
                >
                  <Save className="h-3.5 w-3.5" /> Save Config
                </Button>

                <Button
                  onClick={() => exportExcelMutation.mutate(payload)}
                  disabled={exportExcelMutation.isPending || isPreviewLoading}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  {exportExcelMutation.isPending ? "Generating..." : "Export Excel (.CSV)"}
                </Button>

                <Button
                  onClick={() => exportPdfMutation.mutate(payload)}
                  disabled={exportPdfMutation.isPending || isPreviewLoading}
                  size="sm"
                  className="gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {exportPdfMutation.isPending ? "Generating..." : "Export PDF / Print"}
                </Button>
              </div>
            </div>

            {/* Save Config Modal Form */}
            {isSavingModalOpen && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Save Report Configuration
                </h3>
                <Input
                  placeholder="e.g. 2025 NAAC CSE Research Report"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="h-9 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsSavingModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
                    {saveConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </div>
            )}

            {/* Executive Metric Cards */}
            {previewData && (
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
                  <p className="text-xs text-muted-foreground font-medium">Total Publications</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{previewData.total}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
                  <p className="text-xs text-muted-foreground font-medium">Total Citations</p>
                  <p className="text-2xl font-bold text-primary mt-1">{previewData.summary.totalCitations}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
                  <p className="text-xs text-muted-foreground font-medium">Avg Citations / Paper</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{previewData.summary.avgCitations}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
                  <p className="text-xs text-muted-foreground font-medium">Published Count</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{previewData.summary.publishedCount}</p>
                </div>
              </div>
            )}

            {/* Group Summaries if active */}
            {previewData && previewData.groupSummaries && previewData.groupSummaries.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Grouped Breakdown ({grouping.toUpperCase()})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {previewData.groupSummaries.map((g: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs py-1 px-2.5">
                      {g.name || g.year}: {g.count} Papers ({g.citations} Citations)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Live Data Preview Table */}
            <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Data Preview ({previewData ? previewData.records.length : 0} of {previewData ? previewData.total : 0} Records)
                </span>
                {isPreviewLoading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
              </div>

              {isPreviewLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !previewData || previewData.records.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">No Research Papers Match Filter Criteria</p>
                  <p className="text-xs text-muted-foreground mt-1">Try broadening your year range or status filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        {selectedColumns.map((colKey) => {
                          const col = ALL_AVAILABLE_COLUMNS.find((c) => c.key === colKey) || { key: colKey, label: colKey };
                          return (
                            <th key={col.key} className="px-4 py-3 font-semibold whitespace-nowrap">
                              {col.label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewData.records.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                          {selectedColumns.map((colKey) => {
                            const col = ALL_AVAILABLE_COLUMNS.find((c) => c.key === colKey) || { key: colKey, label: colKey };
                            return (
                              <td key={col.key} className="px-4 py-3 max-w-xs truncate">
                                {col.key === "status" ? (
                                  <Badge variant="outline" className="text-[10px] font-semibold py-0.5">
                                    {row[col.key]}
                                  </Badge>
                                ) : col.key === "citationCount" ? (
                                  <span className="font-bold text-primary">{row[col.key]}</span>
                                ) : (
                                  row[col.key] || "—"
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAVED CONFIGURATIONS */}
      {activeTab === "saved" && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" /> Saved Report Configurations
          </h2>
          <p className="text-xs text-muted-foreground">
            Reuse pre-configured institutional filtering templates for NAAC, NIRF, and Departmental audits.
          </p>

          {savedReportsList.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl">
              <Save className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">No Saved Configurations Found</p>
              <p className="text-xs text-muted-foreground mt-1">Configure filters in Report Builder and click "Save Config".</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedReportsList.map((s: any) => (
                <div key={s.id} className="rounded-xl border border-border bg-background p-4 space-y-3 hover:border-primary/40 transition-colors">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description || s.reportType}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      Type: {s.reportType}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      Cols: {s.columns?.length || 0}
                    </Badge>
                  </div>
                  <Button size="sm" onClick={() => handleLoadSavedConfig(s)} className="w-full gap-1.5 text-xs">
                    Load Configuration
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT HISTORY */}
      {activeTab === "history" && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Institutional Report Audit History
          </h2>
          <p className="text-xs text-muted-foreground">
            Traceability log of all Excel downloads and PDF report generations across users.
          </p>

          {historyList.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl">
              <History className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">No Report History Logged Yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Report Title</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Records</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historyList.map((h: any) => (
                    <tr key={h.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{h.title}</td>
                      <td className="px-4 py-3">{h.user?.name || "System User"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={h.format === "EXCEL" ? "outline" : "secondary"} className="text-[10px]">
                          {h.format}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-bold text-primary">{h.recordCount}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(h.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
