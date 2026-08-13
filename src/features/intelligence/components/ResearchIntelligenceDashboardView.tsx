import React, { useState } from "react";
import {
  useAnalyzeCollaborations,
  useAnalyzeGaps,
  useIntelligenceOverview,
  useReindexIntelligence,
} from "../hooks/useIntelligence";
import { RAGResearchCopilotDrawer } from "./RAGResearchCopilotDrawer";
import {
  Bot,
  BrainCircuit,
  Compass,
  Database,
  Info,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

export const ResearchIntelligenceDashboardView: React.FC = () => {
  const { data: overview, isLoading, refetch } = useIntelligenceOverview();
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [domainQueryInput, setDomainQueryInput] = useState("");

  const analyzeGapsMutation = useAnalyzeGaps();
  const analyzeCollabMutation = useAnalyzeCollaborations();
  const reindexMutation = useReindexIntelligence();

  const metrics = overview?.metrics || {
    totalIndexed: 0,
    totalTopics: 0,
    openGapsCount: 0,
    potentialCollaborationsCount: 0,
  };

  const handleRunGapAnalysis = () => {
    analyzeGapsMutation.mutate({ domainQuery: domainQueryInput || undefined });
  };

  const handleRunCollabAnalysis = () => {
    analyzeCollabMutation.mutate();
  };

  const handleReindex = () => {
    reindexMutation.mutate(undefined, {
      onSuccess: () => refetch(),
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Institutional Research Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              AI Intelligence Subsystem
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Evidence-grounded Research Gap Finder, Cross-Faculty Collaboration Finder, and RAG Copilot
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReindex}
            disabled={reindexMutation.isPending}
            className="px-3 py-2 text-xs font-medium bg-muted hover:bg-accent border border-border text-foreground rounded-lg transition flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reindexMutation.isPending ? "animate-spin" : ""}`} />
            Re-index Embeddings
          </button>

          <button
            onClick={() => setIsCopilotOpen(true)}
            className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-sm flex items-center gap-2"
          >
            <Bot className="h-4 w-4" /> Ask KRIYA Copilot
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Indexed Embeddings</p>
            <h3 className="text-xl font-bold text-foreground">{metrics.totalIndexed}</h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Topic Entities</p>
            <h3 className="text-xl font-bold text-foreground">{metrics.totalTopics}</h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Identified Research Gaps</p>
            <h3 className="text-xl font-bold text-foreground">{metrics.openGapsCount}</h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Potential Collaborations</p>
            <h3 className="text-xl font-bold text-foreground">{metrics.potentialCollaborationsCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Feature Section 1: Research Gap Finder */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-4 rounded-xl border border-border/60">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Compass className="h-4 w-4 text-amber-500" /> Research Gap Finder
            </h2>
            <p className="text-xs text-muted-foreground">
              Evaluates Institutional Evidence + Real External Global Signals into deterministic Opportunity Scores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={domainQueryInput}
              onChange={(e) => setDomainQueryInput(e.target.value)}
              placeholder="e.g. AI in Agriculture"
              className="px-3 py-1.5 text-xs rounded-lg bg-card border border-border text-foreground w-48 focus:outline-none"
            />
            <button
              onClick={handleRunGapAnalysis}
              disabled={analyzeGapsMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-amber-950 font-semibold rounded-lg hover:bg-amber-400 transition flex items-center gap-1"
            >
              <Zap className={`h-3.5 w-3.5 ${analyzeGapsMutation.isPending ? "animate-spin" : ""}`} /> Analyze Gaps
            </button>
          </div>
        </div>

        {/* Gap Cards Grid */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading institutional research intelligence...</div>
        ) : overview?.gaps && overview.gaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overview.gaps.map((gap, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground leading-snug">{gap.gapTitle}</h3>
                    <span className="px-2 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                      Score: {gap.opportunityScore}/100
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">{gap.description}</p>

                  {/* Dual Evidence Box */}
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-[11px] space-y-1.5">
                    <div>
                      <span className="font-semibold text-foreground">Institutional Evidence:</span>{" "}
                      <span className="text-muted-foreground">{gap.institutionalEvidence}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">External Global Signals:</span>{" "}
                      <span className="text-muted-foreground">{gap.externalEvidence}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-primary">AI Inference:</span>{" "}
                      <span className="text-foreground">{gap.aiInference}</span>
                    </div>
                  </div>
                </div>

                {/* Limitations Disclaimer */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 italic text-amber-500/90">
                    <Info className="h-3 w-3 shrink-0" /> {gap.limitations}
                  </span>
                  <span className="font-semibold text-foreground">Confidence: {gap.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
            No research gaps generated yet. Enter a target domain query above and click <span className="font-semibold text-foreground">Analyze Gaps</span>.
          </div>
        )}
      </div>

      {/* Main Feature Section 2: Collaboration Finder */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/60">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" /> Research Collaboration Finder
            </h2>
            <p className="text-xs text-muted-foreground">
              Cross-faculty complementary compatibility scoring based on topics, expertise, and joint potential
            </p>
          </div>

          <button
            onClick={handleRunCollabAnalysis}
            disabled={analyzeCollabMutation.isPending}
            className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition flex items-center gap-1"
          >
            <Sparkles className={`h-3.5 w-3.5 ${analyzeCollabMutation.isPending ? "animate-spin" : ""}`} /> Find Collaborations
          </button>
        </div>

        {/* Collaborations Grid */}
        {overview?.collaborations && overview.collaborations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overview.collaborations.map((collab, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <span>{collab.facultyA?.name || collab.facultyA?.user?.name}</span>
                    <span className="text-muted-foreground">↔</span>
                    <span>{collab.facultyB?.name || collab.facultyB?.user?.name}</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-500/10 text-emerald-500">
                    Match: {collab.compatibilityScore}%
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-semibold text-primary">{collab.potentialDirection}</p>
                  <p className="text-muted-foreground text-[11px]">{collab.reasoning}</p>
                </div>

                <div className="p-2 rounded bg-muted/30 text-[11px] space-y-1">
                  <div>
                    <span className="font-medium text-foreground">Departments:</span>{" "}
                    <span className="text-muted-foreground">
                      {collab.facultyA?.departmentName} & {collab.facultyB?.departmentName}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Shared Topics:</span>{" "}
                    <span className="text-muted-foreground">
                      {Array.isArray(collab.sharedTopics) ? collab.sharedTopics.join(", ") : collab.sharedTopics}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
            No collaboration recommendations indexed yet. Click <span className="font-semibold text-foreground">Find Collaborations</span> above to generate pairing recommendations.
          </div>
        )}
      </div>

      {/* RAG Research Copilot Drawer */}
      <RAGResearchCopilotDrawer isOpen={isCopilotOpen} onClose={() => setIsCopilotOpen(false)} />
    </div>
  );
};
