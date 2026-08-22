import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, FileText, CheckCircle2, Clock3, XCircle, AlertCircle, Quote, Building2, Pencil, Check, X, FolderGit2 } from "lucide-react";
import type { ResearchItem, ResearchAuthorItem } from "@/services/research.service";
import { updateResearchApi } from "@/services/research.service";
import { updateAuthorAffiliationApi } from "@/services/faculty.service";
import { getGoogleScholarUrl } from "@/utils/scholarLink";

interface ResearchDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  research: ResearchItem | null;
}

export function ResearchDetailModal({ open, onOpenChange, research }: ResearchDetailModalProps) {
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [affiliationInput, setAffiliationInput] = useState<string>("");
  const [isSavingAffiliation, setIsSavingAffiliation] = useState(false);
  const [authorsList, setAuthorsList] = useState<ResearchAuthorItem[]>([]);

  // Manuscript PDF / Google Drive URL state
  const [isEditingPdfUrl, setIsEditingPdfUrl] = useState(false);
  const [pdfUrlInput, setPdfUrlInput] = useState<string>("");
  const [isSavingPdfUrl, setIsSavingPdfUrl] = useState(false);

  // Re-initialize state whenever selected research paper changes
  useEffect(() => {
    if (research && research.authors) {
      const sorted = [...research.authors].sort((a, b) => (a.authorOrder || 1) - (b.authorOrder || 1));
      setAuthorsList(sorted);
      setEditingAuthorId(null);
      setPdfUrlInput(research.pdfUrl || "");
      setIsEditingPdfUrl(false);
    } else {
      setAuthorsList([]);
    }
  }, [research?.id]);

  if (!research) return null;

  const abstractSourceLabel =
    research.abstractSource === "MANUAL_KRIYA"
      ? "Source: Manual / Verified KRIYA Entry"
      : research.abstractSource === "OPENALEX" || (research.doi && research.abstract && research.abstract.length > 50)
      ? "Source: OpenAlex"
      : research.abstractSource === "CROSSREF"
      ? "Source: Crossref"
      : research.abstract && research.abstract !== "Abstract unavailable."
      ? "Source: Google Scholar — Snippet"
      : "Abstract unavailable.";

  const abstractSourceBadgeColor =
    abstractSourceLabel.includes("OpenAlex")
      ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
      : abstractSourceLabel.includes("Crossref")
      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
      : abstractSourceLabel.includes("Google Scholar")
      ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";

  const handleEditClick = (author: ResearchAuthorItem) => {
    if (!author.id) return;
    setEditingAuthorId(author.id);
    setAffiliationInput(author.affiliation || "K. K. Wagh Institute of Engineering Education and Research");
  };

  const handleSaveAffiliation = async (authorId: string) => {
    try {
      setIsSavingAffiliation(true);
      await updateAuthorAffiliationApi(research.id, authorId, affiliationInput);
      
      setAuthorsList((prev) =>
        prev.map((a) =>
          a.id === authorId
            ? {
                ...a,
                affiliation: affiliationInput,
                affiliationSource: "MANUAL_KRIYA",
                affiliationStatus: "VERIFIED_INTERNAL",
              }
            : a
        )
      );
      setEditingAuthorId(null);
    } catch (err) {
      console.error("Failed to update author affiliation:", err);
    } finally {
      setIsSavingAffiliation(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "ACCEPTED":
      case "PUBLISHED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      case "NEEDS_REVISION":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/30 gap-1">
            <AlertCircle className="h-3 w-3" /> Revisions Requested
          </Badge>
        );
      case "SUBMITTED":
      case "UNDER_REVIEW":
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock3 className="h-3 w-3" /> Under Review
          </Badge>
        );
    }
  };

  const displayAuthors = authorsList.length > 0 ? authorsList : research.authors || [];

  return (
    <Dialog open={open} onOpenChange={(o) => { setEditingAuthorId(null); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {getStatusBadge(research.status)}
              <span className="text-xs text-muted-foreground">Year: {research.publicationYear}</span>
            </div>

            <a
              href={getGoogleScholarUrl(research)}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-700 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors"
            >
              🎓 View on Google Scholar <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <DialogTitle className="text-xl leading-snug mt-1">{research.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Authors with Affiliation & Manual Edit Support */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                Authors & Institutional Affiliations
              </h4>
              <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-500/10 border-emerald-500/30">
                Auto-Fetched & Editable
              </Badge>
            </div>

            <div className="grid gap-2 sm:grid-cols-1">
              {displayAuthors.map((author, idx) => {
                const isEditing = editingAuthorId === author.id;
                const defaultAffiliation = author.affiliation || "K. K. Wagh Institute of Engineering Education and Research";

                return (
                  <div key={idx} className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-foreground">{author.authorName}</span>
                        {(author.authorOrder === 1 || idx === 0) ? (
                          <Badge className="text-[9px] bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold gap-1">
                            ⭐ Main Author (1st Author)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] text-slate-600 bg-slate-100 border-slate-200 font-medium">
                            Co-Author (#{author.authorOrder || idx + 1})
                          </Badge>
                        )}
                        {author.isCorresponding && (
                          <Badge variant="secondary" className="text-[9px] bg-blue-500/15 text-blue-700 border-blue-500/30 font-bold gap-1">
                            ✉️ Corresponding Author
                          </Badge>
                        )}
                        {author.faculty && (
                          <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                            ✓ Verified Faculty
                          </Badge>
                        )}
                      </div>

                      {author.id && !isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(author)}
                          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary gap-1"
                        >
                          <Pencil className="h-3 w-3" /> Edit Affiliation
                        </Button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          value={affiliationInput}
                          onChange={(e) => setAffiliationInput(e.target.value)}
                          placeholder="Enter author affiliation..."
                          className="h-7 text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveAffiliation(author.id!)}
                          disabled={isSavingAffiliation}
                          className="h-7 px-2.5 text-xs gap-1 shrink-0"
                        >
                          <Check className="h-3 w-3" /> Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAuthorId(null)}
                          className="h-7 px-2.5 text-xs gap-1 shrink-0"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                          <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span>{defaultAffiliation}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] text-muted-foreground shrink-0 ml-2">
                          {author.affiliationSource === "MANUAL_KRIYA" ? "✎ Manual Entry" : author.affiliationSource === "OPENALEX" ? "✓ OpenAlex" : "✓ Institutional Default"}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Abstract Section with Dual Source Attribution */}
          <div className="space-y-3">
            {/* Primary Abstract Box */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {abstractSourceLabel.includes("OpenAlex") || abstractSourceLabel.includes("Crossref") ? "Primary Peer-Reviewed Abstract" : "Abstract"}
                </h4>
                <Badge variant="outline" className={`text-[10px] font-semibold ${abstractSourceBadgeColor}`}>
                  {abstractSourceLabel}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                {research.abstract || "Abstract unavailable."}
              </p>
            </div>

            {/* Secondary Google Scholar Snippet Box if available */}
            {research.provenance?.scholarSnippet && research.provenance?.scholarSnippet !== research.abstract && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">🎓 Google Scholar Search Snippet</span>
                  <Badge variant="outline" className="text-[9px] bg-background text-blue-600 border-blue-500/30">
                    Source: Google Scholar SERP API
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  "{research.provenance?.scholarSnippet}"
                </p>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Research Area:</span>
                <Badge variant="outline" className="text-[9px]">Institutional Category</Badge>
              </div>
              <p className="font-semibold text-foreground mt-0.5">{research.researchArea}</p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Venue (Journal / Conference):</span>
                <Badge variant="outline" className="text-[9px] text-indigo-700 bg-indigo-500/10 border-indigo-500/30">
                  {research.doi ? "✓ OpenAlex / Crossref" : "✓ Scholar Metadata"}
                </Badge>
              </div>
              <p className="font-semibold text-foreground mt-0.5">
                {research.journal || research.conference || "Institutional Repository"}
              </p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <span className="text-muted-foreground">Department:</span>
              <p className="font-semibold text-foreground mt-0.5">{research.department?.name || "General"}</p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Citations Count:</span>
                <Badge variant="outline" className="text-[9px] text-amber-700 bg-amber-500/10 border-amber-500/30">
                  ✓ Google Scholar — {research.citationCount || 0}
                </Badge>
              </div>
              <p className="font-semibold text-primary mt-0.5 flex items-center gap-1">
                <Quote className="h-3 w-3" /> {research.citationCount || 0} Citations
              </p>
            </div>
          </div>

          {/* Keywords */}
          {research.keywords && research.keywords.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Keywords</h4>
              <div className="flex flex-wrap gap-1">
                {research.keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-xs font-normal">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Field-Level Provenance & Reconciliation Summary */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Reconciled Master Record (Field-Level Data Provenance)
              </h4>
              <Badge className="bg-primary text-primary-foreground text-[10px]">
                Field-Level Provenance
              </Badge>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex justify-between items-center">
                <span className="text-muted-foreground">Abstract:</span>
                <span className="font-semibold text-purple-600">
                  ✓ {abstractSourceLabel.replace("Source: ", "")}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex justify-between items-center">
                <span className="text-muted-foreground">Citation Count:</span>
                <span className="font-semibold text-amber-600">
                  ✓ Google Scholar ({research.citationCount})
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex justify-between items-center">
                <span className="text-muted-foreground">DOI Handle:</span>
                <span className="font-semibold text-emerald-600">
                  {research.doi ? `✓ OpenAlex (${research.doi})` : "Not Registered"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 flex justify-between items-center">
                <span className="text-muted-foreground">Venue:</span>
                <span className="font-semibold text-blue-600">
                  ✓ {research.doi ? "OpenAlex" : "Google Scholar"}
                </span>
              </div>
            </div>
          </div>

          {/* MANUSCRIPT PDF & GOOGLE DRIVE STORAGE VAULT CARD */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                <FileText className="h-4 w-4 text-blue-600" /> Manuscript PDF / Google Drive Storage
              </div>
              {!isEditingPdfUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPdfUrlInput(research.pdfUrl || "");
                    setIsEditingPdfUrl(true);
                  }}
                  className="h-6 px-2 text-[10px] text-blue-700 hover:bg-blue-500/10 gap-1 font-bold"
                >
                  <Pencil className="h-3 w-3" /> {research.pdfUrl ? "Edit PDF Link" : "+ Attach Google Drive PDF Link"}
                </Button>
              )}
            </div>

            {isEditingPdfUrl ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-muted-foreground">
                  Paste your Google Drive PDF view link (e.g. <code>https://drive.google.com/file/d/.../view</code>) for this paper:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={pdfUrlInput}
                    onChange={(e) => setPdfUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        setIsSavingPdfUrl(true);
                        await updateResearchApi(research.id, { pdfUrl: pdfUrlInput.trim() || null });
                        research.pdfUrl = pdfUrlInput.trim() || null;
                        setIsEditingPdfUrl(false);
                      } catch (err: any) {
                        alert(err.message || "Failed to update manuscript PDF link");
                      } finally {
                        setIsSavingPdfUrl(false);
                      }
                    }}
                    disabled={isSavingPdfUrl}
                    className="h-8 px-3 text-xs gap-1 shrink-0"
                  >
                    <Check className="h-3.5 w-3.5" /> {isSavingPdfUrl ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingPdfUrl(false)} className="h-8 px-3 text-xs shrink-0">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                {research.pdfUrl ? (
                  <a
                    href={research.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                  >
                    📄 View / Download Manuscript PDF (Google Drive) <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-muted-foreground italic text-xs">
                    No manuscript PDF attached yet. Click "+ Attach Google Drive PDF Link" to link your paper.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* External Links */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {research.doi && (
              <Button variant="outline" size="sm" asChild className="gap-1 text-xs">
                <a href={`https://doi.org/${research.doi}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> View DOI Link ({research.doi})
                </a>
              </Button>
            )}
            {research.pdfUrl && (
              <Button variant="outline" size="sm" asChild className="gap-1 text-xs">
                <a href={research.pdfUrl} target="_blank" rel="noreferrer">
                  <FileText className="h-3.5 w-3.5" /> Download Manuscript PDF
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
