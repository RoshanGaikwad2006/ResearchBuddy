import { useState } from "react";
import { FileStack, Plus, Search, RefreshCw, ExternalLink, ChevronLeft, ChevronRight, Eye, CheckCircle2, Clock3, XCircle, AlertCircle, Quote, Users, Filter, BookOpen, Layers, Award, Book, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMyResearchList } from "../hooks/useResearch";
import { ResearchSubmissionModal } from "./ResearchSubmissionModal";
import { ResearchDetailModal } from "./ResearchDetailModal";
import type { ResearchItem, ResearchStatusType } from "@/services/research.service";
import { parseAuthorRoles } from "@/utils/authorFormatter";
import { getGoogleScholarUrl } from "@/utils/scholarLink";

const ITEMS_PER_PAGE = 12;

const getPublicationType = (p: ResearchItem): "JOURNAL" | "CONFERENCE" | "PATENT" | "BOOK" | "OTHER" => {
  const text = `${p.title || ""} ${p.journal || ""} ${p.conference || ""}`.toLowerCase();
  if (p.venueType === "PATENT" || /patent/i.test(text) || !!p.patentNumber) return "PATENT";
  if (p.venueType === "BOOK" || /isbn/i.test(text) || !!p.isbn) return "BOOK";
  if (p.venueType === "CONFERENCE" || (!!p.conference && !p.journal)) return "CONFERENCE";
  if (p.venueType === "JOURNAL" || (!!p.journal && !p.conference)) return "JOURNAL";
  if (p.venueType === "OTHER") return "OTHER";
  return p.conference ? "CONFERENCE" : "JOURNAL";
};

export function MyPublicationsView() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedResearch, setSelectedResearch] = useState<ResearchItem | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  // Filters
  const [venueFilter, setVenueFilter] = useState<"ALL" | "JOURNAL" | "CONFERENCE" | "PATENT" | "BOOK" | "OTHER">("ALL");
  const [statusFilter, setStatusFilter] = useState<ResearchStatusType | "ALL">("ALL");

  // Fetch user portfolio with sufficient limit to allow full client-side category classification & search
  const { data, isLoading } = useMyResearchList({
    limit: 200,
  });

  const allPublications = data?.items || [];

  // Dynamically compute real counts for every category across all publications
  const categoryCounts = {
    ALL: allPublications.length,
    JOURNAL: allPublications.filter((p) => getPublicationType(p) === "JOURNAL").length,
    CONFERENCE: allPublications.filter((p) => getPublicationType(p) === "CONFERENCE").length,
    PATENT: allPublications.filter((p) => getPublicationType(p) === "PATENT").length,
    BOOK: allPublications.filter((p) => getPublicationType(p) === "BOOK").length,
    OTHER: allPublications.filter((p) => getPublicationType(p) === "OTHER").length,
  };

  // Filter across all publications generally
  const filteredPublications = allPublications.filter((p) => {
    // 1. Status Filter
    if (statusFilter !== "ALL" && p.status !== statusFilter) {
      return false;
    }

    // 2. Category / Venue Filter
    if (venueFilter !== "ALL" && getPublicationType(p) !== venueFilter) {
      return false;
    }

    // 3. Search Query Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matches =
        p.title?.toLowerCase().includes(q) ||
        p.abstract?.toLowerCase().includes(q) ||
        p.journal?.toLowerCase().includes(q) ||
        p.conference?.toLowerCase().includes(q) ||
        p.patentNumber?.toLowerCase().includes(q) ||
        p.isbn?.toLowerCase().includes(q) ||
        p.authors?.some((a) => a.authorName?.toLowerCase().includes(q));

      if (!matches) return false;
    }

    return true;
  });

  // Client-side pagination over filtered results
  const totalFiltered = filteredPublications.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const publications = filteredPublications.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

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

  const getVenueBadge = (p: ResearchItem) => {
    const type = getPublicationType(p);

    if (type === "PATENT") {
      return (
        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 font-semibold">
          <Award className="h-3 w-3" /> Patent {p.patentNumber ? `— ${p.patentNumber}` : ""}
        </Badge>
      );
    }
    if (type === "BOOK") {
      return (
        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 font-semibold">
          <Book className="h-3 w-3" /> Book / ISBN {p.isbn ? `— ${p.isbn}` : ""}
        </Badge>
      );
    }
    if (type === "CONFERENCE") {
      return (
        <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30 gap-1 font-semibold">
          <Layers className="h-3 w-3" /> Conference
        </Badge>
      );
    }
    if (type === "OTHER") {
      return (
        <Badge variant="outline" className="text-[10px] bg-slate-500/10 text-slate-600 border-slate-500/30 gap-1 font-semibold">
          <FileText className="h-3 w-3" /> Other
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
        <BookOpen className="h-3 w-3" /> Journal
      </Badge>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            My Publications & Portfolio
            {allPublications.length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {allPublications.length} Total
              </Badge>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personal research portfolio with automatic Patents, Books, Journals & Conferences classification.
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
            placeholder="Search my titles, patents, ISBN, or keywords..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* 6 Category Filter Tabs with dynamic counts */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setVenueFilter("ALL");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              venueFilter === "ALL" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({categoryCounts.ALL})
          </button>
          <button
            type="button"
            onClick={() => {
              setVenueFilter("JOURNAL");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap ${
              venueFilter === "JOURNAL" ? "bg-card text-emerald-600 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" /> Journals ({categoryCounts.JOURNAL})
          </button>
          <button
            type="button"
            onClick={() => {
              setVenueFilter("CONFERENCE");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap ${
              venueFilter === "CONFERENCE" ? "bg-card text-indigo-500 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-indigo-500" /> Conferences ({categoryCounts.CONFERENCE})
          </button>
          <button
            type="button"
            onClick={() => {
              setVenueFilter("PATENT");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap ${
              venueFilter === "PATENT" ? "bg-card text-amber-600 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="h-3.5 w-3.5 text-amber-500" /> Patents ({categoryCounts.PATENT})
          </button>
          <button
            type="button"
            onClick={() => {
              setVenueFilter("BOOK");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap ${
              venueFilter === "BOOK" ? "bg-card text-purple-600 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Book className="h-3.5 w-3.5 text-purple-500" /> Books & ISBN ({categoryCounts.BOOK})
          </button>
          <button
            type="button"
            onClick={() => {
              setVenueFilter("OTHER");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 whitespace-nowrap ${
              venueFilter === "OTHER" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" /> Others ({categoryCounts.OTHER})
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
            className={`px-3 py-1 rounded-full border transition whitespace-nowrap ${
              statusFilter === tab.value
                ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Publications Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          Loading your publication portfolio...
        </div>
      ) : publications.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-card/50 p-8 space-y-3">
          <FileStack className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No publications found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {search
              ? "No publications matched your search query."
              : "No publications match the selected venue or status filter."}
          </p>
          {search && (
            <Button variant="outline" size="sm" onClick={() => setSearch("")} className="text-xs">
              Clear Search Query
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publications.map((pub) => (
            <div
              key={pub.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="space-y-3">
                {/* Header Badge Line */}
                <div className="flex items-center justify-between gap-2">
                  {getVenueBadge(pub)}
                  {getStatusBadge(pub.status)}
                </div>

                {/* Title */}
                <h3
                  onClick={() => setSelectedResearch(pub)}
                  className="text-sm font-bold text-foreground leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                >
                  {pub.title}
                </h3>

                {/* Abstract Snippet */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {pub.abstract || "Abstract snippet unavailable."}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-border/60 space-y-2 text-xs">
                {/* Authors Line with Main vs Co-Author Roles */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {(() => {
                      const roles = parseAuthorRoles(pub.authors);
                      if (roles.length === 0) return <span className="text-muted-foreground text-xs">Unknown Authors</span>;

                      const mainAuthor = roles.find((r) => r.isMainAuthor);
                      const corresponding = roles.find((r) => r.isCorresponding && !r.isMainAuthor);
                      const coAuthorsCount = roles.filter((r) => !r.isMainAuthor).length;

                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {mainAuthor && (
                            <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-amber-500/30 text-[10px] py-0 px-1.5 font-bold gap-1">
                              ⭐ Main: {mainAuthor.authorName}
                            </Badge>
                          )}
                          {corresponding && (
                            <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/20 border-blue-500/30 text-[10px] py-0 px-1.5 font-semibold gap-1">
                              ✉️ {corresponding.authorName}
                            </Badge>
                          )}
                          {coAuthorsCount > 0 && (
                            <span className="text-[11px] text-muted-foreground font-medium">
                              +{coAuthorsCount} Co-Author{coAuthorsCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Venue / Citation Stats */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {pub.publicationYear} • {pub.journal || pub.conference || "Institutional Repo"}
                  </span>
                  <span className="text-primary font-bold flex items-center gap-1">
                    <Quote className="h-3 w-3" /> {pub.citationCount || 0} Citations
                  </span>
                </div>

                {/* View Details & Direct Google Scholar Links */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/40 mt-1">
                  <div className="flex items-center gap-2 truncate">
                    <a
                      href={getGoogleScholarUrl(pub)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded shrink-0 transition-colors"
                      title="Open paper on Google Scholar"
                    >
                      🎓 Google Scholar
                    </a>

                    {pub.doi && (
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-medium text-emerald-600 hover:underline flex items-center gap-1 truncate"
                        title={`Open DOI: ${pub.doi}`}
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" /> DOI
                      </a>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedResearch(pub)}
                    className="h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/10 shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" /> Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-muted-foreground">
            Page {safePage} of {totalPages} ({totalFiltered} total {venueFilter === "ALL" ? "items" : venueFilter.toLowerCase() + "s"})
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ResearchSubmissionModal open={isSubmitOpen} onOpenChange={setIsSubmitOpen} />
      <ResearchDetailModal
        open={!!selectedResearch}
        onOpenChange={(o) => {
          if (!o) setSelectedResearch(null);
        }}
        research={selectedResearch}
      />
    </div>
  );
}
