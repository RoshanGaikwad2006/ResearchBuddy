import React, { useState } from "react";
import { useIntelligenceOverview } from "../hooks/useIntelligence";
import { RAGResearchCopilotDrawer } from "./RAGResearchCopilotDrawer";
import { Bot, BrainCircuit, Compass, Info, Sparkles, Users } from "lucide-react";

export const FacultyResearchIntelligenceView: React.FC = () => {
  const { data: overview, isLoading } = useIntelligenceOverview();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            My Research Intelligence
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-semibold">Faculty Intelligence</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Personalized research opportunities, potential collaborator matches, and AI RAG copilot
          </p>
        </div>

        <button
          onClick={() => setIsCopilotOpen(true)}
          className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-sm flex items-center gap-2"
        >
          <Bot className="h-4 w-4" /> Ask KRIYA Copilot
        </button>
      </div>

      {/* Topics Summary */}
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <BrainCircuit className="h-4 w-4 text-primary" /> Active Institutional Research Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {overview?.topics && overview.topics.length > 0 ? (
            overview.topics.map((t, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-md bg-muted text-xs text-foreground font-medium flex items-center gap-1.5 border border-border/50">
                <span>{t.name}</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-primary/20 text-primary font-bold">
                  {t.researchCount}
                </span>
              </span>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No topic entities indexed yet.</p>
          )}
        </div>
      </div>

      {/* Grid: Potential Gaps & Collaborators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Collaborators */}
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500" /> Recommended Collaborators
          </h3>

          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading collaboration matches...</p>
          ) : overview?.collaborations && overview.collaborations.length > 0 ? (
            <div className="space-y-3">
              {overview.collaborations.slice(0, 3).map((collab, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>{collab.facultyB?.name || collab.facultyB?.user?.name || "Target Faculty"}</span>
                    <span className="text-emerald-500 font-bold">{collab.compatibilityScore}% Match</span>
                  </div>
                  <p className="text-primary font-medium text-[11px]">{collab.potentialDirection}</p>
                  <p className="text-muted-foreground text-[10px]">{collab.reasoning}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No collaboration pairings found for your profile yet.</p>
          )}
        </div>

        {/* Research Opportunity Hypotheses */}
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Compass className="h-4 w-4 text-amber-500" /> High-Opportunity Research Gaps
          </h3>

          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading research gaps...</p>
          ) : overview?.gaps && overview.gaps.length > 0 ? (
            <div className="space-y-3">
              {overview.gaps.slice(0, 2).map((gap, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>{gap.gapTitle}</span>
                    <span className="text-amber-500 font-bold">Score: {gap.opportunityScore}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{gap.description}</p>
                  <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <Info className="h-3 w-3 shrink-0 text-amber-500" /> {gap.limitations}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No research gaps indexed for your department yet.</p>
          )}
        </div>
      </div>

      {/* RAG Research Copilot Drawer */}
      <RAGResearchCopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </div>
  );
};
