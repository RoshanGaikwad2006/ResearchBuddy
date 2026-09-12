import { prisma } from "../config/db.js";

export class DashboardService {
  static async getDashboardStats(user: { id: string; role: string }) {
    const { id: userId, role } = user;

    let researchFilter: any = {};

    let facultyRecord: any = null;

    if (role === "FACULTY") {
      facultyRecord = await prisma.faculty.findUnique({
        where: { userId },
        include: { user: true },
      });
      if (facultyRecord) {
        const nameTokens = (facultyRecord.user?.name || "").trim().split(/\s+/).filter((t: string) => t.length >= 3);
        researchFilter = {
          OR: [
            { createdById: userId },
            { authors: { some: { facultyId: facultyRecord.id } } },
            ...(nameTokens.length > 0
              ? [
                  {
                    authors: {
                      some: {
                        OR: nameTokens.map((t: string) => ({
                          authorName: { contains: t, mode: "insensitive" as const },
                        })),
                      },
                    },
                  },
                ]
              : []),
          ],
        };
      } else {
        researchFilter = { createdById: userId };
      }
    } else if (role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (student) {
        researchFilter = {
          OR: [
            { createdById: userId },
            { authors: { some: { studentId: student.id } } },
          ],
        };
      } else {
        researchFilter = { createdById: userId };
      }
    }
    // For ADMIN and RESEARCH_CELL, researchFilter is empty (aggregates all institutional data)

    const [
      totalPublications,
      pendingCount,
      approvedCount,
      rejectedCount,
      departmentCount,
      citationsSum,
      recentActivity,
    ] = await Promise.all([
      prisma.research.count({ where: researchFilter }),
      prisma.research.count({
        where: {
          ...researchFilter,
          status: { in: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_REVISION"] },
        },
      }),
      prisma.research.count({
        where: {
          ...researchFilter,
          status: { in: ["PUBLISHED", "ACCEPTED"] },
        },
      }),
      prisma.research.count({
        where: {
          ...researchFilter,
          status: "REJECTED",
        },
      }),
      prisma.department.count(),
      prisma.research.aggregate({
        where: researchFilter,
        _sum: { citationCount: true },
      }),
      prisma.research.findMany({
        where: researchFilter,
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true, role: true } },
          department: { select: { code: true, name: true } },
        },
      }),
    ]);

    let finalTotalPubs = totalPublications;
    let finalApproved = approvedCount;
    let finalTotalCitations = citationsSum?._sum?.citationCount ?? 0;

    if (role === "FACULTY" && facultyRecord) {
      finalTotalPubs = Math.max(totalPublications, facultyRecord.publicationCount || 0);
      finalTotalCitations = Math.max(finalTotalCitations, facultyRecord.totalCitations || 0);
      if (pendingCount === 0 && rejectedCount === 0) {
        finalApproved = Math.max(approvedCount, finalTotalPubs);
      }
    } else if (role === "ADMIN" || role === "RESEARCH_CELL") {
      const allFacultyAgg = await prisma.faculty.aggregate({
        _sum: { publicationCount: true, totalCitations: true },
      });
      finalTotalPubs = Math.max(totalPublications, allFacultyAgg._sum.publicationCount || 0);
      finalTotalCitations = Math.max(finalTotalCitations, allFacultyAgg._sum.totalCitations || 0);
    }

    return {
      role,
      summary: {
        totalPublications: finalTotalPubs,
        pendingCount,
        approvedCount: finalApproved,
        rejectedCount,
        departmentCount,
        totalCitations: finalTotalCitations,
      },
      recentSubmissions: recentActivity || [],
    };
  }
}


