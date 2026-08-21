import { prisma } from "../config/db.js";
import type { ResearchStatus } from "@prisma/client";
import type { CreateResearchDTO, UpdateResearchDTO } from "../validation/research.validation.js";
import { ScholarNormalizationService } from "../integrations/googleScholar/scholarNormalization.service.js";

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

    if (params.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: params.search, mode: "insensitive" } },
            { abstract: { contains: params.search, mode: "insensitive" } },
            { researchArea: { contains: params.search, mode: "insensitive" } },
            { journal: { contains: params.search, mode: "insensitive" } },
            { conference: { contains: params.search, mode: "insensitive" } },
            { doi: { contains: params.search, mode: "insensitive" } },
          ],
        },
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
}
