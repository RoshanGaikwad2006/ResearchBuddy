import { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Globe,
  GraduationCap,
  Mail,
  Quote,
  RefreshCw,
  UserCheck,
  BookOpen,
  Award,
  Edit,
  ShieldAlert,
  Info,
  ExternalLink,
  Layers,
  FileText,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchMyResearchIdentity,
  updateMyResearchIdentity,
  syncMyResearchProfile,
  updateAuthorAffiliationApi,
  ResearchIdentityResponse,
} from "@/services/faculty.service";
import { useMyResearchList } from "@/features/research/hooks/useResearch";

export function FacultyProfileCard() {
  const [identity, setIdentity] = useState<ResearchIdentityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [scholarInput, setScholarInput] = useState("");
  const [orcidInput, setOrcidInput] = useState("");
  const [researcherId, setResearcherId] = useState("");
  const [interestsText, setInterestsText] = useState("");
  const [affiliationInput, setAffiliationInput] = useState("");

  const [activeTab, setActiveTab] = useState<"ALL" | "JOURNAL" | "CONFERENCE" | "PATENT" | "BOOK" | "OTHER">("ALL");

  // Editing Author Affiliation Modal State
  const [editingAuthor, setEditingAuthor] = useState<{ researchId: string; authorId: string; authorName: string; currentAffiliation: string } | null>(null);
  const [manualAffiliationText, setManualAffiliationText] = useState("");

  const { data: myPubsData, refetch: refetchPubs } = useMyResearchList({ limit: 100 });

  const loadIdentity = async () => {
    try {
      setIsLoading(true);
      const res = await fetchMyResearchIdentity();
      setIdentity(res);
    } catch (err) {
      console.error("Failed to load research identity:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIdentity();
  }, []);

  const handleStartEdit = () => {
    if (identity) {
      setScholarInput(identity.scholarProfileUrl || identity.scholarAuthorId || "");
      setOrcidInput(identity.orcid || "");
      setResearcherId(identity.researcherId || "");
      setInterestsText((identity.researchInterests || []).join(", "));
      setAffiliationInput(identity.institutionalAffiliation || "");
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!identity) return;
    const researchInterests = interestsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const updated = await updateMyResearchIdentity({
        scholarInput: scholarInput || undefined,
        orcidInput: orcidInput || undefined,
        researcherId: researcherId || undefined,
        institutionalAffiliation: affiliationInput || undefined,
        researchInterests,
      });
      setIdentity(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || "Failed to update research identity");
    }
  };

  const handleSyncScholar = async () => {
    try {
      setIsSyncing(true);
      await syncMyResearchProfile();
      await loadIdentity();
      await refetchPubs();
    } catch (err: any) {
      alert(err.message || "Failed to sync profile");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveAuthorAffiliation = async () => {
    if (!editingAuthor || !manualAffiliationText.trim()) return;
    try {
      await updateAuthorAffiliationApi(
        editingAuthor.researchId,
        editingAuthor.authorId,
        manualAffiliationText.trim()
      );
      setEditingAuthor(null);
      refetchPubs();
    } catch (err: any) {
      alert(err.message || "Failed to update affiliation");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <UserCheck className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">No Faculty Profile Found</p>
      </div>
    );
  }

  const pubsList = myPubsData?.items || [];

  const getVenueType = (p: any) => {
    const text = `${p.title || ""} ${p.journal || ""} ${p.conference || ""}`.toLowerCase();
    return p.venueType || (
      p.patentNumber || /patent/i.test(text) ? "PATENT" :
      p.isbn || /isbn/i.test(text) ? "BOOK" :
      p.conference ? "CONFERENCE" :
      p.journal ? "JOURNAL" : "JOURNAL"
    );
  };

  const journalPubs = pubsList.filter((p) => getVenueType(p) === "JOURNAL");
  const conferencePubs = pubsList.filter((p) => getVenueType(p) === "CONFERENCE");
  const patentPubs = pubsList.filter((p) => getVenueType(p) === "PATENT");
  const bookPubs = pubsList.filter((p) => getVenueType(p) === "BOOK");
  const otherPubs = pubsList.filter((p) => getVenueType(p) === "OTHER");

  const filteredPubs =
    activeTab === "JOURNAL" ? journalPubs :
    activeTab === "CONFERENCE" ? conferencePubs :
    activeTab === "PATENT" ? patentPubs :
    activeTab === "BOOK" ? bookPubs :
    activeTab === "OTHER" ? otherPubs : pubsList;

  const getVenueBadge = (p: any) => {
    const vType = getVenueType(p);
    if (vType === "PATENT") {
      return (
        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 font-semibold">
          <Award className="h-3 w-3" /> Patent {p.patentNumber ? `— ${p.patentNumber}` : ""}
        </Badge>
      );
    }
    if (vType === "BOOK") {
      return (
        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1 font-semibold">
          <Book className="h-3 w-3" /> Book / ISBN {p.isbn ? `— ${p.isbn}` : ""}
        </Badge>
      );
    }
    if (vType === "CONFERENCE") {
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

  return (
    <div className="space-y-6">
      {/* 1. PERSONAL RESEARCH IDENTITY HEADER CARD */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {identity.scholarAvatarUrl ? (
              <img
                src={identity.scholarAvatarUrl}
                alt={identity.name}
                className="h-16 w-16 rounded-2xl object-cover border border-primary/20 shadow-soft"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-xl font-bold text-primary border border-primary/20">
                {identity.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{identity.name}</h2>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {identity.departmentCode}
                </span>
              </div>
              <p className="text-sm font-medium text-primary mt-0.5">{identity.designation}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  {identity.departmentName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {identity.email}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-1.5">
              <Edit className="h-3.5 w-3.5" /> Edit Research Identity
            </Button>
            <Button onClick={handleSyncScholar} disabled={isSyncing} className="gap-2 bg-primary text-primary-foreground">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Scholar"}
            </Button>
          </div>
        </div>

        {/* Institutional Affiliation Bar */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Institutional Affiliation:</span>
          <span className="font-semibold text-foreground">{identity.institutionalAffiliation}</span>
        </div>

        {/* Deterministic Profile Completeness Gauge */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" /> Research Profile Completeness
            </span>
            <span className="font-extrabold text-primary text-sm">{identity.profileCompleteness}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden border border-border/60">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${identity.profileCompleteness}%` }}
            ></div>
          </div>
          {identity.missingProfileFields.length > 0 && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1">
              <Info className="h-3 w-3 text-amber-500 shrink-0" /> Add {identity.missingProfileFields.join(", ")} to reach 100% profile completeness.
            </p>
          )}
        </div>

        {/* Edit Modal Form */}
        {isEditing && (
          <div className="mt-4 p-4 rounded-xl bg-card border border-primary/30 space-y-3 shadow-md">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Update Faculty Research Identifiers</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Google Scholar Profile URL or Author ID</Label>
                <Input value={scholarInput} onChange={(e) => setScholarInput(e.target.value)} placeholder="https://scholar.google.com/citations?user=Y8O6WQcAAAAJ" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">ORCID iD</Label>
                <Input value={orcidInput} onChange={(e) => setOrcidInput(e.target.value)} placeholder="0000-0002-1825-0097" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">ResearcherID / Clarivate ID</Label>
                <Input value={researcherId} onChange={(e) => setResearcherId(e.target.value)} placeholder="A-1234-2025" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Institutional Affiliation</Label>
                <Input value={affiliationInput} onChange={(e) => setAffiliationInput(e.target.value)} placeholder="K. K. Wagh Institute of Engineering Education and Research" className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Research Interests (comma separated)</Label>
              <Input value={interestsText} onChange={(e) => setInterestsText(e.target.value)} placeholder="Machine Learning, Data Mining, Computer Vision" className="mt-1" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveProfile}>Save Research Identity</Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. IDENTITY SOURCE STATUS & CITATION BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Connection Matrix */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-soft space-y-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-blue-500" /> Research Identity Sources
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="font-medium text-foreground">Google Scholar:</span>
              {identity.scholarAuthorId ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected ({identity.scholarAuthorId})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">Not Provided</span>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="font-medium text-foreground">ORCID iD:</span>
              {identity.orcid ? (
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Provided (Unverified)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">Not Provided</span>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="font-medium text-foreground">ResearcherID / Clarivate:</span>
              {identity.researcherId ? (
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Provided ({identity.researcherId})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">Not Provided</span>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
              <span className="font-medium text-foreground">Web of Science (SCI):</span>
              {identity.status.wos === "CONNECTED_FREE" ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected (Free Open Science Sync)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">Not Connected</span>
              )}
            </div>
          </div>
        </div>

        {/* Source-Specific Citation Breakdown */}
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-soft space-y-3">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Quote className="h-4 w-4 text-primary" /> Source-Specific Citation Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[11px] text-blue-600 font-semibold block">Google Scholar</span>
              <span className="text-xl font-bold text-blue-600">{identity.metrics.citationSources.googleScholar}</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-[11px] text-purple-600 font-semibold block">OpenAlex Index</span>
              <span className="text-xl font-bold text-purple-600">{identity.metrics.citationSources.openAlex}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[11px] text-amber-600 font-semibold block">Crossref Metadata</span>
              <span className="text-xl font-bold text-amber-600">{identity.metrics.citationSources.crossref}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[11px] text-emerald-600 font-semibold block">Web of Science / SCI</span>
              <span className="text-xl font-bold text-emerald-600">{identity.metrics.citationSources.webOfScience}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PUBLICATIONS CLASSIFICATION (JOURNAL VS CONFERENCE) */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Classified Publications Portfolio
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unified list of verified research publications with author-level affiliations and provenance tracking.
            </p>
          </div>

          {/* 6 Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1.5 rounded-xl text-xs font-semibold">
            {[
              { id: "ALL", label: `All (${pubsList.length})` },
              { id: "JOURNAL", label: `Journals (${journalPubs.length})` },
              { id: "CONFERENCE", label: `Conferences (${conferencePubs.length})` },
              { id: "PATENT", label: `Patents (${patentPubs.length})` },
              { id: "BOOK", label: `Books & ISBN (${bookPubs.length})` },
              { id: "OTHER", label: `Others (${otherPubs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground font-bold shadow-xs border border-border"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Publication Cards */}
        {filteredPubs.length > 0 ? (
          <div className="space-y-3">
            {filteredPubs.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-muted/20 border border-border/70 hover:border-primary/40 transition space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1.5 flex items-center gap-2">
                      {getVenueBadge(p)}
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {p.publicationYear}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground leading-snug">{p.title}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 shrink-0">
                    {p.citationCount} Citations
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{p.journal || p.conference || "Institutional Publication"} ({p.publicationYear})</span>
                  {p.doi && (
                    <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono text-[11px] flex items-center gap-1">
                      doi:{p.doi} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Author-Level Affiliations with Provenance */}
                <div className="pt-2 border-t border-border/50 space-y-1">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Author Affiliations:</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {p.authors && p.authors.length > 0 ? (
                      p.authors.map((a: any) => (
                        <div key={a.id} className="p-2 rounded bg-card border border-border/60 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-foreground">{a.authorName}</span>
                            <p className="text-[10px] text-muted-foreground">{a.affiliation || "Affiliation unverified"}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                              a.affiliationStatus === "MANUALLY_ENTERED"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-emerald-500/10 text-emerald-600"
                            }`}>
                              {a.affiliationStatus === "MANUALLY_ENTERED" ? "✎ Manual" : "✓ Verified"}
                            </span>
                            <button
                              onClick={() => {
                                setEditingAuthor({ researchId: p.id, authorId: a.id, authorName: a.authorName, currentAffiliation: a.affiliation || "" });
                                setManualAffiliationText(a.affiliation || "");
                              }}
                              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                              title="Edit Affiliation"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No author metadata attached</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            No publications found under current filter.
          </div>
        )}
      </div>

      {/* Manual Affiliation Modal */}
      {editingAuthor && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Edit Author Affiliation</h3>
            <p className="text-xs text-muted-foreground">Author: <strong className="text-foreground">{editingAuthor.authorName}</strong></p>
            <div>
              <Label className="text-xs">Affiliation Institution Name</Label>
              <Input
                value={manualAffiliationText}
                onChange={(e) => setManualAffiliationText(e.target.value)}
                placeholder="K. K. Wagh Institute of Engineering Education and Research"
                className="mt-1 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingAuthor(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveAuthorAffiliation}>Save Affiliation Provenance</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
