import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Quote, GraduationCap, Building2, Mail, Users, FileText, CheckCircle2, Eye, BookOpen, Loader2, Award, Book, Layers, Filter } from "lucide-react";
import type { FacultyItem } from "@/services/faculty.service";
import { useFacultyDetail } from "../hooks/useFaculty";
import { ResearchDetailModal } from "@/features/research/components/ResearchDetailModal";
import type { ResearchItem } from "@/services/research.service";

interface PublicFacultyProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faculty: FacultyItem | null;
}

export function PublicFacultyProfileModal({ open, onOpenChange, faculty }: PublicFacultyProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "publications" | "profile">("overview");
  const [search, setSearch] = useState("");
  const [venueFilter, setVenueFilter] = useState<"ALL" | "JOURNAL" | "CONFERENCE" | "PATENT" | "BOOK" | "OTHER">("ALL");
  const [selectedResearch, setSelectedResearch] = useState<ResearchItem | null>(null);

  // Fetch full faculty details including all publications
  const { data: detailRes, isLoading: isDetailLoading } = useFacultyDetail(open ? faculty?.id : undefined);

  if (!faculty) return null;

  const targetFaculty = detailRes?.faculty || faculty;
  const user = targetFaculty.user;
  const dept = targetFaculty.department;

  // Merge publications list
  const rawList = (targetFaculty as any).publications || (targetFaculty as any).researchAuthorships?.map((ra: any) => ra.research) || [];
  const allPublications: ResearchItem[] = rawList.filter((p: any) => p && p.title);

  // Filter publications by search term AND venue type category
  const filteredPublications = allPublications.filter((p) => {
    const text = `${p.title || ""} ${p.journal || ""} ${p.conference || ""}`.toLowerCase();
    const type = p.venueType || (
      /patent/i.test(text) ? "PATENT" :
      /isbn/i.test(text) ? "BOOK" :
      p.conference ? "CONFERENCE" : "JOURNAL"
    );

    let matchesCategory = true;
    if (venueFilter === "JOURNAL") matchesCategory = type === "JOURNAL" || (!!p.journal && !p.conference && type !== "PATENT" && type !== "BOOK");
    else if (venueFilter === "CONFERENCE") matchesCategory = type === "CONFERENCE" || (!!p.conference && !p.journal && type !== "PATENT" && type !== "BOOK");
    else if (venueFilter === "PATENT") matchesCategory = type === "PATENT" || /patent/i.test(text);
    else if (venueFilter === "BOOK") matchesCategory = type === "BOOK" || /isbn/i.test(text);
    else if (venueFilter === "OTHER") matchesCategory = type === "OTHER";

    if (!matchesCategory) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.abstract?.toLowerCase().includes(q) ||
      p.doi?.toLowerCase().includes(q) ||
      p.journal?.toLowerCase().includes(q) ||
      p.patentNumber?.toLowerCase().includes(q) ||
      p.isbn?.toLowerCase().includes(q)
    );
  });

  const getVenueBadge = (p: ResearchItem) => {
    const text = `${p.title || ""} ${p.journal || ""} ${p.conference || ""}`.toLowerCase();
    const type = p.venueType || (
      /patent/i.test(text) ? "PATENT" :
      /isbn/i.test(text) ? "BOOK" :
      p.conference ? "CONFERENCE" : "JOURNAL"
    );

    if (type === "PATENT" || /patent/i.test(text)) {
      return (
        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 font-semibold">
          <Award className="h-3 w-3" /> Patent {p.patentNumber ? `— ${p.patentNumber}` : ""}
        </Badge>
      );
    }
    if (type === "BOOK" || /isbn/i.test(text)) {
      return (
        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 font-semibold">
          <Book className="h-3 w-3" /> Book / ISBN {p.isbn ? `— ${p.isbn}` : ""}
        </Badge>
      );
    }
    if (type === "CONFERENCE" || p.conference) {
      return (
        <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30 gap-1 font-semibold">
          <Layers className="h-3 w-3" /> Conference
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-semibold">
        <BookOpen className="h-3 w-3" /> Journal
      </Badge>
    );
  };

  // Avatar image fallback handler
  const avatarSrc = user?.avatarUrl || (targetFaculty.scholarUrl ? `https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=${targetFaculty.scholarUrl.split("user=")[1]?.split("&")[0] || ""}` : null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
          {/* Top Header Branding */}
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user?.name || "Faculty Avatar"}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover border-2 border-primary/30 shadow-md shadow-primary/10"
                  />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-emerald-500 text-white font-bold text-xl shadow-md shadow-primary/20">
                    {user?.name ? user.name[0] : "F"}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-bold text-foreground leading-tight">
                      {user?.name}
                    </DialogTitle>
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1 text-[10px] uppercase font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Public Scholar Profile
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-primary mt-1">
                    {targetFaculty.designation} • {dept?.name} ({dept?.code})
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {user?.email} • Emp ID: {targetFaculty.employeeId}
                  </p>
                </div>
              </div>

              {/* Quick External Identifiers */}
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                {targetFaculty.orcid ? (
                  <a
                    href={`https://orcid.org/${targetFaculty.orcid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-xs"
                  >
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white font-serif text-[10px] font-extrabold">
                      iD
                    </span>
                    <span>ORCID: {targetFaculty.orcid}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Badge variant="outline" className="text-xs text-amber-600 bg-amber-500/10 border-amber-500/30">
                    ORCID Not Linked
                  </Badge>
                )}

                {targetFaculty.scholarUrl && (
                  <a
                    href={targetFaculty.scholarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-500/30 hover:bg-blue-500/20 transition-all shadow-xs"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Google Scholar Profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                {targetFaculty.scopusAuthorId ? (
                  <a
                    href={targetFaculty.scopusUrl || `https://www.scopus.com/authid/detail.uri?authorId=${targetFaculty.scopusAuthorId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-500/30 hover:bg-amber-500/20 transition-all shadow-xs"
                  >
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-600 text-white font-sans text-[9px] font-bold">
                      Sc
                    </span>
                    <span>Scopus: {targetFaculty.scopusAuthorId}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>

            {/* 3-Tab Public Workspace Navigation */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-all ${
                  activeTab === "overview"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Building2 className="h-3.5 w-3.5" /> Overview & Metrics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("publications")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-all ${
                  activeTab === "publications"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Publications ({allPublications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-all ${
                  activeTab === "profile"
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Users className="h-3.5 w-3.5" /> Profile & Scholar
              </button>
            </div>
          </DialogHeader>

          {/* TAB 1: OVERVIEW & METRICS */}
          {activeTab === "overview" && (
            <div className="space-y-6 py-3">
              {/* Welcome Banner */}
              <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-navy px-5 py-5 text-navy-foreground shadow-card">
                <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />
                <div className="pointer-events-none absolute -top-20 -right-12 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white">
                    Public Researcher Dashboard: {user?.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 max-w-xl">
                    Live publication metrics, citation trajectory, and open-access bibliographic records synced via Google Scholar SERP API, OpenAlex, and Crossref.
                  </p>
                </div>
              </div>

              {/* 4 Citation & Publication Metrics Cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>Publications</span>
                    <BookOpen className="h-4 w-4 text-cyan-500" />
                  </div>
                  <p className="text-3xl font-extrabold text-cyan-600">
                    {allPublications.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Indexed Papers</p>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>Total Citations</span>
                    <Quote className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-3xl font-extrabold text-primary">
                    {targetFaculty.totalCitations || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Scholar SERP Synced</p>
                </div>

                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>h-index Score</span>
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="text-3xl font-extrabold text-indigo-600">
                    {targetFaculty.hIndex || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Impact Score</p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>i10-index Score</span>
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-600">
                    {targetFaculty.i10Index || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">≥10 Citation Papers</p>
                </div>
              </div>

              {/* Research Interests */}
              {targetFaculty.researchInterests && targetFaculty.researchInterests.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Research Interests & Domain Specialization
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {targetFaculty.researchInterests.map((interest, i) => (
                      <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-1">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PUBLICATIONS & RESEARCH */}
          {activeTab === "publications" && (
            <div className="space-y-4 py-3">
              {/* Category Filter Tabs & Search Bar */}
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
                {/* 6 Venue Category Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2.5">
                  <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-primary" /> Filter Category:
                  </span>
                  {[
                    { id: "ALL", label: "All Types" },
                    { id: "JOURNAL", label: "Journals" },
                    { id: "CONFERENCE", label: "Conferences" },
                    { id: "PATENT", label: "Patents" },
                    { id: "BOOK", label: "Books & ISBN" },
                    { id: "OTHER", label: "Others" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setVenueFilter(tab.id as any)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        venueFilter === tab.id
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                  <input
                    type="text"
                    placeholder="Search publications by title, DOI, venue, patent number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 pl-9 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <FileText className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {filteredPublications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
                  No research papers match your search or category filter.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredPublications.map((paper) => (
                    <div
                      key={paper.id}
                      className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:border-primary/40 hover:shadow-card"
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {getVenueBadge(paper)}
                            <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                              {paper.publicationYear}
                            </Badge>
                          </div>
                          {paper.citationCount > 0 && (
                            <Badge variant="outline" className="text-[10px] font-medium text-amber-700 bg-amber-500/10 border-amber-500/30 gap-1 py-0">
                              <Quote className="h-2.5 w-2.5" /> {paper.citationCount} Citations
                            </Badge>
                          )}
                        </div>

                        <h5 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                          {paper.title}
                        </h5>

                        {/* Authors & Co-Authors */}
                        {paper.authors && paper.authors.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            <span className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase mr-0.5 flex items-center gap-0.5">
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

                        {/* Multi-Source Provenance Tags */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {paper.doi ? (
                            <Badge variant="outline" className="text-[10px] font-medium text-emerald-700 bg-emerald-500/10 border-emerald-500/30 py-0">
                              OpenAlex / Crossref Verified
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
                      </div>

                      <div className="mt-4 border-t border-border pt-3 flex items-center justify-between">
                        {paper.doi ? (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary font-mono truncate hover:underline"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{paper.doi}</span>
                          </a>
                        ) : paper.pdfUrl ? (
                          <a
                            href={paper.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium truncate hover:underline"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">View Publication Link</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Repository Record</span>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedResearch(paper)}
                          className="gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10 shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE & SCHOLAR DETAILS */}
          {activeTab === "profile" && (
            <div className="space-y-5 py-3">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-soft">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" /> Academic Profile & Identifiers
                </h4>

                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                    <span className="text-muted-foreground">Faculty Member:</span>
                    <p className="font-bold text-foreground text-sm">{user?.name}</p>
                    <p className="text-muted-foreground text-[11px]">{user?.email}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                    <span className="text-muted-foreground">Designation & Role:</span>
                    <p className="font-bold text-primary text-sm">{faculty.designation}</p>
                    <p className="text-muted-foreground text-[11px]">Employee ID: {faculty.employeeId}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                    <span className="text-muted-foreground">Department:</span>
                    <p className="font-bold text-foreground text-sm">{dept?.name} ({dept?.code})</p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                    <span className="text-muted-foreground">ORCID iD Handle:</span>
                    {faculty.orcid ? (
                      <a
                        href={`https://orcid.org/${faculty.orcid}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-600 flex items-center gap-1 hover:underline text-sm"
                      >
                        <span>ORCID: {faculty.orcid}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="italic text-muted-foreground">Not Linked</p>
                    )}
                  </div>
                </div>

                {faculty.scholarUrl && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4" /> Google Scholar Profile Active
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-md">
                        {faculty.scholarUrl}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="text-xs text-blue-700 border-blue-500/30 gap-1">
                      <a href={faculty.scholarUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> Visit Scholar Page
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Research Detail Modal for Multi-Source Provenance */}
      <ResearchDetailModal
        open={Boolean(selectedResearch)}
        onOpenChange={(isOpen) => !isOpen && setSelectedResearch(null)}
        research={selectedResearch}
      />
    </>
  );
}
