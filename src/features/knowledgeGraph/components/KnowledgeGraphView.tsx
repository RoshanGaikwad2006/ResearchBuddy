import React, { useState } from "react";
import {
  useGraphAnalytics,
  useKnowledgeGraph,
} from "../hooks/useKnowledgeGraph";
import { GraphNodeItem } from "../../../services/knowledgeGraph.service";
import { NodeDetailDrawer } from "./NodeDetailDrawer";
import { RAGResearchCopilotDrawer } from "../../intelligence/components/RAGResearchCopilotDrawer";
import {
  Bot,
  BrainCircuit,
  Building2,
  Compass,
  Filter,
  Layers,
  RefreshCw,
  Search,
  Users,
  ZoomIn,
  ZoomOut,
  Info,
} from "lucide-react";

export const KnowledgeGraphView: React.FC = () => {
  const [selectedDeptId, setSelectedDeptId] = useState<string | undefined>(undefined);
  const [selectedDepth, setSelectedDepth] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<GraphNodeItem | null>(null);

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInitialQuery, setCopilotInitialQuery] = useState("");

  const { data: graph, isLoading, refetch } = useKnowledgeGraph({
    departmentId: selectedDeptId,
    depth: selectedDepth,
  });

  const { data: analytics } = useGraphAnalytics();

  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const stats = graph?.stats || {
    totalNodes: 0,
    totalEdges: 0,
    facultyCount: 0,
    researchCount: 0,
    topicCount: 0,
    gapCount: 0,
    collaborationCount: 0,
  };

  const filteredNodes = nodes.filter((n) =>
    searchQuery
      ? n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.type.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleOpenCopilotWithContext = (query: string) => {
    setCopilotInitialQuery(query);
    setIsCopilotOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Research Knowledge Graph</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Interactive Network
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Visual research ecosystem mapping faculty, publications, topics, research gaps, and collaborations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="px-3 py-2 text-xs font-medium bg-muted hover:bg-accent border border-border text-foreground rounded-lg transition flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Graph
          </button>

          <button
            onClick={() => {
              setCopilotInitialQuery("Explain our institutional research knowledge graph structure and key research hubs.");
              setIsCopilotOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-sm flex items-center gap-2"
          >
            <Bot className="h-4 w-4" /> Ask KRIYA Copilot
          </button>
        </div>
      </div>

      {/* Stats & Legend Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs text-center">
          <span className="text-[11px] text-muted-foreground font-medium block">Total Nodes</span>
          <span className="text-lg font-bold text-foreground">{stats.totalNodes}</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs text-center">
          <span className="text-[11px] text-muted-foreground font-medium block">Relationships</span>
          <span className="text-lg font-bold text-foreground">{stats.totalEdges}</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs text-center">
          <span className="text-[11px] text-blue-500 font-medium block">Faculty</span>
          <span className="text-lg font-bold text-blue-500">{stats.facultyCount}</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs text-center">
          <span className="text-[11px] text-amber-500 font-medium block">Publications</span>
          <span className="text-lg font-bold text-amber-500">{stats.researchCount}</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs text-center">
          <span className="text-[11px] text-purple-500 font-medium block">Topics</span>
          <span className="text-lg font-bold text-purple-500">{stats.topicCount}</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70 shadow-2xs text-center">
          <span className="text-[11px] text-emerald-500 font-medium block">Collaborations</span>
          <span className="text-lg font-bold text-emerald-500">{stats.collaborationCount}</span>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border/70 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes by name, topic, or title..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-card border border-border text-foreground focus:outline-none"
          />
        </div>

        {/* Depth & Filter Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">Depth:</span>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDepth(d)}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  selectedDepth === d ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent text-foreground"
                }`}
              >
                Depth {d}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedDeptId || ""}
              onChange={(e) => setSelectedDeptId(e.target.value || undefined)}
              className="px-2.5 py-1 rounded bg-card border border-border text-foreground focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="dept_cse">CSE Department</option>
              <option value="dept_ece">ECE Department</option>
              <option value="dept_mech">MECH Department</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Interactive Graph Canvas & Node List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Graph View (2/3 width) */}
        <div className="lg:col-span-2 min-h-[480px] rounded-2xl bg-card border border-border/80 p-4 relative flex flex-col justify-between overflow-hidden shadow-xs">
          {/* Top Controls Overlay */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-foreground">Interactive Network Topology</span>
            </div>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
              <button title="Zoom In" className="p-1 rounded hover:bg-accent text-foreground"><ZoomIn className="h-3.5 w-3.5" /></button>
              <button title="Zoom Out" className="p-1 rounded hover:bg-accent text-foreground"><ZoomOut className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {/* Interactive Graph Node Cloud */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mb-2"></div>
              <p className="text-xs font-medium text-muted-foreground">Deriving Knowledge Graph from PostgreSQL database...</p>
            </div>
          ) : filteredNodes.length > 0 ? (
            <div className="flex-1 my-6 relative flex flex-wrap content-center justify-center gap-3 p-4 bg-muted/10 rounded-xl border border-border/40">
              {filteredNodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNode(n)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 hover:scale-105 shadow-xs flex items-center gap-2.5 ${
                    selectedNode?.id === n.id
                      ? "ring-2 ring-primary border-primary bg-primary/10 shadow-md"
                      : "bg-card border-border/80 hover:border-primary/50"
                  }`}
                  style={{ borderLeftWidth: "4px", borderLeftColor: n.color || "#3b82f6" }}
                >
                  <span
                    className="h-6 w-6 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shrink-0"
                    style={{ backgroundColor: n.color || "#3b82f6" }}
                  >
                    {n.type[0]}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-none">{n.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.subtitle || n.category}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
              No matching graph nodes found for current search/filters.
            </div>
          )}

          {/* Graph Legend Footer */}
          <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Graph Legend:</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> Faculty</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Research</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span> Topic</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500"></span> Research Gap</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Collaboration</span>
            </div>
          </div>
        </div>

        {/* Graph Network Analytics Side Panel (1/3 width) */}
        <div className="space-y-4">
          {/* Analytics Card */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="h-4 w-4 text-primary" /> Graph Network Hubs
            </h3>

            {analytics?.topConnectedFaculty && analytics.topConnectedFaculty.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground">Most Connected Faculty Hubs</p>
                {analytics.topConnectedFaculty.map((f, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-muted/30 border border-border/50 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">{f.name}</p>
                      <p className="text-[10px] text-muted-foreground">{f.department}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold text-[11px]">
                      {f.publications} papers
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {analytics?.topResearchTopics && analytics.topResearchTopics.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <p className="text-[11px] font-semibold text-muted-foreground">Top Institutional Research Clusters</p>
                <div className="flex flex-wrap gap-1.5">
                  {analytics.topResearchTopics.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-medium text-[11px]">
                      {t.name} ({t.paperCount})
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Cross-Department Network Summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/30 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Cross-Department Network
              </h4>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-600">
                {analytics?.crossDepartmentCollaborationsCount || 0} Matches
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Identifies interdisciplinary research partnerships linking CSE, ECE, and Mechanical Engineering.
            </p>
          </div>
        </div>
      </div>

      {/* Node Detail Side Drawer */}
      <NodeDetailDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onOpenCopilotWithContext={handleOpenCopilotWithContext}
      />

      {/* RAG Research Copilot Drawer */}
      <RAGResearchCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
};
