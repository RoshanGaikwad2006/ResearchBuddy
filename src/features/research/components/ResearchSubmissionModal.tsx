import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Search, Sparkles, Plus, Trash2 } from "lucide-react";

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
      if (meta.journal) setValue("journal", meta.journal);
      if (meta.conference) setValue("conference", meta.conference);
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

  const onSubmit = async (values: any) => {
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
      journal: values.journal || null,
      conference: values.conference || null,
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
  };

  const isLoading = createMutation.isPending || doiPreviewMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Submit Publication for Review</span>
            <Badge variant="outline" className="text-xs font-normal">
              DOI Auto-Fetch Ready
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="res-title">Publication Title</Label>
            <Input
              id="res-title"
              placeholder="Enter full research publication title"
              disabled={isLoading}
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="res-abstract">Abstract</Label>
            <Textarea
              id="res-abstract"
              rows={4}
              placeholder="Summary of research methodology and findings..."
              disabled={isLoading}
              {...register("abstract", { required: "Abstract is required" })}
            />
            {errors.abstract && <p className="text-xs text-destructive">{errors.abstract.message}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="researchArea">Research Area</Label>
              <Input
                id="researchArea"
                placeholder="Artificial Intelligence, Materials Science..."
                disabled={isLoading}
                {...register("researchArea", { required: "Research Area is required" })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="publicationYear">Publication Year</Label>
              <Input
                id="publicationYear"
                type="number"
                disabled={isLoading}
                {...register("publicationYear", { required: true, valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="journal">Journal Name (Optional)</Label>
              <Input id="journal" placeholder="IEEE Transactions, Nature..." disabled={isLoading} {...register("journal")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conference">Conference Name (Optional)</Label>
              <Input id="conference" placeholder="NeurIPS, CVPR..." disabled={isLoading} {...register("conference")} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doi">DOI (Optional)</Label>
              <Input id="doi" placeholder="10.1038/..." disabled={isLoading} {...register("doi")} />
            </div>

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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pdfUrl">PDF Manuscript URL (Optional)</Label>
            <Input id="pdfUrl" placeholder="https://arxiv.org/pdf/..." disabled={isLoading} {...register("pdfUrl")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="keywords">Keywords (Comma separated)</Label>
            <Input
              id="keywords"
              placeholder="Deep Learning, Neural Networks, Computer Vision"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Authors List */}
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-foreground">Authors List</Label>
              <Button type="button" variant="outline" size="sm" onClick={addAuthorRow} className="h-8 gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Author
              </Button>
            </div>

            {authorsList.map((author, index) => (
              <div key={index} className="grid items-center gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input
                  placeholder={`Author #${index + 1} Name`}
                  value={author.authorName}
                  onChange={(e) => updateAuthorRow(index, "authorName", e.target.value)}
                  className="h-9"
                />
                <Select
                  value={author.facultyId || author.studentId || "external"}
                  onValueChange={(val) => {
                    if (val.startsWith("fac_")) {
                      updateAuthorRow(index, "facultyId", val.replace("fac_", ""));
                      updateAuthorRow(index, "studentId", undefined);
                    } else if (val.startsWith("std_")) {
                      updateAuthorRow(index, "studentId", val.replace("std_", ""));
                      updateAuthorRow(index, "facultyId", undefined);
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Map to Institutional User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External / Unlinked</SelectItem>
                    {(facultyData?.items || []).map((f) => (
                      <SelectItem key={f.id} value={`fac_${f.id}`}>
                        Faculty: {f.user.name} ({f.department.code})
                      </SelectItem>
                    ))}
                    {(studentData?.items || []).map((s) => (
                      <SelectItem key={s.id} value={`std_${s.id}`}>
                        Student: {s.user.name} ({s.rollNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {authorsList.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeAuthorRow(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Publication
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
