import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePendingApprovalQueue, useSubmitApprovalDecision } from "../hooks/useApprovals";
import type { ResearchItem } from "@/services/research.service";
import type { ApprovalStatusDecision } from "@/services/approval.service";

export function ApprovalQueueView() {
  const [page, setPage] = useState(1);
  const [selectedResearch, setSelectedResearch] = useState<ResearchItem | null>(null);
  const [decisionType, setDecisionType] = useState<ApprovalStatusDecision | null>(null);
  const [comments, setComments] = useState("");

  const { data, isLoading, isError } = usePendingApprovalQueue({ page, limit: 10 });
  const decisionMutation = useSubmitApprovalDecision();

  const handleOpenDecision = (research: ResearchItem, type: ApprovalStatusDecision) => {
    setSelectedResearch(research);
    setDecisionType(type);
    setComments("");
  };

  const handleConfirmDecision = async () => {
    if (!selectedResearch || !decisionType) return;

    await decisionMutation.mutateAsync({
      researchId: selectedResearch.id,
      status: decisionType,
      comments: comments || undefined,
    });

    setSelectedResearch(null);
    setDecisionType(null);
    setComments("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Research Cell Approval Queue</h2>
        <p className="text-xs text-muted-foreground">Review institutional research submissions, provide feedback, and record official approval decisions.</p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-sm font-medium text-muted-foreground">Loading pending approval queue...</span>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
          Failed to load approval queue. Verify that you have Research Cell or Admin privileges.
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
          <p className="text-base font-semibold text-foreground">Queue Clear</p>
          <p className="text-xs text-muted-foreground mt-1">There are no pending research submissions requiring review.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Publication Title</th>
                <th className="px-4 py-3">Submitted By</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Review Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-foreground line-clamp-1">{item.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      {item.venueType === "PATENT" || /patent/i.test(item.title) ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold">
                          📜 Patent {item.patentNumber ? `(${item.patentNumber})` : ""}
                        </Badge>
                      ) : item.venueType === "BOOK" || /isbn/i.test(item.title) ? (
                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30 font-semibold">
                          📚 Book {item.isbn ? `(${item.isbn})` : ""}
                        </Badge>
                      ) : item.venueType === "CONFERENCE" || item.conference ? (
                        <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30 font-semibold">
                          🎤 Conference
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold">
                          📖 Journal
                        </Badge>
                      )}
                      <span>{item.journal || item.conference || "Institutional Submission"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-foreground/90">
                    <div>{item.createdBy?.name || "Faculty Author"}</div>
                    <div className="text-[10px] text-muted-foreground">{item.createdBy?.role}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant="outline" className="font-semibold text-xs">
                      {item.department?.code || "GENERAL"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    <Badge variant="secondary" className="gap-1">
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                        onClick={() => handleOpenDecision(item, "APPROVED")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 gap-1 text-xs"
                        onClick={() => handleOpenDecision(item, "NEEDS_REVISION")}
                      >
                        <AlertCircle className="h-3.5 w-3.5" /> Revision
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 gap-1 text-xs"
                        onClick={() => handleOpenDecision(item, "REJECTED")}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision Dialog */}
      <Dialog open={!!selectedResearch && !!decisionType} onOpenChange={(open) => !open && setSelectedResearch(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Confirm Decision: {decisionType}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              You are recording an official decision for: <strong className="text-foreground">{selectedResearch?.title}</strong>
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="comments" className="text-xs">Reviewer Comments / Feedback</Label>
              <Textarea
                id="comments"
                rows={4}
                placeholder="Provide detailed feedback or revision notes for the author..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedResearch(null)}>
                Cancel
              </Button>
              <Button
                disabled={decisionMutation.isPending}
                onClick={handleConfirmDecision}
                className={
                  decisionType === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : decisionType === "REJECTED"
                    ? "bg-destructive"
                    : ""
                }
              >
                {decisionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm {decisionType}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
