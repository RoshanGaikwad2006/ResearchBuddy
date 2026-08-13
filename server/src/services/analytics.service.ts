import { prisma } from "../config/db.js";

export class AnalyticsService {
  static async getOverviewAnalytics() {
    const [
      publicationTrend,
      departmentStats,
      typeDistribution,
      topResearchAreas,
      facultyLeaderboard,
    ] = await Promise.all([
      // 1. Publication Trend over Years
      prisma.research.groupBy({
        by: ["publicationYear"],
        _count: { id: true },
        _sum: { citationCount: true },
        orderBy: { publicationYear: "asc" },
      }),

      // 2. Department-wise Publications
      prisma.department.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          _count: {
            select: {
              researches: true,
              faculties: true,
              students: true,
            },
          },
        },
      }),

      // 3. Journal vs Conference Breakdown
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN journal IS NOT NULL AND journal != '' THEN 'Journal'
            WHEN conference IS NOT NULL AND conference != '' THEN 'Conference'
            ELSE 'Other'
          END as venue_type,
          COUNT(*)::int as count
        FROM researches
        GROUP BY venue_type
      `,

      // 4. Top Research Areas Breakdown
      prisma.research.groupBy({
        by: ["researchArea"],
        _count: { id: true },
        _sum: { citationCount: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),

      // 5. Faculty Leaderboard
      prisma.faculty.findMany({
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          department: { select: { code: true } },
          _count: {
            select: { researchAuthorships: true },
          },
        },
        orderBy: {
          researchAuthorships: { _count: "desc" },
        },
      }),
    ]);

    return {
      publicationTrend: publicationTrend.map((pt) => ({
        year: pt.publicationYear,
        publications: pt._count.id,
        citations: pt._sum.citationCount || 0,
      })),
      departmentStats: departmentStats.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        publicationsCount: d._count.researches,
        facultyCount: d._count.faculties,
        studentCount: d._count.students,
      })),
      typeDistribution,
      topResearchAreas: topResearchAreas.map((ra) => ({
        area: ra.researchArea,
        count: ra._count.id,
        totalCitations: ra._sum.citationCount || 0,
      })),
      facultyLeaderboard: facultyLeaderboard.map((f) => ({
        id: f.id,
        name: f.user.name,
        email: f.user.email,
        departmentCode: f.department.code,
        designation: f.designation,
        totalPublications: f._count.researchAuthorships,
      })),
    };
  }
}
