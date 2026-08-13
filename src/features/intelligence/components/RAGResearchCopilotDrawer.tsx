import React, { useState } from "react";
import { useRAGCopilot } from "../hooks/useIntelligence";
import { RAGCopilotResponse } from "../../../services/intelligence.service";
import { Bot, FileText, Send, Sparkles, X, AlertCircle } from "lucide-react";

interface RAGResearchCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RAGResearchCopilotDrawer: React.FC<RAGResearchCopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [queryInput, setQueryInput] = useState("");
  const [activeResponse, setActiveResponse] = useState<RAGCopilotResponse | null>(null);
  const copilotMutation = useRAGCopilot();

  if (!isOpen) return null;

  const handleSend = () => {
    if (!queryInput.trim()) return;
    copilotMutation.mutate(
      { query: queryInput },
      {
        onSuccess: (data) => {
          setActiveResponse(data);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                Ask KRIYA — RAG Research Copilot
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-medium">
                  Evidence-Grounded
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">Backed by retrieved KRIYA database records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Sample Prompts */}
          {!activeResponse && !copilotMutation.isPending && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggested Queries</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "Which faculty work on Machine Learning and Artificial Intelligence?",
                  "What are the major research gaps in interdisciplinary agriculture AI?",
                  "Show institutional publication trends and high-citation topics.",
                  "Find potential cross-department faculty collaborators for IoT.",
                ].map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQueryInput(promptText);
                    }}
                    className="p-3 text-left rounded-lg bg-muted/40 hover:bg-accent border border-border/50 text-xs text-foreground font-medium transition flex items-center gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pending State */}
          {copilotMutation.isPending && (
            <div className="p-6 text-center space-y-3 bg-muted/20 rounded-xl border border-border/40">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
              <p className="text-sm font-medium text-foreground">Retrieving verified KRIYA evidence & synthesizing response...</p>
              <p className="text-xs text-muted-foreground">Executing PostgreSQL vector search & OpenRouter LLM orchestration</p>
            </div>
          )}

          {/* Active Response Card */}
          {activeResponse && !copilotMutation.isPending && (
            <div className="space-y-4">
              {/* Refusal Banner */}
              {activeResponse.resultStatus === "REFUSAL" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2.5 text-amber-500 text-xs font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Controlled Refusal:</span> {activeResponse.answer}
                  </div>
                </div>
              )}

              {/* Main Answer */}
              {activeResponse.resultStatus !== "REFUSAL" && (
                <div className="p-4 rounded-xl bg-card border border-border/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                    <span className="font-medium text-primary flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Model: {activeResponse.modelUsed}
                    </span>
                    <span>Latency: {activeResponse.latencyMs} ms</span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-foreground whitespace-pre-line leading-relaxed">
                    {activeResponse.answer}
                  </div>
                </div>
              )}

              {/* Evidence References List */}
              {activeResponse.evidence && activeResponse.evidence.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Retrieved Source Evidence ({activeResponse.evidence.length})
                  </h4>
                  <div className="space-y-2">
                    {activeResponse.evidence.map((ev, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-muted/30 border border-border/60 text-xs space-y-1">
                        <div className="font-medium text-foreground flex items-center justify-between">
                          <span>[{idx + 1}] {ev.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                            {ev.year || "N/A"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Authors: {ev.authors || "Institutional Authors"}</p>
                        {ev.doi && <p className="text-[10px] text-primary/80 font-mono">DOI: {ev.doi}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a research intelligence question..."
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSend}
              disabled={copilotMutation.isPending || !queryInput.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
