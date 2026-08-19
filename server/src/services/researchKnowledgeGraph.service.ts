import { prisma } from "../config/db.js";

export type GraphNodeType =
  | "FACULTY"
  | "STUDENT"
  | "DEPARTMENT"
  | "RESEARCH"
  | "TOPIC"
  | "RESEARCH_GAP"
  | "COLLABORATION";

export type GraphEdgeType =
  | "AUTHORED"
  | "MEMBER_OF"
  | "HAS_TOPIC"
  | "CO_AUTHORED_WITH"
  | "POTENTIAL_COLLABORATOR"
  | "RELEVANT_TO"
  | "RELATED_TOPIC";

export interface GraphNodeDTO {
  id: string;
  type: GraphNodeType;
  label: string;
  subtitle?: string;
  category?: string;
  val: number; // Node size / weight
  color?: string;
  metadata: Record<string, any>;
}

export interface GraphEdgeDTO {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label?: string;
  weight: number;
  metadata?: Record<string, any>;
}

export interface KnowledgeGraphDTO {
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    facultyCount: number;
    researchCount: number;
    topicCount: number;
    gapCount: number;
    collaborationCount: number;
  };
}

export interface GraphFilterOptions {
  departmentId?: string;
  facultyId?: string;
  topicName?: string;
  yearStart?: number;
  yearEnd?: number;
  depth?: number; // 1, 2, or 3
  nodeTypes?: GraphNodeType[];
  limitNodes?: number;
}

export class ResearchKnowledgeGraphService {
  /**
   * Node Color System for consistent visual hierarchy
   */
  static NODE_COLORS: Record<GraphNodeType, string> = {
    FACULTY: "#3b82f6", // Blue
    STUDENT: "#f97316", // Orange
    DEPARTMENT: "#ec4899", // Pink
    RESEARCH: "#eab308", // Yellow / Amber
    TOPIC: "#a855f7", // Purple
    RESEARCH_GAP: "#ef4444", // Red
    COLLABORATION: "#10b981", // Emerald Green
  };

  /**
   * Main Institutional Graph Builder
   */
  static async buildInstitutionalGraph(options?: GraphFilterOptions): Promise<KnowledgeGraphDTO> {
    const {
      departmentId,
      facultyId,
      topicName,
      yearStart,
      yearEnd,
      depth = 2,
      nodeTypes,
      limitNodes = 100,
    } = options || {};

    const nodeMap = new Map<string, GraphNodeDTO>();
    const edgeMap = new Map<string, GraphEdgeDTO>();

    const addNode = (node: GraphNodeDTO) => {
      if (nodeTypes && nodeTypes.length > 0 && !nodeTypes.includes(node.type)) return;
      if (!nodeMap.has(node.id) && nodeMap.size < limitNodes) {
        nodeMap.set(node.id, node);
      }
    };

    const addEdge = (edge: GraphEdgeDTO) => {
      if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
        if (!edgeMap.has(edge.id)) {
          edgeMap.set(edge.id, edge);
        }
      }
    };

    // 1. Fetch Departments
    const deptWhere: any = {};
    if (departmentId) deptWhere.id = departmentId;
    const departments = await prisma.department.findMany({ where: deptWhere });

    departments.forEach((d) => {
      addNode({
        id: `dept_${d.id}`,
        type: "DEPARTMENT",
        label: `${d.code} Department`,
        subtitle: d.name,
        category: "Department",
        val: 14,
        color: this.NODE_COLORS.DEPARTMENT,
        metadata: { id: d.id, code: d.code, name: d.name },
      });
    });

    // 2. Fetch Faculties
    const facWhere: any = {};
    if (departmentId) facWhere.departmentId = departmentId;
    if (facultyId) facWhere.id = facultyId;

    const faculties = await prisma.faculty.findMany({
      where: facWhere,
      include: {
        user: true,
        department: true,
        researchAuthorships: {
          include: {
            research: {
              include: { department: true },
            },
          },
        },
      },
      take: 25,
    });

    faculties.forEach((f) => {
      const facNodeId = `fac_${f.id}`;
      addNode({
        id: facNodeId,
        type: "FACULTY",
        label: f.user.name,
        subtitle: `${f.designation} (${f.department.code})`,
        category: "Faculty",
        val: Math.min(20, Math.max(10, f.publicationCount * 2 + 8)),
        color: this.NODE_COLORS.FACULTY,
        metadata: {
          id: f.id,
          name: f.user.name,
          email: f.user.email,
          designation: f.designation,
          departmentId: f.departmentId,
          departmentName: f.department.name,
          publicationCount: f.publicationCount,
          totalCitations: f.totalCitations,
          orcid: f.orcid,
          scholarAuthorId: f.scholarAuthorId,
          scopusAuthorId: f.scopusAuthorId,
          scopusUrl: f.scopusUrl,
        },
      });

      // Edge: Faculty MEMBER_OF Department
      if (f.departmentId) {
        addEdge({
          id: `edge_${facNodeId}_dept_${f.departmentId}`,
          source: facNodeId,
          target: `dept_${f.departmentId}`,
          type: "MEMBER_OF",
          label: "Member of",
          weight: 1,
        });
      }
    });

    // 3. Fetch Researches & Authorships
    const researchWhere: any = {};
    if (departmentId) researchWhere.departmentId = departmentId;
    if (facultyId) researchWhere.authors = { some: { facultyId } };
    if (yearStart || yearEnd) {
      researchWhere.publicationYear = {};
      if (yearStart) researchWhere.publicationYear.gte = Number(yearStart);
      if (yearEnd) researchWhere.publicationYear.lte = Number(yearEnd);
    }

    const researches = await prisma.research.findMany({
      where: researchWhere,
      include: {
        department: true,
        authors: { include: { faculty: { include: { user: true } } } },
      },
      take: 35,
    });

    researches.forEach((r) => {
      const paperNodeId = `paper_${r.id}`;
      addNode({
        id: paperNodeId,
        type: "RESEARCH",
        label: r.title.length > 30 ? r.title.substring(0, 30) + "..." : r.title,
        subtitle: `Paper (${r.publicationYear})`,
        category: "Research",
        val: Math.min(18, Math.max(8, r.citationCount + 6)),
        color: this.NODE_COLORS.RESEARCH,
        metadata: {
          id: r.id,
          title: r.title,
          publicationYear: r.publicationYear,
          citationCount: r.citationCount,
          doi: r.doi,
          journal: r.journal || r.conference || "Publication",
          departmentName: r.department?.name,
        },
      });

      // Edge: Faculty AUTHORED Research
      r.authors.forEach((a) => {
        if (a.facultyId) {
          addEdge({
            id: `edge_fac_${a.facultyId}_${paperNodeId}`,
            source: `fac_${a.facultyId}`,
            target: paperNodeId,
            type: "AUTHORED",
            label: "Authored",
            weight: 2,
          });
        }
      });

      // Co-authorship Edges (Faculty ↔ Faculty)
      for (let i = 0; i < r.authors.length; i++) {
        for (let j = i + 1; j < r.authors.length; j++) {
          const fA = r.authors[i].facultyId;
          const fB = r.authors[j].facultyId;
          if (fA && fB && fA !== fB) {
            const coedgeId = `edge_coauth_${[fA, fB].sort().join("_")}`;
            const existingEdge = edgeMap.get(coedgeId);
            if (existingEdge) {
              existingEdge.weight += 1;
            } else {
              addEdge({
                id: coedgeId,
                source: `fac_${fA}`,
                target: `fac_${fB}`,
                type: "CO_AUTHORED_WITH",
                label: "Co-authored with",
                weight: 1,
              });
            }
          }
        }
      }
    });

    // 4. Fetch Topics & Link to Research (Depth >= 2)
    if (depth >= 2) {
      const topicWhere: any = {};
      if (topicName) topicWhere.name = { contains: topicName, mode: "insensitive" };
      const topics = await prisma.researchTopic.findMany({
        where: topicWhere,
        orderBy: { researchCount: "desc" },
        take: 15,
      });

      topics.forEach((t) => {
        const topicNodeId = `topic_${t.id}`;
        addNode({
          id: topicNodeId,
          type: "TOPIC",
          label: t.name,
          subtitle: `Topic (${t.researchCount} papers)`,
          category: "Topic",
          val: Math.min(16, Math.max(8, t.researchCount + 5)),
          color: this.NODE_COLORS.TOPIC,
          metadata: { id: t.id, name: t.name, researchCount: t.researchCount },
        });

        // Link topics to papers matching area/keywords
        researches.forEach((r) => {
          const isTopicInPaper =
            r.researchArea.toLowerCase().includes(t.name.toLowerCase()) ||
            r.keywords.some((k) => k.toLowerCase().includes(t.name.toLowerCase()));

          if (isTopicInPaper) {
            addEdge({
              id: `edge_paper_${r.id}_${topicNodeId}`,
              source: `paper_${r.id}`,
              target: topicNodeId,
              type: "HAS_TOPIC",
              label: "Has Topic",
              weight: 1,
            });
          }
        });
      });
    }

    // 5. Fetch Research Gaps & Collaborations (Depth >= 3)
    if (depth >= 3) {
      const gaps = await prisma.researchGap.findMany({ take: 5, orderBy: { opportunityScore: "desc" } });
      gaps.forEach((g) => {
        const gapNodeId = `gap_${g.id}`;
        addNode({
          id: gapNodeId,
          type: "RESEARCH_GAP",
          label: g.gapTitle.length > 25 ? g.gapTitle.substring(0, 25) + "..." : g.gapTitle,
          subtitle: `Gap (Score: ${g.opportunityScore})`,
          category: "Research Gap",
          val: 14,
          color: this.NODE_COLORS.RESEARCH_GAP,
          metadata: {
            id: g.id,
            gapTitle: g.gapTitle,
            description: g.description,
            opportunityScore: g.opportunityScore,
            confidence: g.confidence,
            limitations: g.limitations,
          },
        });

        if (g.facultyId) {
          addEdge({
            id: `edge_gap_${g.id}_fac_${g.facultyId}`,
            source: gapNodeId,
            target: `fac_${g.facultyId}`,
            type: "RELEVANT_TO",
            label: "Relevant to Faculty",
            weight: 2,
          });
        }
      });

      const collabs = await prisma.collaborationRecommendation.findMany({
        take: 8,
        orderBy: { compatibilityScore: "desc" },
      });

      collabs.forEach((c) => {
        const collabNodeId = `collab_${c.id}`;
        addNode({
          id: collabNodeId,
          type: "COLLABORATION",
          label: `Match (${c.compatibilityScore}%)`,
          subtitle: c.potentialDirection.length > 25 ? c.potentialDirection.substring(0, 25) + "..." : c.potentialDirection,
          category: "Potential Collaboration",
          val: 12,
          color: this.NODE_COLORS.COLLABORATION,
          metadata: {
            id: c.id,
            compatibilityScore: c.compatibilityScore,
            potentialDirection: c.potentialDirection,
            reasoning: c.reasoning,
          },
        });

        addEdge({
          id: `edge_collab_${c.id}_fac_${c.facultyAId}`,
          source: collabNodeId,
          target: `fac_${c.facultyAId}`,
          type: "POTENTIAL_COLLABORATOR",
          label: "Potential Match",
          weight: 2,
        });

        addEdge({
          id: `edge_collab_${c.id}_fac_${c.facultyBId}`,
          source: collabNodeId,
          target: `fac_${c.facultyBId}`,
          type: "POTENTIAL_COLLABORATOR",
          label: "Potential Match",
          weight: 2,
        });
      });
    }

    const nodesArray = Array.from(nodeMap.values());
    const edgesArray = Array.from(edgeMap.values());

    return {
      nodes: nodesArray,
      edges: edgesArray,
      stats: {
        totalNodes: nodesArray.length,
        totalEdges: edgesArray.length,
        facultyCount: nodesArray.filter((n) => n.type === "FACULTY").length,
        researchCount: nodesArray.filter((n) => n.type === "RESEARCH").length,
        topicCount: nodesArray.filter((n) => n.type === "TOPIC").length,
        gapCount: nodesArray.filter((n) => n.type === "RESEARCH_GAP").length,
        collaborationCount: nodesArray.filter((n) => n.type === "COLLABORATION").length,
      },
    };
  }

  /**
   * Faculty-Centric Subgraph Builder
   */
  static async buildFacultySubgraph(facultyId: string, depth = 2): Promise<KnowledgeGraphDTO> {
    return this.buildInstitutionalGraph({ facultyId, depth, limitNodes: 60 });
  }

  /**
   * Department-Centric Subgraph Builder
   */
  static async buildDepartmentSubgraph(departmentId: string): Promise<KnowledgeGraphDTO> {
    return this.buildInstitutionalGraph({ departmentId, depth: 3, limitNodes: 80 });
  }

  /**
   * Topic-Centric Subgraph Builder
   */
  static async buildTopicSubgraph(topicName: string): Promise<KnowledgeGraphDTO> {
    return this.buildInstitutionalGraph({ topicName, depth: 3, limitNodes: 80 });
  }

  /**
   * Lightweight Deterministic Graph Analytics (Top Hubs, Clusters, Bridges)
   */
  static async getGraphAnalytics(): Promise<{
    topConnectedFaculty: any[];
    topResearchTopics: any[];
    crossDepartmentCollaborationsCount: number;
    emergingTopicCount: number;
  }> {
    const topFaculty = await prisma.faculty.findMany({
      orderBy: { publicationCount: "desc" },
      take: 5,
      include: { user: true, department: true },
    });

    const topTopics = await prisma.researchTopic.findMany({
      orderBy: { researchCount: "desc" },
      take: 5,
    });

    const crossDeptCollabs = await prisma.collaborationRecommendation.count({
      where: { compatibilityScore: { gte: 70 } },
    });

    return {
      topConnectedFaculty: topFaculty.map((f) => ({
        id: f.id,
        name: f.user.name,
        department: f.department.name,
        publications: f.publicationCount,
        citations: f.totalCitations,
      })),
      topResearchTopics: topTopics.map((t) => ({
        name: t.name,
        paperCount: t.researchCount,
      })),
      crossDepartmentCollaborationsCount: crossDeptCollabs,
      emergingTopicCount: topTopics.length,
    };
  }
}
