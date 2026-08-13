import { useState } from "react";
import { Loader2, Plus, Search, FileText, CheckCircle2, Clock3, XCircle, AlertCircle, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useResearchList } from "../hooks/useResearch";
import { ResearchSubmissionModal } from "./ResearchSubmissionModal";
import { ResearchDetailModal } from "./ResearchDetailModal";
import type { ResearchItem, ResearchStatusType } from "@/services/research.service";

export function ResearchListView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResearchStatusType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<ResearchItem | null>(null);

  const { data, isLoading, isError } = useResearchList({
    search: search || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page,
    limit: 9,
  });

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
            <AlertCircle className="h-3 w-3" /> Revisions
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

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search publications by title, DOI, author, or keyword..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-10"
          />
        </div>

        <Button onClick={() => setIsSubmitModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Submit Publication
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex overflow-x-auto rounded-xl border border-border bg-card p-1 text-xs">
        {[
          { label: "All Papers", value: "ALL" },
          { label: "Submitted", value: "SUBMITTED" },
          { label: "Under Review", value: "UNDER_REVIEW" },
          { label: "Approved", value: "APPROVED" },
          { label: "Needs Revision", value: "NEEDS_REVISION" },
          { label: "Rejected", value: "REJECTED" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatusFilter(tab.value as any);
              setPage(1);
            }}
            className={`flex-1 min-w-[100px] rounded-lg py-2 font-medium transition-all ${
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm font-medium text-muted-foreground">Loading publications...</span>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Failed to load publication list. Please try again.
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-base font-semibold text-foreground">No research publications found</p>
          <p className="text-xs text-muted-foreground mt-1">Submit your first paper to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/40 hover:shadow-card"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  {getStatusBadge(item.status)}
                  <span className="text-xs text-muted-foreground">{item.publicationYear}</span>
                </div>

                <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-snug text-foreground">
                  {item.title}
                </h3>

                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {item.abstract}
                </p>

                {item.doi && (
                  <div className="mt-3 flex items-center gap-1 text-[11px] text-primary font-mono truncate">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{item.doi}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 border-t border-border pt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  {item.journal || item.conference || "Publication"}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedResearch(item)}
                  className="gap-1 text-xs text-primary"
                >
                  <Eye className="h-3.5 w-3.5" /> View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>Showing Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} Total)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ResearchSubmissionModal
        open={isSubmitModalOpen}
        onOpenChange={setIsSubmitModalOpen}
      />

      <ResearchDetailModal
        open={!!selectedResearch}
        onOpenChange={(open) => !open && setSelectedResearch(null)}
        research={selectedResearch}
      />
    </div>
  );
}
