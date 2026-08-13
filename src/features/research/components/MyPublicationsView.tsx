import { useState } from "react";
import { FileStack, Plus, Search, RefreshCw, ExternalLink, ChevronLeft, ChevronRight, Eye, CheckCircle2, Clock3, XCircle, AlertCircle, Quote, Users, Filter, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMyResearchList } from "../hooks/useResearch";
import { ResearchSubmissionModal } from "./ResearchSubmissionModal";
import { ResearchDetailModal } from "./ResearchDetailModal";
import type { ResearchItem, ResearchStatusType } from "@/services/research.service";

export function MyPublicationsView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedResearch, setSelectedResearch] = useState<ResearchItem | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // Filters
  const [venueFilter, setVenueFilter] = useState<"ALL" | "JOURNAL" | "CONFERENCE">("ALL");
  const [statusFilter, setStatusFilter] = useState<ResearchStatusType | "ALL">("ALL");

  const { data, isLoading } = useMyResearchList({
    search: search || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page,
    limit: 12,
  });

  const rawPublications = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, totalPages: 1 };

  // Apply Venue Type Filtering (Journals vs Conferences)
  const publications = rawPublications.filter((p) => {
    if (venueFilter === "JOURNAL") return !!p.journal || !p.conference;
    if (venueFilter === "CONFERENCE") return !!p.conference && !p.journal;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "ACCEPTED":
      case "PUBLISHED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1 text-[10px] uppercase font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Published
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="gap-1 text-[10px] uppercase font-semibold">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      case "NEEDS_REVISION":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1 text-[10px] uppercase font-semibold">
            <AlertCircle className="h-3 w-3" /> Revision
          </Badge>
        );
      case "SUBMITTED":
      case "UNDER_REVIEW":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-[10px] uppercase font-semibold">
            <Clock3 className="h-3 w-3" /> Under Review
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            My Publications & Portfolio
            {pagination.total > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {pagination.total} Total
              </Badge>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personal research publication portfolio with venue classification & citation tracking.
          </p>
        </div>

        <Button onClick={() => setIsSubmitOpen(true)} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" /> Submit New Paper
        </Button>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl border border-border bg-card shadow-xs">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search my titles, keywords, or DOI..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Venue Type Filter Tabs (Journals vs Conferences) */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setVenueFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg transition ${
              venueFilter === "ALL" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Venues
          </button>
          <button
            type="button"
            onClick={() => setVenueFilter("JOURNAL")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              venueFilter === "JOURNAL" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" /> Journals
          </button>
          <button
            type="button"
            onClick={() => setVenueFilter("CONFERENCE")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              venueFilter === "CONFERENCE" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-amber-500" /> Conferences
          </button>
        </div>
      </div>

      {/* Status Filter Sub-Bar */}
      <div className="flex overflow-x-auto gap-1 text-xs pb-1">
        {[
          { label: "All Statuses", value: "ALL" },
          { label: "✓ Approved / Published", value: "APPROVED" },
          { label: "⏱ Under Review", value: "SUBMITTED" },
          { label: "⚠️ Revision Requested", value: "NEEDS_REVISION" },
          { label: "❌ Rejected", value: "REJECTED" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatusFilter(tab.value as any);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
              statusFilter === tab.value
                ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Publications Grid Layout */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-xs text-muted-foreground font-medium">Loading publications...</span>
        </div>
      ) : publications.length > 0 ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publications.map((paper) => (
              <div
                key={paper.id}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/40 hover:shadow-card"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(paper.status)}
                    <span className="text-xs font-mono text-muted-foreground">{paper.publicationYear}</span>
                  </div>

                  <div className="mt-2.5">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-primary/10 text-primary inline-block">
                      {paper.journal ? "JOURNAL" : paper.conference ? "CONFERENCE" : "PUBLICATION"}
                    </span>
                  </div>

                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                    {paper.title}
                  </h3>

                  {/* Authors & Co-Authors */}
                  {paper.authors && paper.authors.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase mr-0.5 flex items-center gap-1">
                        <Users className="h-3 w-3 text-primary shrink-0" /> Authors:
                      </span>
                      {paper.authors.map((author, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md bg-muted/70 px-1.5 py-0.5 text-[10px] font-semibold text-foreground border border-border/50"
                        >
                          {author.authorName}
                          {author.isCorresponding && (
                            <span className="ml-0.5 text-primary font-bold text-[9px]">(Corresponding)</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Multi-Source Citation Badges */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {paper.citationCount > 0 && (
                      <Badge variant="outline" className="text-[10px] font-medium text-amber-700 bg-amber-500/10 border-amber-500/30 gap-1 py-0">
                        <span className="font-bold">Scholar SERP API</span>: {paper.citationCount} Citations
                      </Badge>
                    )}
                    {paper.doi ? (
                      <Badge variant="outline" className="text-[10px] font-medium text-emerald-700 bg-emerald-500/10 border-emerald-500/30 gap-1 py-0">
                        <span className="font-bold">OpenAlex / Crossref</span>: DOI Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-medium text-slate-600 bg-slate-500/10 border-slate-500/20 py-0">
                        Institutional DB Entry
                      </Badge>
                    )}
                  </div>

                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {paper.abstract}
                  </p>

                  {paper.doi ? (
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center gap-1 text-[11px] text-primary font-mono truncate hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{paper.doi}</span>
                    </a>
                  ) : paper.pdfUrl ? (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center gap-1 text-[11px] text-emerald-600 font-medium truncate hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">View Publication Link</span>
                    </a>
                  ) : (
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground italic truncate">
                      <span>Institutional Repository Record</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-border pt-3 flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs font-semibold text-primary gap-1">
                    <Quote className="h-3 w-3" /> {paper.citationCount} Citations
                  </Badge>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedResearch(paper)}
                    className="gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs shadow-soft">
              <span className="text-muted-foreground">
                Page <strong className="text-foreground">{pagination.page}</strong> of{" "}
                <strong className="text-foreground">{pagination.totalPages}</strong> ({pagination.total} total items)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="gap-1 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <FileStack className="h-8 w-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium text-foreground">No publications found under selected filter</p>
          <p className="mt-0.5 text-xs text-muted-foreground max-w-sm">
            Try switching filter tabs or clearing your search term.
          </p>
          <Button size="sm" onClick={() => setIsSubmitOpen(true)} className="mt-4 gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Submit First Publication
          </Button>
        </div>
      )}

      <ResearchSubmissionModal open={isSubmitOpen} onOpenChange={setIsSubmitOpen} />
      <ResearchDetailModal
        open={!!selectedResearch}
        onOpenChange={(open) => !open && setSelectedResearch(null)}
        research={selectedResearch}
      />
    </div>
  );
}
