import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Sparkles, Plus, Trash2, Award, Book, BookOpen, Layers, FileText } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateResearch } from "../hooks/useResearch";
import { useDoiPreview } from "@/features/doi/hooks/useDoiPreview";
import { useDepartmentList } from "@/features/departments/hooks/useDepartments";
import { useFacultyList } from "@/features/faculty/hooks/useFaculty";
import { useStudentList } from "@/features/students/hooks/useStudents";

interface ResearchSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AuthorRow {
  facultyId?: string;
  studentId?: string;
  authorName: string;
  authorOrder: number;
  isCorresponding: boolean;
}

export function ResearchSubmissionModal({ open, onOpenChange }: ResearchSubmissionModalProps) {
  const [venueCategory, setVenueCategory] = useState<"JOURNAL" | "CONFERENCE" | "PATENT" | "BOOK" | "OTHER">("JOURNAL");
  const [doiInput, setDoiInput] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [authorsList, setAuthorsList] = useState<AuthorRow[]>([
    { authorName: "", authorOrder: 1, isCorresponding: true },
  ]);

  const { data: deptData } = useDepartmentList();
  const { data: facultyData } = useFacultyList({ limit: 100 });
  const { data: studentData } = useStudentList({ limit: 100 });

  const doiPreviewMutation = useDoiPreview();
  const createMutation = useCreateResearch();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      abstract: "",
      researchArea: "Computer Science",
      doi: "",
      journal: "",
      conference: "",
      patentNumber: "",
      isbn: "",
      publicationYear: new Date().getFullYear(),
      pdfUrl: "",
      departmentId: "",
    },
  });

  const selectedDepartmentId = watch("departmentId");

  const handleFetchDoi = async () => {
    if (!doiInput) return;
    try {
      const res = await doiPreviewMutation.mutateAsync(doiInput);
      const meta = res.metadata;
      setValue("title", meta.title);
      setValue("abstract", meta.abstract);
      setValue("doi", meta.doi);
      if (meta.journal) {
        setValue("journal", meta.journal);
        setVenueCategory("JOURNAL");
      }
      if (meta.conference) {
        setValue("conference", meta.conference);
        setVenueCategory("CONFERENCE");
      }
      if (meta.publicationYear) setValue("publicationYear", meta.publicationYear);
      if (meta.keywords) setKeywordsText(meta.keywords.join(", "));
      if (meta.authors && meta.authors.length > 0) {
        setAuthorsList(
          meta.authors.map((a, idx) => ({
            authorName: a.authorName,
            authorOrder: a.authorOrder || idx + 1,
            isCorresponding: idx === 0,
          }))
        );
      }
    } catch {
      // Error handled in hook toast
    }
  };

  const addAuthorRow = () => {
    setAuthorsList((prev) => [
      ...prev,
      { authorName: "", authorOrder: prev.length + 1, isCorresponding: false },
    ]);
  };

  const removeAuthorRow = (index: number) => {
    setAuthorsList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAuthorRow = (index: number, field: keyof AuthorRow, value: any) => {
    setAuthorsList((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const onSubmit = async (values: any) => {
    if (isSubmittingLocal || createMutation.isPending) return;
    setIsSubmittingLocal(true);

    try {
      const keywords = keywordsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await createMutation.mutateAsync({
        title: values.title,
        abstract: values.abstract,
        keywords: keywords.length > 0 ? keywords : ["Research"],
        researchArea: values.researchArea,
        doi: values.doi || null,
        journal: venueCategory === "JOURNAL" ? (values.journal || null) : null,
        conference: venueCategory === "CONFERENCE" ? (values.conference || null) : null,
        venueType: venueCategory,
        patentNumber: venueCategory === "PATENT" ? (values.patentNumber || null) : null,
        isbn: venueCategory === "BOOK" ? (values.isbn || null) : null,
        publicationYear: Number(values.publicationYear),
        pdfUrl: values.pdfUrl || null,
        departmentId: values.departmentId || null,
        authors: authorsList.map((a, idx) => ({
          facultyId: a.facultyId || undefined,
          studentId: a.studentId || undefined,
          authorName: a.authorName || "Unknown Author",
          authorOrder: idx + 1,
          isCorresponding: a.isCorresponding,
        })),
      });

      reset();
      setDoiInput("");
      setKeywordsText("");
      onOpenChange(false);
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const isLoading = createMutation.isPending || doiPreviewMutation.isPending || isSubmittingLocal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Submit Publication for Admin Review</span>
            <Badge variant="outline" className="text-xs font-normal">
              Structured Multi-Category Submission
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* DOI Fetch Bar */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
            Fetch Metadata by DOI (OpenAlex / Crossref)
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. 10.1038/s41586-020-2649-2"
              value={doiInput}
              onChange={(e) => setDoiInput(e.target.value)}
              className="bg-card h-10"
              disabled={doiPreviewMutation.isPending}
            />
            <Button
              type="button"
              onClick={handleFetchDoi}
              disabled={doiPreviewMutation.isPending || !doiInput}
              className="gap-2 shrink-0"
            >
              {doiPreviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              )}
              Fetch Metadata
            </Button>
          </div>
        </div>

        {/* Category Type Selector Buttons */}
        <div className="space-y-1.5 pt-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Select Publication / IP Category
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-muted p-1.5 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setVenueCategory("JOURNAL")}
              className={`py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                venueCategory === "JOURNAL" ? "bg-card text-emerald-600 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Journal
            </button>
            <button
              type="button"
              onClick={() => setVenueCategory("CONFERENCE")}
              className={`py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                venueCategory === "CONFERENCE" ? "bg-card text-indigo-600 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Conference
            </button>
            <button
              type="button"
              onClick={() => setVenueCategory("PATENT")}
              className={`py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                venueCategory === "PATENT" ? "bg-card text-amber-600 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Award className="h-3.5 w-3.5" /> Patent
            </button>
            <button
              type="button"
              onClick={() => setVenueCategory("BOOK")}
              className={`py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                venueCategory === "BOOK" ? "bg-card text-purple-600 shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Book className="h-3.5 w-3.5" /> Book/ISBN
            </button>
            <button
              type="button"
              onClick={() => setVenueCategory("OTHER")}
              className={`py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                venueCategory === "OTHER" ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Other
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="res-title">
              {venueCategory === "PATENT" ? "Patent Title / Invention Name" : venueCategory === "BOOK" ? "Book / Chapter Title" : "Publication Title"}
            </Label>
            <Input
              id="res-title"
              placeholder={venueCategory === "PATENT" ? "e.g. IOT Based Barrier for Crowd Management" : "Enter full title..."}
              disabled={isLoading}
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="res-abstract">Abstract / Invention Summary</Label>
            <Textarea
              id="res-abstract"
              rows={4}
              placeholder="Detailed description of research methodology, invention scope, or findings..."
              disabled={isLoading}
              {...register("abstract", { required: "Abstract is required" })}
            />
            {errors.abstract && <p className="text-xs text-destructive">{errors.abstract.message}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="researchArea">Research Area / Discipline</Label>
              <Input
                id="researchArea"
                placeholder="Computer Engineering, AI, Electrical..."
                disabled={isLoading}
                {...register("researchArea", { required: "Research Area is required" })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publicationYear">
                {venueCategory === "PATENT" ? "Patent Filing / Grant Year" : "Publication Year"}
              </Label>
              <Input
                id="publicationYear"
                type="number"
                disabled={isLoading}
                {...register("publicationYear", { required: true, valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Dynamic Structured Fields based on Selected Category */}
          {venueCategory === "JOURNAL" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="journal">Journal Name</Label>
                <Input id="journal" placeholder="e.g. IEEE Transactions on Software Engineering" disabled={isLoading} {...register("journal")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doi">DOI (Optional)</Label>
                <Input id="doi" placeholder="e.g. 10.1109/..." disabled={isLoading} {...register("doi")} />
              </div>
            </div>
          )}

          {venueCategory === "CONFERENCE" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="conference">Conference Name / Proceedings</Label>
                <Input id="conference" placeholder="e.g. IEEE International Conference on AI" disabled={isLoading} {...register("conference")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="doi">DOI (Optional)</Label>
                <Input id="doi" placeholder="e.g. 10.1109/..." disabled={isLoading} {...register("doi")} />
              </div>
            </div>
          )}

          {venueCategory === "PATENT" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="patentNumber">Patent Number / Application No.</Label>
                <Input id="patentNumber" placeholder="e.g. IN Patent 508,395 or IN Patent cbr 213,807" disabled={isLoading} {...register("patentNumber")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="journal">Patent Office / Issuing Authority</Label>
                <Input id="journal" placeholder="e.g. Indian Patent Office (IPO)" disabled={isLoading} {...register("journal")} />
              </div>
            </div>
          )}

          {venueCategory === "BOOK" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="isbn">ISBN Number</Label>
                <Input id="isbn" placeholder="e.g. ISBN 978-93-5563-382-8" disabled={isLoading} {...register("isbn")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="journal">Publisher / Book Name</Label>
                <Input id="journal" placeholder="e.g. Springer, CRC Press, Technical Publications" disabled={isLoading} {...register("journal")} />
              </div>
            </div>
          )}

          {venueCategory === "OTHER" && (
            <div className="space-y-1.5">
              <Label htmlFor="journal">Repository / Publisher / Magazine</Label>
              <Input id="journal" placeholder="e.g. CSI Communications, Technical Report" disabled={isLoading} {...register("journal")} />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="departmentId">Department</Label>
              <Select
                value={selectedDepartmentId}
                onValueChange={(val) => setValue("departmentId", val)}
                disabled={isLoading}
              >
                <SelectTrigger id="departmentId">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {(deptData?.departments || []).map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pdfUrl">PDF Manuscript / Patent Document Link</Label>
              <Input id="pdfUrl" placeholder="https://..." disabled={isLoading} {...register("pdfUrl")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keywords">Keywords / Indexing Tags (Comma separated)</Label>
            <Input
              id="keywords"
              placeholder="Deep Learning, Machine Learning, Patent, Crowd Management"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Authors / Inventors List */}
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {venueCategory === "PATENT" ? "Inventors & Co-Inventors" : "Authors & Co-Authors"}
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addAuthorRow} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add {venueCategory === "PATENT" ? "Inventor" : "Author"}
              </Button>
            </div>

            {authorsList.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder={venueCategory === "PATENT" ? `Inventor ${idx + 1} Name` : `Author ${idx + 1} Name`}
                  value={row.authorName}
                  onChange={(e) => updateAuthorRow(idx, "authorName", e.target.value)}
                  className="h-8 text-xs flex-1"
                />

                <Select
                  value={row.facultyId || ""}
                  onValueChange={(val) => updateAuthorRow(idx, "facultyId", val || undefined)}
                >
                  <SelectTrigger className="h-8 text-xs w-36">
                    <SelectValue placeholder="Link Faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {(facultyData?.items || []).map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {authorsList.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAuthorRow(idx)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit for Admin Review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
