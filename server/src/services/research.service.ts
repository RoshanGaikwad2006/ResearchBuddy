import { prisma } from "../config/db.js";
import type { ResearchStatus } from "@prisma/client";
import type { CreateResearchDTO, UpdateResearchDTO } from "../validation/research.validation.js";
import { ScholarNormalizationService } from "../integrations/googleScholar/scholarNormalization.service.js";
import { buildPrismaMonthFilter, normalizePublicationDate, parseYearAndMonth } from "../utils/dateFormatter.js";

export class ResearchService {
  static async create(data: CreateResearchDTO, createdById: string) {
    const normalizedDoi = data.doi ? ScholarNormalizationService.normalizeDoi(data.doi) : null;

    if (normalizedDoi) {
      const existingDoi = await prisma.research.findUnique({
        where: { doi: normalizedDoi },
      });
      if (existingDoi) {
        throw new Error(`Research with DOI '${normalizedDoi}' already exists`);
      }
    }

    return prisma.research.create({
      data: {
        title: data.title,
        abstract: data.abstract,
        keywords: data.keywords,
        researchArea: data.researchArea,
        doi: normalizedDoi,
        journal: data.journal || null,
        conference: data.conference || null,
        venueType: data.venueType || (data.patentNumber ? "PATENT" : data.isbn ? "BOOK" : data.conference ? "CONFERENCE" : "JOURNAL"),
        patentNumber: data.patentNumber || null,
        isbn: data.isbn || null,
        publicationYear: data.publicationYear,
        pdfUrl: data.pdfUrl || null,
        departmentId: data.departmentId || null,
        createdById: createdById,
        status: "SUBMITTED", // Default to SUBMITTED upon creation
        authors: {
          create: data.authors.map((a) => ({
            facultyId: a.facultyId || null,
            studentId: a.studentId || null,
            authorName: a.authorName,
            authorOrder: a.authorOrder,
            isCorresponding: a.isCorresponding,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        department: true,
        authors: {
          include: {
            faculty: { include: { user: { select: { name: true, email: true } } } },
            student: { include: { user: { select: { name: true, email: true } } } },
          },
          orderBy: { authorOrder: "asc" },
        },
        approvals: true,
      },
    });
  }

  static async update(id: string, data: UpdateResearchDTO) {
    const research = await prisma.research.findUnique({ where: { id } });
    if (!research) {
      throw new Error("Research record not found");
    }

    const { authors, ...researchData } = data;

    return prisma.$transaction(async (tx) => {
      if (authors) {
        await tx.researchAuthor.deleteMany({ where: { researchId: id } });
        await tx.researchAuthor.createMany({
          data: authors.map((a) => ({
            researchId: id,
            facultyId: a.facultyId || null,
            studentId: a.studentId || null,
            authorName: a.authorName,
            authorOrder: a.authorOrder,
            isCorresponding: a.isCorresponding,
          })),
        });
      }

      return tx.research.update({
        where: { id },
        data: {
          ...researchData,
          pdfUrl: researchData.pdfUrl === "" ? null : researchData.pdfUrl,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
          department: true,
          authors: {
            include: {
              faculty: { include: { user: { select: { name: true, email: true } } } },
              student: { include: { user: { select: { name: true, email: true } } } },
            },
            orderBy: { authorOrder: "asc" },
          },
          approvals: true,
        },
      });
    });
  }

  static async delete(id: string) {
    const research = await prisma.research.findUnique({ where: { id } });
    if (!research) {
      throw new Error("Research record not found");
    }
    return prisma.research.delete({ where: { id } });
  }

  static async getById(id: string) {
    const research = await prisma.research.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        department: true,
        authors: {
          include: {
            faculty: { include: { user: { select: { name: true, email: true } } } },
            student: { include: { user: { select: { name: true, email: true } } } },
          },
          orderBy: { authorOrder: "asc" },
        },
        approvals: {
          include: {
            reviewer: { select: { name: true, email: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!research) {
      throw new Error("Research record not found");
    }

    return research;
  }

  static async list(params: {
    search?: string;
    status?: ResearchStatus;
    departmentId?: string;
    publicationYear?: number;
    month?: number | string;
    createdById?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.departmentId) {
      where.departmentId = params.departmentId;
    }

    if (params.publicationYear) {
      where.publicationYear = params.publicationYear;
    }

    if (params.month) {
      const m = Number(params.month);
      if (!isNaN(m) && m >= 1 && m <= 12) {
        const mFilter = buildPrismaMonthFilter(m, params.publicationYear);
        where.AND = where.AND ? [...where.AND, mFilter] : [mFilter];
      }
    }

    if (params.createdById) {
      where.createdById = params.createdById;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { abstract: { contains: params.search, mode: "insensitive" } },
        { researchArea: { contains: params.search, mode: "insensitive" } },
        { journal: { contains: params.search, mode: "insensitive" } },
        { conference: { contains: params.search, mode: "insensitive" } },
        { doi: { contains: params.search, mode: "insensitive" } },
        { keywords: { hasSome: [params.search] } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.research.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ citationCount: "desc" }, { createdAt: "desc" }],
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          department: true,
          authors: {
            orderBy: { authorOrder: "asc" },
          },
        },
      }),
      prisma.research.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async listMyResearches(
    userId: string,
    params: {
      search?: string;
      status?: ResearchStatus;
      publicationYear?: number;
      month?: number | string;
      page?: number;
      limit?: number;
    }
  ) {
    const [faculty, student] = await Promise.all([
      prisma.faculty.findUnique({ where: { userId } }),
      prisma.student.findUnique({ where: { userId } }),
    ]);

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const userFilters: any[] = [{ createdById: userId }];
    if (faculty) {
      const userObj = await prisma.user.findUnique({ where: { id: userId } });
      const lastName = userObj?.name.split(" ").pop();
      userFilters.push({ authors: { some: { facultyId: faculty.id } } });
      if (lastName && lastName.length >= 3) {
        userFilters.push({ authors: { some: { authorName: { contains: lastName, mode: "insensitive" } } } });
      }
    }
    if (student) {
      userFilters.push({ authors: { some: { studentId: student.id } } });
    }

    const where: any = {
      OR: userFilters,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.publicationYear) {
      where.publicationYear = params.publicationYear;
    }

    if (params.month) {
      const m = Number(params.month);
      if (!isNaN(m) && m >= 1 && m <= 12) {
        const mFilter = buildPrismaMonthFilter(m, params.publicationYear);
        where.AND = where.AND ? [...where.AND, mFilter] : [mFilter];
      }
    }

    if (params.search) {
      const searchFilter = {
        OR: [
          { title: { contains: params.search, mode: "insensitive" } },
          { abstract: { contains: params.search, mode: "insensitive" } },
          { researchArea: { contains: params.search, mode: "insensitive" } },
          { journal: { contains: params.search, mode: "insensitive" } },
          { conference: { contains: params.search, mode: "insensitive" } },
          { doi: { contains: params.search, mode: "insensitive" } },
        ],
      };
      where.AND = where.AND ? [...where.AND, searchFilter] : [searchFilter];
    }

    const [items, total] = await Promise.all([
      prisma.research.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ citationCount: "desc" }, { createdAt: "desc" }],
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          department: true,
          authors: {
            orderBy: { authorOrder: "asc" },
          },
        },
      }),
      prisma.research.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async enrichAbstract(id: string) {
    const paper = await prisma.research.findUnique({ where: { id } });
    if (!paper) throw new Error("Research paper not found.");

    const { OpenAlexService } = await import("./openalex.service.js");
    const { CrossrefService } = await import("./crossref.service.js");
    const { FieldReconciliationService } = await import("./fieldReconciliation.service.js");
    const { resilientFetch } = await import("../utils/resilientFetch.js");

    let fetchedAbstract: string | null = null;
    let source = "OPENALEX";

    if (paper.doi) {
      const alexMeta = await OpenAlexService.fetchMetadata(paper.doi);
      if (alexMeta?.abstract && FieldReconciliationService.isValidAbstract(alexMeta.abstract, paper.title)) {
        fetchedAbstract = alexMeta.abstract;
        source = "OPENALEX";
      } else {
        const crossMeta = await CrossrefService.fetchMetadata(paper.doi);
        if (crossMeta?.abstract && FieldReconciliationService.isValidAbstract(crossMeta.abstract, paper.title)) {
          fetchedAbstract = crossMeta.abstract;
          source = "CROSSREF";
        }
      }
    }

    if (!fetchedAbstract && paper.title) {
      const searchUrl = `https://api.openalex.org/works?search=${encodeURIComponent(paper.title)}&per_page=3`;
      const resp = await resilientFetch(searchUrl, {
        headers: { "User-Agent": "KRIYA-Research-Platform/1.0 (mailto:admin@university.edu)" },
        timeoutMs: 10000,
      });
      if (resp && resp.ok) {
        const resData: any = await resp.json();
        if (resData.results && resData.results.length > 0) {
          for (const work of resData.results) {
            const rawAbstract = FieldReconciliationService.reconstructOpenAlexAbstract(work.abstract_inverted_index);
            if (rawAbstract && FieldReconciliationService.isValidAbstract(rawAbstract, paper.title)) {
              fetchedAbstract = rawAbstract;
              source = "OPENALEX";
              break;
            }
          }
        }
      }
    }

    if (!fetchedAbstract) {
      throw new Error("Could not resolve full text abstract from Open Science registries.");
    }

    return prisma.research.update({
      where: { id },
      data: { abstract: fetchedAbstract, abstractSource: source },
    });
  }

  static async refreshCitationsViaOpenRouter(id: string) {
    const paper = await prisma.research.findUnique({
      where: { id },
      include: { authors: true },
    });
    if (!paper) throw new Error("Research paper not found.");

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OpenRouter API key not configured.");

    const authorNames = paper.authors.map((a) => a.authorName).join(", ");
    const prompt = `Act as an authoritative academic citation and bibliometrics engine.
Analyze and retrieve the current verified citation count for this published research:
Title: "${paper.title}"
Authors: "${authorNames}"
Publication Year: ${paper.publicationYear}
DOI: "${paper.doi || "N/A"}"
Journal/Venue: "${paper.journal || paper.conference || "Scholarly Publication"}"

Return STRICT JSON only:
{
  "citationCount": 15
}`;

    const modelName = process.env.OPENROUTER_MODEL || "openrouter/auto";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kriya.institution.edu",
        "X-Title": "KRIYA AI Research Platform",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API citation query failed with status ${response.status}`);
    }

    const resJson: any = await response.json();
    const content = resJson.choices?.[0]?.message?.content || "";
    const cleanJson = content.replace(/```json|```/g, "").trim();
    let count = paper.citationCount;
    try {
      const parsed = JSON.parse(cleanJson);
      if (Number.isFinite(Number(parsed.citationCount)) && Number(parsed.citationCount) >= 0) {
        count = Number(parsed.citationCount);
      }
    } catch {
      // Keep existing count if parse fails
    }

    return prisma.research.update({
      where: { id },
      data: { citationCount: count },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        department: true,
        authors: {
          include: {
            faculty: { include: { user: { select: { name: true, email: true } } } },
            student: { include: { user: { select: { name: true, email: true } } } },
          },
          orderBy: { authorOrder: "asc" },
        },
        approvals: true,
      },
    });
  }

  static async enrichPublicationDate(id: string) {
    const paper = await prisma.research.findUnique({
      where: { id },
      include: { authors: true },
    });

    if (!paper) {
      throw new Error("Research publication not found");
    }

    const { OpenAlexService } = await import("./openalex.service.js");

    let resolvedDate: string | null = null;
    let resolvedYear = paper.publicationYear;

    // 1. Try OpenAlex by DOI
    if (paper.doi) {
      try {
        const meta = await OpenAlexService.fetchMetadata(paper.doi);
        if (meta?.publicationDate) {
          resolvedDate = meta.publicationDate;
          if (meta.publicationYear) resolvedYear = meta.publicationYear;
        }
      } catch {}
    }

    // 2. Try OpenAlex by title search
    if (!resolvedDate && paper.title) {
      try {
        const meta = await OpenAlexService.searchByTitle(paper.title);
        if (meta?.publicationDate) {
          resolvedDate = meta.publicationDate;
          if (meta.publicationYear) resolvedYear = meta.publicationYear;
        }
      } catch {}
    }

    // 3. Fallback: normalize whatever date or year is present
    const normalized = normalizePublicationDate(resolvedDate, resolvedYear);

    if (normalized) {
      return prisma.research.update({
        where: { id },
        data: {
          publicationDate: normalized,
          publicationYear: resolvedYear || paper.publicationYear,
        },
      });
    }

    return paper;
  }

  static async enrichAllMissingDates(userId?: string) {
    const where: any = {
      OR: [
        { publicationDate: null },
        { publicationDate: "" },
      ],
    };

    if (userId) {
      where.createdById = userId;
    }

    const candidates = await prisma.research.findMany({
      where,
      select: { id: true, title: true, doi: true, publicationYear: true },
      take: 150,
    });

    let enrichedCount = 0;
    const { OpenAlexService } = await import("./openalex.service.js");

    for (const paper of candidates) {
      let resolvedDate: string | null = null;
      let resolvedYear = paper.publicationYear;

      if (paper.doi) {
        try {
          const meta = await OpenAlexService.fetchMetadata(paper.doi);
          if (meta?.publicationDate) {
            resolvedDate = meta.publicationDate;
            if (meta.publicationYear) resolvedYear = meta.publicationYear;
          }
        } catch {}
      }

      if (!resolvedDate && paper.title) {
        try {
          const meta = await OpenAlexService.searchByTitle(paper.title);
          if (meta?.publicationDate) {
            resolvedDate = meta.publicationDate;
            if (meta.publicationYear) resolvedYear = meta.publicationYear;
          }
        } catch {}
      }

      const normalized = normalizePublicationDate(resolvedDate, resolvedYear);
      if (normalized) {
        await prisma.research.update({
          where: { id: paper.id },
          data: {
            publicationDate: normalized,
            publicationYear: resolvedYear || paper.publicationYear,
          },
        });
        enrichedCount++;
      }
    }

    return { totalCandidates: candidates.length, enrichedCount };
  }

  static async updateDates(
    id: string,
    data: { publicationDate?: string; conferenceDate?: string; publicationYear?: number },
    userId: string,
    userRole: string
  ) {
    const paper = await prisma.research.findUnique({
      where: { id },
      include: { authors: true },
    });
    if (!paper) throw new Error("Research paper not found");

    const isOwner = paper.createdById === userId;
    const isAdmin = userRole === "ADMIN" || userRole === "RESEARCH_CELL";
    const isAuthor = paper.authors.some((a) => a.facultyId === userId || a.studentId === userId);

    if (!isOwner && !isAdmin && !isAuthor) {
      throw new Error("Unauthorized to modify dates for this research paper");
    }

    const updateData: any = {};
    if (data.publicationDate !== undefined) {
      updateData.publicationDate = normalizePublicationDate(data.publicationDate) || data.publicationDate;
      const parsed = parseYearAndMonth(updateData.publicationDate);
      if (parsed.year) updateData.publicationYear = parsed.year;
    }

    if (data.conferenceDate !== undefined) {
      updateData.conferenceDate = normalizePublicationDate(data.conferenceDate) || data.conferenceDate;
    }

    if (data.publicationYear && !updateData.publicationYear) {
      updateData.publicationYear = Number(data.publicationYear);
    }

    return prisma.research.update({
      where: { id },
      data: updateData,
      include: {
        authors: true,
        department: true,
      },
    });
  }

  static async createUnderReviewManuscript(
    userId: string,
    parsed: {
      title: string;
      authors: { authorName: string; affiliation?: string }[];
      abstract: string;
      keywords: string[];
      venueType: "JOURNAL" | "CONFERENCE" | "OTHER";
      targetVenue?: string;
      submissionDate?: string;
      conferenceDate?: string;
      documentUrl?: string;
    }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { facultyProfile: true },
    });
    if (!user) throw new Error("User not found");

    const deptId = user.facultyProfile?.departmentId;
    const year = parsed.submissionDate ? parseInt(parsed.submissionDate.slice(0, 4), 10) : new Date().getFullYear();

    return prisma.research.create({
      data: {
        title: parsed.title,
        abstract: parsed.abstract || "Manuscript under peer review.",
        keywords: parsed.keywords || ["Under Review"],
        researchArea: "Applied Sciences & Engineering",
        venueType: parsed.venueType,
        journal: parsed.venueType === "JOURNAL" ? parsed.targetVenue : undefined,
        conference: parsed.venueType === "CONFERENCE" ? parsed.targetVenue : undefined,
        publicationYear: isNaN(year) ? new Date().getFullYear() : year,
        publicationDate: parsed.submissionDate,
        conferenceDate: parsed.conferenceDate,
        pdfUrl: parsed.documentUrl,
        status: "UNDER_REVIEW",
        abstractSource: "MANUAL_KRIYA",
        titleSource: "MANUAL_KRIYA",
        venueSource: "MANUAL_KRIYA",
        createdById: user.id,
        departmentId: deptId,
        authors: {
          create: (parsed.authors.length > 0 ? parsed.authors : [{ authorName: user.name }]).map((a, idx) => ({
            authorName: a.authorName,
            authorOrder: idx + 1,
            affiliation: a.affiliation || "K. K. Wagh Institute of Engineering Education & Research",
            isCorresponding: idx === 0,
            facultyId: idx === 0 && user.facultyProfile ? user.facultyProfile.id : undefined,
          })),
        },
      },
      include: {
        authors: true,
        department: true,
      },
    });
  }
}
