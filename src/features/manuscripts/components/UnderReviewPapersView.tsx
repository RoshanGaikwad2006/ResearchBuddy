import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UploadCloud,
  FileText,
  Calendar,
  CalendarRange,
  Users,
  Building2,
  CheckCircle2,
  Loader2,
  Trash2,
  Search,
  ExternalLink,
  Sparkles,
  Layers,
  BookOpen,
  Info,
  Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  fetchResearchList,
  deleteResearchApi,
  uploadManuscriptApi,
  type ResearchItem,
  type ParsedManuscriptResult,
} from "@/services/research.service";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { formatPublicationDate } from "@/utils/formatDate";
import { ResearchDetailModal } from "@/features/research/components/ResearchDetailModal";

export function UnderReviewPapersView() {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedResearch, setSelectedResearch] = useState<ResearchItem | null>(null);
  const [lastParsedResult, setLastParsedResult] = useState<ParsedManuscriptResult | null>(null);

  // Fetch under review papers
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["researches", "UNDER_REVIEW", search],
    queryFn: () =>
      fetchResearchList({
        status: "UNDER_REVIEW",
        search: search || undefined,
        limit: 50,
      }),
  });

  const papers = data?.items || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx") && !file.name.endsWith(".doc")) {
      toast.error("Invalid file format", {
        description: "Please upload a Word document (.docx or .doc).",
      });
      return;
    }

    try {
      setIsUploading(true);
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(",")[1];
          const response = await uploadManuscriptApi({
            filename: file.name,
            fileBase64: base64Data,
            createPaper: true,
          });

          setLastParsedResult(response.parsed);
          toast.success("Manuscript Uploaded & Extracted", {
            description: `Extracted: "${response.parsed.title.substring(0, 60)}..."`,
          });

          queryClient.invalidateQueries({ queryKey: ["researches"] });
          queryClient.invalidateQueries({ queryKey: ["my-researches"] });
          refetch();
        } catch (err: any) {
          toast.error("Upload failed", {
            description: err?.response?.data?.message || err?.message || "Failed to parse document.",
          });
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };

      reader.onerror = () => {
        toast.error("Error reading file");
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error("Error uploading file", { description: err.message });
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete manuscript "${title.substring(0, 40)}..."?`)) {
      return;
    }
    try {
      await deleteResearchApi(id);
      toast.success("Manuscript deleted");
      queryClient.invalidateQueries({ queryKey: ["researches"] });
      refetch();
    } catch (err: any) {
      toast.error("Failed to delete", { description: err?.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Under-Review Papers & Manuscript Vault
            </h2>
            <p className="text-xs text-muted-foreground">
              Upload Word documents (.docx) for ongoing paper submissions. The system automatically extracts titles, authors, abstracts, target venues, and submission/conference dates.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <Card className="border-dashed border-2 border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/10 hover:border-blue-500/50 transition-colors">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-600 mb-3">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <UploadCloud className="h-8 w-8" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {isUploading ? "Extracting document data with AI & Regex parser..." : "Upload Manuscript (.docx)"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4">
              Drag and drop your manuscript Word document here, or browse files. Extracted data will automatically populate title, author list, abstract, and dates.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc"
              onChange={handleFileUpload}
              className="hidden"
              id="docx-upload-input"
              disabled={isUploading}
            />

            <label htmlFor="docx-upload-input">
              <Button
                asChild
                disabled={isUploading}
                className="cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <span>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Parsing Manuscript...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4 mr-1" />
                      Choose Word Document (.docx)
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Result Preview Card */}
      {lastParsedResult && (
        <Card className="border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  Document Extraction Success
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-emerald-700 border-emerald-500/30 bg-emerald-500/10 text-xs">
                {lastParsedResult.wordCount} words extracted
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              We parsed the following information from your Word document and added it to Under-Review papers:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-background/80 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Extracted Title:
              </span>
              <p className="font-semibold text-foreground text-sm">{lastParsedResult.title}</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="p-2.5 rounded-lg bg-background/80 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3 text-primary" /> Extracted Authors ({lastParsedResult.authors.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {lastParsedResult.authors.map((a, i) => (
                    <Badge key={i} variant="secondary" className="text-[11px]">
                      {a.authorName}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-background/80 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-blue-600" /> Detected Dates & Venue
                </span>
                <div className="space-y-0.5">
                  <p className="text-foreground">
                    <strong>Submission Date:</strong> {lastParsedResult.submissionDate || "Detected Today"}
                  </p>
                  {lastParsedResult.conferenceDate && (
                    <p className="text-foreground">
                      <strong>Conference Date:</strong> {lastParsedResult.conferenceDate}
                    </p>
                  )}
                  {lastParsedResult.targetVenue && (
                    <p className="text-foreground">
                      <strong>Venue:</strong> {lastParsedResult.targetVenue} ({lastParsedResult.venueType || "CONFERENCE"})
                    </p>
                  )}
                </div>
              </div>
            </div>

            {lastParsedResult.abstract && (
              <div className="p-3 rounded-lg bg-background/80 border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Extracted Abstract:
                </span>
                <p className="text-foreground/90 text-xs leading-relaxed line-clamp-3">
                  {lastParsedResult.abstract}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Under-Review Papers Table / Grid */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              Submitted Manuscripts ({papers.length})
            </h3>
            <Badge variant="secondary" className="text-xs">
              Status: UNDER_REVIEW
            </Badge>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search manuscripts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-36 items-center justify-center rounded-xl border border-border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-xs text-muted-foreground">Loading under-review papers...</span>
          </div>
        ) : isError ? (
          <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs">
            Failed to load under-review papers.
          </div>
        ) : papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-12 text-center">
            <Clock3 className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No under-review manuscripts yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Upload your paper's Word document (.docx) above to track your ongoing submissions, edit conference dates, and store your manuscript drafts.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {papers.map((paper) => (
              <Card
                key={paper.id}
                className="hover:shadow-md transition-shadow border border-border bg-card"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] gap-1 font-semibold">
                          <Clock3 className="h-3 w-3" /> Under Review
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {paper.venueType || "CONFERENCE"}
                        </span>
                        {paper.department && (
                          <Badge variant="outline" className="text-[10px]">
                            {paper.department.code}
                          </Badge>
                        )}
                      </div>
                      <h4
                        className="text-sm font-bold text-foreground hover:text-blue-600 cursor-pointer"
                        onClick={() => setSelectedResearch(paper)}
                      >
                        {paper.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                        onClick={() => setSelectedResearch(paper)}
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Dates & Details</span>
                      </Button>
                      {(role === "ADMIN" || paper.createdById === user?.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(paper.id, paper.title)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Authors & Abstract snippet */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
                      <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>
                        {(paper.authors || []).map((a) => a.authorName).join(", ") || "Authors not specified"}
                      </span>
                    </div>

                    {paper.abstract && (
                      <p className="text-muted-foreground/90 line-clamp-2 leading-relaxed">
                        {paper.abstract}
                      </p>
                    )}
                  </div>

                  {/* Dates Bar */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground flex-wrap gap-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <Calendar className="h-3 w-3 text-blue-600" />
                        Submission Date: {formatPublicationDate(paper.publicationDate, paper.publicationYear)}
                      </span>
                      {paper.conferenceDate && (
                        <span className="flex items-center gap-1 text-foreground font-medium">
                          <CalendarRange className="h-3 w-3 text-indigo-600" />
                          Conference Date: {formatPublicationDate(paper.conferenceDate)}
                        </span>
                      )}
                      {paper.conference && (
                        <span className="text-muted-foreground">
                          Target: {paper.conference}
                        </span>
                      )}
                      {paper.journal && (
                        <span className="text-muted-foreground">
                          Target: {paper.journal}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-muted-foreground">
                      Added {new Date(paper.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Detail Modal with Calendar Date Pickers */}
      <ResearchDetailModal
        open={!!selectedResearch}
        onOpenChange={(open) => !open && setSelectedResearch(null)}
        research={selectedResearch}
      />
    </div>
  );
}
