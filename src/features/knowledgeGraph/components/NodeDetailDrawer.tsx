import React from "react";
import { GraphNodeItem } from "../../../services/knowledgeGraph.service";
import { Bot, ExternalLink, FileText, Info, Sparkles, User, Users, X, Building2, BrainCircuit } from "lucide-react";

interface NodeDetailDrawerProps {
  node: GraphNodeItem | null;
  onClose: () => void;
  onOpenCopilotWithContext: (contextQuery: string) => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  onClose,
  onOpenCopilotWithContext,
}) => {
  if (!node) return null;

  const m = (node.metadata as any) || {};

  const handleAskCopilot = () => {
    let query = "";
    if (node.type === "FACULTY") {
      query = `Tell me about Faculty member ${m.name} in ${m.departmentName}, their publications and research topics.`;
    } else if (node.type === "RESEARCH") {
      query = `Summarize publication "${m.title}" published in ${m.publicationYear} with ${m.citationCount} citations.`;
    } else if (node.type === "TOPIC") {
      query = `Which faculty members and departments research ${m.name}?`;
    } else if (node.type === "RESEARCH_GAP") {
      query = `Explain the research gap opportunity "${m.gapTitle}" and why it has a score of ${m.opportunityScore}.`;
    } else if (node.type === "COLLABORATION") {
      query = `Explain why KRIYA recommends collaboration "${m.potentialDirection}" with score ${m.compatibilityScore}%.`;
    } else {
      query = `Explain relationships for ${node.label}.`;
    }
    onOpenCopilotWithContext(query);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2.5">
          <span
            className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
            style={{ backgroundColor: node.color || "#3b82f6" }}
          >
            {node.type[0]}
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-none">{node.label}</h3>
            <p className="text-[11px] text-muted-foreground mt-1">{node.category || node.type}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body Metadata */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* FACULTY NODE DETAILS */}
        {node.type === "FACULTY" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <User className="h-4 w-4 text-blue-500" /> {m.name}
              </div>
              <p className="text-muted-foreground">{m.designation} — {m.departmentName}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 font-medium">
                <div>Publications: <span className="font-bold text-foreground">{m.publicationCount}</span></div>
                <div>Total Citations: <span className="font-bold text-primary">{m.totalCitations}</span></div>
              </div>
            </div>

            {m.orcid && (
              <div className="flex items-center justify-between p-2 rounded bg-muted/20 text-[11px]">
                <span className="text-muted-foreground">ORCID iD:</span>
                <span className="font-mono text-primary font-medium">{m.orcid}</span>
              </div>
            )}

            {m.scholarAuthorId && (
              <a
                href={`https://scholar.google.com/citations?user=${m.scholarAuthorId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 font-medium transition"
              >
                <span>View Google Scholar Profile</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}

        {/* RESEARCH NODE DETAILS */}
        {node.type === "RESEARCH" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-start gap-2 font-semibold text-foreground">
                <FileText className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span>{m.title}</span>
              </div>
              <p className="text-muted-foreground">{m.journal} ({m.publicationYear})</p>
              <div className="flex items-center justify-between pt-2 border-t border-border/40 font-medium">
                <span>Citations: <strong className="text-primary">{m.citationCount}</strong></span>
                <span>Department: <strong className="text-foreground">{m.departmentName || "General"}</strong></span>
              </div>
            </div>

            {m.doi && (
              <a
                href={`https://doi.org/${m.doi}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 font-medium transition"
              >
                <span className="font-mono text-[11px]">https://doi.org/{m.doi}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}

        {/* TOPIC NODE DETAILS */}
        {node.type === "TOPIC" && (
          <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <BrainCircuit className="h-4 w-4 text-purple-500" /> {m.name}
            </div>
            <p className="text-muted-foreground">Indexed Papers in Topic: <strong className="text-foreground">{m.researchCount}</strong></p>
          </div>
        )}

        {/* RESEARCH GAP NODE DETAILS */}
        {node.type === "RESEARCH_GAP" && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-600">
              <span>{m.gapTitle}</span>
              <span>Score: {m.opportunityScore}</span>
            </div>
            <p className="text-muted-foreground text-[11px]">{m.description}</p>
            <p className="text-[10px] text-amber-600/90 italic flex items-center gap-1 pt-1 border-t border-amber-500/20">
              <Info className="h-3 w-3 shrink-0" /> {m.limitations}
            </p>
          </div>
        )}

        {/* COLLABORATION NODE DETAILS */}
        {node.type === "COLLABORATION" && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between font-bold text-emerald-600">
              <span>Potential Collaboration Match</span>
              <span>{m.compatibilityScore}%</span>
            </div>
            <p className="font-semibold text-foreground text-xs">{m.potentialDirection}</p>
            <p className="text-muted-foreground text-[11px]">{m.reasoning}</p>
          </div>
        )}

        {/* DEPARTMENT NODE DETAILS */}
        {node.type === "DEPARTMENT" && (
          <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/30 space-y-2">
            <div className="flex items-center gap-2 font-bold text-pink-600">
              <Building2 className="h-4 w-4" /> {m.code} — {m.name}
            </div>
          </div>
        )}
      </div>

      {/* Footer Copilot Context Launcher */}
      <div className="p-3 border-t border-border bg-card">
        <button
          onClick={handleAskCopilot}
          className="w-full py-2.5 px-3 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition flex items-center justify-center gap-2 shadow-xs"
        >
          <Bot className="h-4 w-4" /> Ask KRIYA Copilot About Selection
        </button>
      </div>
    </div>
  );
};
