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
  Users,
  ExternalLink,
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
  { key: "facultyName", label: "Faculty Name" },
  { key: "employeeId", label: "Employee ID" },
  { key: "department", label: "Department" },
  { key: "hIndex", label: "Scholar h-index" },
  { key: "i10Index", label: "Scholar i10-index" },
  { key: "totalCitations", label: "Scholar Citations" },
  { key: "publicationCount", label: "Total Publications" },
  { key: "scholarUrl", label: "Google Scholar Profile URL" },
  { key: "email", label: "Faculty Email" },
  { key: "title", label: "Paper Title & Abstract" },
  { key: "authors", label: "All Authors" },
  { key: "primaryAuthor", label: "Primary Author" },
  { key: "coAuthors", label: "Co-Author(s)" },
  { key: "journal", label: "Journal / Conference" },
  { key: "publicationYear", label: "Publication Year" },
  { key: "abstract", label: "Paper Abstract" },
  { key: "abstractSource", label: "Abstract Source Tag" },
  { key: "citationCount", label: "Citation Count" },
  { key: "doi", label: "DOI Handle" },
  { key: "researchArea", label: "Research Area" },
  { key: "status", label: "Publication Status" },
  { key: "lastSyncTime", label: "Last Synced Date" },
];

const FACULTY_TOTALS_COLUMNS = [
  "facultyName",
  "employeeId",
  "department",
  "publicationCount",
  "totalCitations",
  "hIndex",
  "i10Index",
  "scholarUrl",
  "email",
];

const PAPER_WISE_COLUMNS = [
  "facultyName",
  "title",
  "primaryAuthor",
  "coAuthors",
  "department",
  "journal",
  "publicationYear",
  "citationCount",
  "doi",
  "status",
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
  const [viewMode, setViewMode] = useState<"FACULTY_TOTALS" | "PAPER_WISE">("FACULTY_TOTALS");
  const [reportType, setReportType] = useState<string>("FACULTY_PUBLICATION");
  const [departmentId, setDepartmentId] = useState<string>("ALL");
  const [facultyId, setFacultyId] = useState<string>("ALL");
  const [yearStart, setYearStart] = useState<string>("");
  const [yearEnd, setYearEnd] = useState<string>("");
  const [researchArea, setResearchArea] = useState<string>("");
  const [status, setStatus] = useState<string>("ALL");
  const [journalOrConference, setJournalOrConference] = useState<"JOURNAL" | "CONFERENCE" | "ALL">("ALL");
  const [citationMin, setCitationMin] = useState<string>("0");
  const [search, setSearch] = useState<string>("");
  const [grouping, setGrouping] = useState<"department" | "year" | "status" | "faculty" | "none">("none");
  const [sorting, setSorting] = useState<
    | "year_desc"
    | "year_asc"
    | "citations_desc"
    | "citations_asc"
    | "title_asc"
    | "hindex_desc"
    | "hindex_asc"
    | "i10_desc"
    | "i10_asc"
    | "publications_desc"
  >("hindex_desc");

  // Columns Selected
  const [selectedColumns, setSelectedColumns] = useState<string[]>(FACULTY_TOTALS_COLUMNS);

  // Saved Config Modal
  const [saveName, setSaveName] = useState("");
  const [isSavingModalOpen, setIsSavingModalOpen] = useState(false);

  // Selected Template Object
  const currentTemplate = templates.find((t) => t.id === reportType) || {
    id: "FACULTY_PUBLICATION",
    title: "Faculty-Wise Research & Scholar Totals Report",
    category: "Faculty Summary",
    description: "Total for each faculty member: Total publications, total citations, h-index, i10-index, and Google Scholar profile metrics (not paper-wise).",
  };

  // Payload for Query Preview
  const payload: ReportFilterPayload = {
    reportType,
    viewMode,
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

  // Switch modes between Faculty Totals and Paper-Wise
  const switchToFacultyTotalsMode = () => {
    setViewMode("FACULTY_TOTALS");
    setReportType("FACULTY_PUBLICATION");
    setSelectedColumns(FACULTY_TOTALS_COLUMNS);
    setSorting("hindex_desc");
  };

  const switchToPaperWiseMode = () => {
    setViewMode("PAPER_WISE");
    setReportType("INSTITUTIONAL");
    setSelectedColumns(PAPER_WISE_COLUMNS);
    setSorting("year_desc");
  };

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
    if (viewMode === "FACULTY_TOTALS") {
      setSelectedColumns(["facultyName", "publicationCount", "totalCitations", "hIndex"]);
    } else {
      setSelectedColumns(["title", "authors", "citationCount"]);
    }
  };

  const handleSelectTemplate = (tId: string) => {
    setReportType(tId);
    if (tId === "FACULTY_PUBLICATION" || tId === "SCHOLAR_RESEARCHER") {
      setViewMode("FACULTY_TOTALS");
      setSelectedColumns(FACULTY_TOTALS_COLUMNS);
      setSorting("hindex_desc");
    } else {
      setViewMode("PAPER_WISE");
      const tmpl = templates.find((t) => t.id === tId);
      if (tmpl && tmpl.defaultColumns) {
        setSelectedColumns(tmpl.defaultColumns);
      } else {
        setSelectedColumns(PAPER_WISE_COLUMNS);
      }
      setSorting("year_desc");
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
        <div className="space-y-6">
          {/* REPORT GRANULARITY & MODE TOGGLE */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-soft">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-0.5">
                  Report Granularity
                </Badge>
                <span className="text-sm font-bold text-foreground">
                  {viewMode === "FACULTY_TOTALS"
                    ? "👥 Faculty-Wise Summary (Total for Each Faculty)"
                    : "📄 Paper-Wise Detailed (Individual Manuscripts)"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {viewMode === "FACULTY_TOTALS"
                  ? "Displays 1 row per faculty member with their total publications, total citations, Scholar h-index, and i10-index."
                  : "Displays individual research paper manuscripts, authors, journals, DOIs, and citation counts."}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-xl p-1.5 shadow-sm self-start sm:self-auto">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "FACULTY_TOTALS" ? "default" : "ghost"}
                onClick={switchToFacultyTotalsMode}
                className={`text-xs h-8 gap-1.5 px-4 font-semibold transition-all ${
                  viewMode === "FACULTY_TOTALS"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-3.5 w-3.5" /> Total for Each Faculty
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "PAPER_WISE" ? "default" : "ghost"}
                onClick={switchToPaperWiseMode}
                className={`text-xs h-8 gap-1.5 px-4 font-semibold transition-all ${
                  viewMode === "PAPER_WISE"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Paper-Wise Detailed
              </Button>
            </div>
          </div>

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

              <div className="pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant={reportType === "SCHOLAR_RESEARCHER" ? "default" : "outline"}
                  onClick={() => handleSelectTemplate("SCHOLAR_RESEARCHER")}
                  className={`w-full text-xs font-semibold gap-1.5 h-8.5 transition-all ${
                    reportType === "SCHOLAR_RESEARCHER"
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm ring-2 ring-blue-500/20"
                      : "border-blue-500/30 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
                  }`}
                >
                  🎓 Faculty Google Scholar Report (h-index & i10)
                </Button>
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
                  <Select
                    value={grouping}
                    onValueChange={(v: any) => {
                      setGrouping(v);
                      if (v === "faculty") {
                        switchToFacultyTotalsMode();
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="No Grouping" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Grouping</SelectItem>
                      <SelectItem value="faculty">Faculty Member (Total for each faculty)</SelectItem>
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
                      <SelectItem value="hindex_desc">h-index (Highest First)</SelectItem>
                      <SelectItem value="hindex_asc">h-index (Lowest First)</SelectItem>
                      <SelectItem value="i10_desc">i10-index (Highest First)</SelectItem>
                      <SelectItem value="citations_desc">Citations (Highest First)</SelectItem>
                      <SelectItem value="publications_desc">Publications (Highest First)</SelectItem>
                      <SelectItem value="year_desc">Year (Newest First)</SelectItem>
                      <SelectItem value="year_asc">Year (Oldest First)</SelectItem>
                      <SelectItem value="title_asc">Name / Title (A-Z)</SelectItem>
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
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
                    <p className="text-xs text-muted-foreground font-medium">
                      {viewMode === "FACULTY_TOTALS" ? "Total Faculty Members" : "Total Publications"}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">{previewData.total}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
                    <p className="text-xs text-muted-foreground font-medium">
                      {viewMode === "FACULTY_TOTALS" ? "Total Publications (All Faculty)" : "Total Citations"}
                    </p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {viewMode === "FACULTY_TOTALS"
                        ? (previewData.summary?.totalPublications ?? previewData.total)
                        : previewData.summary.totalCitations}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
                    <p className="text-xs text-muted-foreground font-medium">
                      {viewMode === "FACULTY_TOTALS" ? "Total Citations" : "Avg Citations / Paper"}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {viewMode === "FACULTY_TOTALS"
                        ? previewData.summary.totalCitations
                        : previewData.summary.avgCitations}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
                    <p className="text-xs text-muted-foreground font-medium">
                      {viewMode === "FACULTY_TOTALS" ? "Avg Citations / Paper" : "Published Count"}
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      {viewMode === "FACULTY_TOTALS"
                        ? previewData.summary.avgCitations
                        : previewData.summary.publishedCount}
                    </p>
                  </div>
                </div>

                {/* Official Bibliometric Index Cards (Google Scholar, Scopus, WoS) */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Scholar Card */}
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                        🎓 Google Scholar Index
                      </span>
                      <Badge variant="outline" className="text-[9px] bg-background text-blue-600 border-blue-500/30">Verified</Badge>
                    </div>
                    <div className="text-xs text-foreground/90 space-y-0.5 pt-1">
                      <div>Total Citations: <strong className="text-blue-700 dark:text-blue-400">{previewData.summary.scholarCitations || previewData.summary.totalCitations}</strong></div>
                      <div>h-index: <strong>{previewData.summary.scholarHIndex || 0}</strong> | i10-index: <strong>{previewData.summary.scholarI10Index || 0}</strong></div>
                    </div>
                  </div>

                  {/* Scopus Card */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        ⚡ Scopus Index
                      </span>
                      <Badge variant="outline" className="text-[9px] bg-background text-amber-600 border-amber-500/30">Synced</Badge>
                    </div>
                    <div className="text-xs text-foreground/90 space-y-0.5 pt-1">
                      <div>Scopus Citations: <strong className="text-amber-700 dark:text-amber-400">{previewData.summary.scopusCitations || 0}</strong></div>
                      <div>Scopus h-index: <strong>{previewData.summary.scopusHIndex || 0}</strong> | Docs: <strong>{previewData.summary.scopusPublicationCount || 0}</strong></div>
                    </div>
                  </div>

                  {/* Web of Science Card */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        🌐 Web of Science / Open Science
                      </span>
                      <Badge variant="outline" className="text-[9px] bg-background text-emerald-600 border-emerald-500/30">Peer-Reviewed</Badge>
                    </div>
                    <div className="text-xs text-foreground/90 space-y-0.5 pt-1">
                      <div>WoS Papers: <strong className="text-emerald-700 dark:text-emerald-400">{previewData.summary.wosPublicationCount || 0}</strong></div>
                      <div>Avg Citations: <strong>{previewData.summary.avgCitations}</strong></div>
                    </div>
                  </div>
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
                  Data Preview ({previewData ? previewData.records.length : 0} of {previewData ? previewData.total : 0}{" "}
                  {viewMode === "FACULTY_TOTALS" ? "Faculty Members — Totals Summary" : "Research Papers — Detailed Manuscripts"})
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
                  <p className="text-sm font-medium">
                    {viewMode === "FACULTY_TOTALS" ? "No Faculty Members Match Filter Criteria" : "No Research Papers Match Filter Criteria"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {viewMode === "FACULTY_TOTALS" ? "Try selecting All Departments or clearing the search keyword." : "Try broadening your year range or status filters."}
                  </p>
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
                              <td key={col.key} className="px-4 py-3 max-w-sm">
                                {col.key === "status" ? (
                                  <Badge variant="outline" className="text-[10px] font-semibold py-0.5">
                                    {row[col.key]}
                                  </Badge>
                                ) : col.key === "hIndex" ? (
                                  <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold py-0.5 px-2">
                                    h: {row[col.key] ?? 0}
                                  </Badge>
                                ) : col.key === "i10Index" ? (
                                  <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[11px] font-bold py-0.5 px-2">
                                    i10: {row[col.key] ?? 0}
                                  </Badge>
                                ) : col.key === "totalCitations" ? (
                                  <span className="font-bold text-amber-600 dark:text-amber-400">
                                    🎓 {row[col.key] ?? 0}
                                  </span>
                                ) : col.key === "publicationCount" ? (
                                  <span className="font-semibold text-foreground">
                                    📄 {row[col.key] ?? 0}
                                  </span>
                                ) : col.key === "scholarUrl" ? (
                                  row[col.key] && row[col.key] !== "N/A" ? (
                                    <a
                                      href={row[col.key]}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-xs truncate max-w-[180px]"
                                      title={row[col.key]}
                                    >
                                      <span>Scholar Profile</span>
                                      <span className="text-[10px]">↗</span>
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )
                                ) : col.key === "facultyName" ? (
                                  <span className="font-semibold text-foreground">{row[col.key] || "—"}</span>
                                ) : col.key === "employeeId" ? (
                                  <span className="font-mono text-[11px] text-muted-foreground">{row[col.key] || "—"}</span>
                                ) : col.key === "email" ? (
                                  <span className="text-muted-foreground text-xs">{row[col.key] || "—"}</span>
                                ) : col.key === "lastSyncTime" ? (
                                  <Badge variant="outline" className="text-[10px] bg-muted/40 text-muted-foreground">
                                    {row[col.key] || "—"}
                                  </Badge>
                                ) : col.key === "citationCount" ? (
                                  <span className="font-bold text-amber-600 dark:text-amber-400">🎓 {row[col.key]}</span>
                                ) : col.key === "abstract" ? (
                                  <div className="space-y-1">
                                    <p className="text-[11px] text-foreground/90 line-clamp-3 leading-relaxed">
                                      {row.abstract}
                                    </p>
                                    <Badge variant="outline" className="text-[9px] bg-muted/40 text-blue-600 dark:text-blue-400 border-blue-500/20 font-semibold">
                                      {row.abstractSource}
                                    </Badge>
                                  </div>
                                ) : col.key === "abstractSource" ? (
                                  <Badge variant="outline" className="text-[9px] bg-muted/40 text-blue-600 dark:text-blue-400 border-blue-500/20 font-semibold">
                                    {row[col.key]}
                                  </Badge>
                                ) : col.key === "title" ? (
                                  <div className="space-y-1">
                                    <p className="font-semibold text-foreground">{row.title}</p>
                                    {row.abstract && row.abstract !== "Abstract unavailable." && (
                                      <p className="text-[10.5px] text-muted-foreground line-clamp-2 italic">
                                        "{row.abstract}"
                                      </p>
                                    )}
                                    <Badge variant="outline" className="text-[9px] bg-muted/30 text-purple-600 dark:text-purple-400 border-purple-500/20">
                                      {row.abstractSource}
                                    </Badge>
                                  </div>
                                ) : col.key === "doi" || col.key === "issnDoi" ? (
                                  row.doi && row.doi !== "N/A" && row.doi.trim() !== "" ? (
                                    <a
                                      href={`https://doi.org/${row.doi.replace(/^https?:\/\/doi\.org\//, "").trim()}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-600 hover:text-emerald-700 hover:underline font-mono text-[11px] inline-flex items-center gap-1 font-semibold"
                                      title={`Open DOI: ${row.doi}`}
                                    >
                                      <span>doi:{row.doi.replace(/^https?:\/\/doi\.org\//, "").trim()}</span>
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )
                                ) : col.key === "primaryAuthor" ? (
                                  <span className="font-semibold text-foreground text-xs">{row.primaryAuthor || "—"}</span>
                                ) : col.key === "coAuthors" ? (
                                  <span className="text-muted-foreground text-xs">{row.coAuthors || "—"}</span>
                                ) : (
                                  <span className="truncate block max-w-xs">{row[col.key] || "—"}</span>
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
