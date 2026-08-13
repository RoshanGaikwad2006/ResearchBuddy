import { prisma } from "../config/db.js";

export class DashboardService {
  static async getDashboardStats(user: { id: string; role: string }) {
    const { id: userId, role } = user;

    let researchFilter: any = {};

    if (role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({ where: { userId } });
      if (faculty) {
        researchFilter = {
          OR: [
            { createdById: userId },
            { authors: { some: { facultyId: faculty.id } } },
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

    return {
      role,
      summary: {
        totalPublications,
        pendingCount,
        approvedCount,
        rejectedCount,
        departmentCount,
        totalCitations: citationsSum._sum.citationCount || 0,
      },
      recentSubmissions: recentActivity,
    };
  }
}
