import { prisma } from "../config/db.js";
import type { Role } from "@prisma/client";
import { parseAuthorRoles, formatAuthorsSummaryString } from "../utils/authorFormatter.js";

export interface ReportFilterPayload {
  reportType: string;
  departmentId?: string;
  facultyId?: string;
  yearStart?: number;
  yearEnd?: number;
  researchArea?: string;
  status?: string;
  journalOrConference?: "JOURNAL" | "CONFERENCE" | "ALL";
  citationMin?: number;
  search?: string;
  columns?: string[];
  grouping?: "department" | "year" | "status" | "researchArea" | "none";
  sorting?: "year_desc" | "year_asc" | "citations_desc" | "citations_asc" | "title_asc";
  page?: number;
  limit?: number;
}

export interface UserContext {
  id: string;
  role: Role;
}

export class ReportService {
  // 1. Available Report Templates
  static getTemplates() {
    return [
      {
        id: "INSTITUTIONAL",
        title: "Comprehensive Institutional Research Report",
        category: "Institutional",
        description: "Full institutional research portfolio across all departments, faculty, and research areas.",
        defaultColumns: ["title", "authors", "department", "journal", "publicationYear", "citationCount", "status", "doi"],
      },
      {
        id: "FACULTY_PUBLICATION",
        title: "Faculty Publication Performance Report",
        category: "Faculty",
        description: "Individual and aggregated publication metrics per faculty member including citation impact.",
        defaultColumns: ["facultyName", "employeeId", "department", "title", "journal", "publicationYear", "citationCount"],
      },
      {
        id: "DEPARTMENT_RESEARCH",
        title: "Department-Wise Research Performance Report",
        category: "Department",
        description: "Comparative department research outputs, citations, and publication density.",
        defaultColumns: ["department", "title", "authors", "journal", "publicationYear", "citationCount"],
      },
      {
        id: "NAAC_CRITERION_3",
        title: "NAAC Research Data Template (Criterion 3.4)",
        category: "Accreditation",
        description: "Configurable NAAC Criterion 3 data template mapping research papers per teacher and indexing details.",
        defaultColumns: ["title", "authors", "department", "journal", "issnDoi", "publicationYear", "citationCount"],
      },
      {
        id: "NIRF_RESEARCH",
        title: "NIRF Research Performance Template",
        category: "Ranking",
        description: "Configurable NIRF Research Performance (PUB & CIT) metrics template.",
        defaultColumns: ["title", "authors", "department", "journal", "publicationYear", "citationCount", "doi"],
      },
      {
        id: "STUDENT_RESEARCH",
        title: "Student Research & Guide Mentorship Report",
        category: "Student",
        description: "Track student-authored research submissions and faculty guide mentorship records.",
        defaultColumns: ["title", "studentName", "guideName", "department", "publicationYear", "status"],
      },
      {
        id: "PUBLICATION_CITATION",
        title: "High-Impact Publication & Citation Report",
        category: "Citations",
        description: "Focuses on top cited publications, h-index contributions, and highly cited manuscripts.",
        defaultColumns: ["title", "authors", "department", "journal", "publicationYear", "citationCount", "doi"],
      },
      {
        id: "JOURNAL_VS_CONFERENCE",
        title: "Journal vs Conference Publishing Report",
        category: "Venue",
        description: "Breakdown of peer-reviewed journal articles vs conference proceedings.",
        defaultColumns: ["title", "venueType", "journal", "conference", "authors", "publicationYear", "citationCount"],
      },
      {
        id: "YEAR_WISE",
        title: "Year-Wise Research Trend Report",
        category: "Timeline",
        description: "Multi-year annual research volume, growth rate, and citation accumulation trends.",
        defaultColumns: ["publicationYear", "title", "department", "journal", "citationCount", "status"],
      },
      {
        id: "SCHOLAR_RESEARCHER",
        title: "Google Scholar Verified Profile Report",
        category: "Profiles",
        description: "Audit report of faculty Google Scholar sync status, citations, h-index, and i10-index.",
        defaultColumns: ["facultyName", "employeeId", "department", "scholarUrl", "totalCitations", "hIndex", "i10Index", "lastSyncTime"],
      },
    ];
  }

  // 2. Report Data Generator Engine with Role Authorization & Server-Side Queries
  static async generateReportData(payload: ReportFilterPayload, user: UserContext) {
    const {
      departmentId,
      facultyId,
      yearStart,
      yearEnd,
      researchArea,
      status,
      journalOrConference,
      citationMin,
      search,
      grouping = "none",
      sorting = "year_desc",
      page = 1,
      limit = 100,
    } = payload;

    // Authorization & Scope Filtering
    const where: any = {};

    if (user.role === "STUDENT") {
      // Students can only view their own research submissions
      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) {
        throw new Error("Student profile not found");
      }
      where.OR = [
        { createdById: user.id },
        { authors: { some: { studentId: student.id } } },
      ];
    } else if (user.role === "FACULTY") {
      // Faculty scope: If department specified, check access or filter by own department / own creations
      const faculty = await prisma.faculty.findUnique({ where: { userId: user.id } });
      if (!faculty) {
        throw new Error("Faculty profile not found");
      }
      if (departmentId && departmentId !== faculty.departmentId) {
        // Faculty querying another department: enforce scoping to public published or own department
        where.departmentId = departmentId;
        where.status = "PUBLISHED";
      } else if (departmentId) {
        where.departmentId = departmentId;
      }
      if (facultyId) {
        const targetFac = await prisma.faculty.findUnique({ where: { id: facultyId } });
        if (targetFac) {
          where.OR = [
            { authors: { some: { facultyId } } },
            { createdById: targetFac.userId },
          ];
        } else {
          where.authors = { some: { facultyId } };
        }
      }
    } else if (user.role === "ADMIN" || user.role === "RESEARCH_CELL") {
      // Admin and Research Cell have full access
      if (departmentId) where.departmentId = departmentId;
      if (facultyId) {
        const targetFac = await prisma.faculty.findUnique({ where: { id: facultyId } });
        if (targetFac) {
          where.OR = [
            { authors: { some: { facultyId } } },
            { createdById: targetFac.userId },
          ];
        } else {
          where.authors = { some: { facultyId } };
        }
      }
    }

    // Additional Filters
    if (yearStart || yearEnd) {
      where.publicationYear = {};
      if (yearStart) where.publicationYear.gte = Number(yearStart);
      if (yearEnd) where.publicationYear.lte = Number(yearEnd);
    }

    if (researchArea) {
      where.researchArea = { contains: researchArea, mode: "insensitive" };
    }

    if (status) {
      where.status = status;
    }

    if (journalOrConference === "JOURNAL") {
      where.journal = { not: null };
    } else if (journalOrConference === "CONFERENCE") {
      where.conference = { not: null };
    }

    if (citationMin && citationMin > 0) {
      where.citationCount = { gte: Number(citationMin) };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { abstract: { contains: search, mode: "insensitive" } },
        { doi: { contains: search, mode: "insensitive" } },
        { journal: { contains: search, mode: "insensitive" } },
      ];
    }

    // Sorting
    let orderBy: any = [{ publicationYear: "desc" }, { citationCount: "desc" }];
    if (sorting === "year_asc") orderBy = [{ publicationYear: "asc" }, { citationCount: "desc" }];
    if (sorting === "citations_desc") orderBy = [{ citationCount: "desc" }, { publicationYear: "desc" }];
    if (sorting === "citations_asc") orderBy = [{ citationCount: "asc" }, { publicationYear: "desc" }];
    if (sorting === "title_asc") orderBy = [{ title: "asc" }];

    // Fetch Database Records
    const total = await prisma.research.count({ where });

    const skip = (page - 1) * limit;
    const items = await prisma.research.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        department: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        authors: {
          include: {
            faculty: { select: { id: true, employeeId: true, user: { select: { name: true } } } },
            student: { select: { id: true, rollNumber: true, user: { select: { name: true } } } },
          },
          orderBy: { authorOrder: "asc" },
        },
      },
    });

    // Compute Summary Statistics
    const allCitations = items.reduce((acc, curr) => acc + (curr.citationCount || 0), 0);
    const publishedCount = items.filter((i) => i.status === "PUBLISHED").length;
    const avgCitations = items.length > 0 ? (allCitations / items.length).toFixed(2) : "0";

    // Grouping Aggregation if requested
    let groupSummaries: any[] = [];
    if (grouping === "department") {
      const deptMap = new Map<string, { name: string; count: number; citations: number }>();
      items.forEach((item) => {
        const dName = item.department?.name || "General Department";
        const curr = deptMap.get(dName) || { name: dName, count: 0, citations: 0 };
        curr.count += 1;
        curr.citations += item.citationCount || 0;
        deptMap.set(dName, curr);
      });
      groupSummaries = Array.from(deptMap.values());
    } else if (grouping === "year") {
      const yearMap = new Map<number, { year: number; count: number; citations: number }>();
      items.forEach((item) => {
        const y = item.publicationYear;
        const curr = yearMap.get(y) || { year: y, count: 0, citations: 0 };
        curr.count += 1;
        curr.citations += item.citationCount || 0;
        yearMap.set(y, curr);
      });
      groupSummaries = Array.from(yearMap.values()).sort((a, b) => b.year - a.year);
    }

    // Format Records for Table Display & Exporter Engine
    const records = items.map((item, index) => {
      const formattedRoles = parseAuthorRoles(item.authors);
      const authorsStr = formatAuthorsSummaryString(item.authors);
      const primaryAuthorStr = item.authors.find((a) => a.authorOrder === 1)?.authorName || item.authors[0]?.authorName || item.createdBy.name;
      const coAuthorsList = item.authors.filter((a) => a.authorOrder !== 1);
      const coAuthorsStr = coAuthorsList.length > 0 ? coAuthorsList.map(a => a.authorName).join(", ") : "N/A (Single Author)";

      const primaryFaculty = item.authors.find((a) => a.faculty)?.faculty;
      const primaryStudent = item.authors.find((a) => a.student)?.student;

      // Rendered HTML badges for PDF Report Table
      const authorsHtml = formattedRoles.length > 0
        ? formattedRoles.map((r: any) => {
            if (r.isMainAuthor && r.isCorresponding) {
              return `<span style="display:inline-block; margin-bottom:2px;"><strong>${r.authorName}</strong> <span style="background:#dbeafe; color:#1e40af; padding:1px 4px; border-radius:3px; font-size:9px; font-weight:bold;">⭐✉️ Main & Corresponding</span></span>`;
            }
            if (r.isMainAuthor) {
              return `<span style="display:inline-block; margin-bottom:2px;"><strong>${r.authorName}</strong> <span style="background:#fef3c7; color:#92400e; padding:1px 4px; border-radius:3px; font-size:9px; font-weight:bold;">⭐ Main Author</span></span>`;
            }
            if (r.isCorresponding) {
              return `<span style="display:inline-block; margin-bottom:2px;">${r.authorName} <span style="background:#e0e7ff; color:#3730a3; padding:1px 4px; border-radius:3px; font-size:9px; font-weight:bold;">✉️ Corresponding</span></span>`;
            }
            return `<span style="display:inline-block; margin-bottom:2px; color:#475569;">${r.authorName} <span style="background:#f1f5f9; color:#64748b; padding:1px 4px; border-radius:3px; font-size:9px;">Co-Author</span></span>`;
          }).join("<br/>")
        : item.createdBy.name;

      return {
        slNo: skip + index + 1,
        id: item.id,
        title: item.title,
        authors: authorsStr,
        authorsHtml,
        primaryAuthor: primaryAuthorStr,
        coAuthors: coAuthorsStr,
        facultyName: primaryFaculty ? primaryFaculty.user.name : (item.createdBy.name || "N/A"),
        employeeId: primaryFaculty ? primaryFaculty.employeeId : "N/A",
        studentName: primaryStudent ? primaryStudent.user.name : "N/A",
        rollNumber: primaryStudent ? primaryStudent.rollNumber : "N/A",
        department: item.department?.name || "General Department",
        departmentCode: item.department?.code || "GEN",
        journal: item.journal || item.conference || "Peer-Reviewed Manuscript",
        conference: item.conference || "N/A",
        venueType: item.journal ? "Journal" : item.conference ? "Conference" : "Journal Article",
        publicationYear: item.publicationYear,
        doi: item.doi || "N/A",
        issnDoi: item.doi ? `DOI: ${item.doi}` : "ISSN / DOI Pending",
        citationCount: item.citationCount || 0,
        researchArea: item.researchArea || "Computer Science",
        status: item.status,
        createdAt: item.createdAt.toISOString().split("T")[0],
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalPublications: total,
        totalCitations: allCitations,
        avgCitations,
        publishedCount,
      },
      grouping,
      groupSummaries,
      records,
      appliedFilters: {
        departmentId: departmentId || "All Departments",
        facultyId: facultyId || "All Faculty",
        yearRange: yearStart && yearEnd ? `${yearStart} - ${yearEnd}` : "All Years",
        status: status || "All Statuses",
        search: search || "None",
      },
    };
  }

  // 3. Export Real CSV / Excel Spreadsheet Stream Buffer
  static generateCsvBuffer(reportData: any, columns: string[] = [], reportTitle: string = "Research Report") {
    const ALL_COLUMN_MAP: Record<string, string> = {
      slNo: "Sl. No.",
      title: "Paper Title",
      authors: "All Authors",
      primaryAuthor: "Primary Author",
      coAuthors: "Co-Author(s)",
      facultyName: "Faculty Name",
      employeeId: "Employee ID",
      studentName: "Student Name",
      rollNumber: "Roll Number",
      department: "Department",
      departmentCode: "Dept Code",
      journal: "Journal / Conference",
      conference: "Conference",
      venueType: "Venue Type",
      publicationYear: "Publication Year",
      doi: "DOI Handle",
      issnDoi: "ISSN / DOI",
      citationCount: "Citation Count",
      researchArea: "Research Area",
      status: "Publication Status",
      createdAt: "Created Date",
    };

    const activeCols = columns.length > 0
      ? columns.map((key) => ({ key, label: ALL_COLUMN_MAP[key] || key }))
      : [
          { key: "slNo", label: "Sl. No." },
          { key: "title", label: "Paper Title" },
          { key: "authors", label: "Author(s)" },
          { key: "department", label: "Department" },
          { key: "journal", label: "Journal / Conference" },
          { key: "publicationYear", label: "Year" },
          { key: "citationCount", label: "Citations" },
          { key: "doi", label: "DOI" },
          { key: "status", label: "Status" },
        ];

    let csvContent = "";
    // Institution Header
    csvContent += `"KRIYA AI-POWERED RESEARCH INTELLIGENCE PLATFORM"\n`;
    csvContent += `"${reportTitle.toUpperCase()}"\n`;
    csvContent += `"Generated On: ${new Date().toLocaleString()}"\n`;
    csvContent += `"Total Records: ${reportData.total} | Total Citations: ${reportData.summary.totalCitations}"\n\n`;

    // Table Column Headers
    csvContent += activeCols.map((c) => `"${c.label}"`).join(",") + "\n";

    // Data Rows
    reportData.records.forEach((row: any) => {
      const line = activeCols.map((c) => {
        const val = row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : "";
        return `"${val.replace(/"/g, '""')}"`;
      }).join(",");
      csvContent += line + "\n";
    });

    return Buffer.from(csvContent, "utf-8");
  }

  // 4. Export Printable PDF / HTML Report Layout
  static generateHtmlPdfReport(reportData: any, columns: string[] = [], reportTitle: string = "Institutional Research Report") {
    const ALL_COLUMN_MAP: Record<string, string> = {
      slNo: "Sl.",
      title: "Title of Paper",
      authors: "All Authors",
      primaryAuthor: "Primary Author",
      coAuthors: "Co-Author(s)",
      facultyName: "Faculty Name",
      employeeId: "Emp. ID",
      studentName: "Student Name",
      rollNumber: "Roll No.",
      department: "Department",
      departmentCode: "Dept Code",
      journal: "Journal / Conference",
      conference: "Conference",
      venueType: "Venue Type",
      publicationYear: "Year",
      doi: "DOI Handle",
      issnDoi: "ISSN / DOI",
      citationCount: "Citations",
      researchArea: "Research Area",
      status: "Status",
      createdAt: "Created Date",
    };

    const activeCols = columns.length > 0
      ? columns.map((key) => ({ key, label: ALL_COLUMN_MAP[key] || key }))
      : [
          { key: "slNo", label: "Sl." },
          { key: "title", label: "Title of Paper" },
          { key: "authors", label: "Author(s)" },
          { key: "department", label: "Department" },
          { key: "journal", label: "Journal / Conference" },
          { key: "publicationYear", label: "Year" },
          { key: "citationCount", label: "Citations" },
          { key: "status", label: "Status" },
        ];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${reportTitle} - KRIYA Report</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1e293b; background: #ffffff; }
    .header { text-align: center; border-bottom: 3px double #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 22px; color: #1e3a8a; text-transform: uppercase; letter-spacing: 1px; }
    .header h2 { margin: 5px 0 0 0; font-size: 16px; color: #3b82f6; font-weight: 600; }
    .meta-bar { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; margin-bottom: 20px; background: #f8fafc; padding: 10px 15px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .card { background: #f1f5f9; padding: 12px; border-radius: 6px; text-align: center; border: 1px solid #cbd5e1; }
    .card .val { font-size: 18px; font-weight: bold; color: #1e293b; }
    .card .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th { background: #1e3a8a; color: #ffffff; text-align: left; padding: 8px 10px; font-weight: 600; border: 1px solid #1e3a8a; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; vertical-align: top; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; background: #dbeafe; color: #1e40af; }
    .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print {
      body { margin: 10px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: right; margin-bottom: 15px;">
    <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
      🖨️ Print / Download PDF
    </button>
  </div>

  <div class="header">
    <h1>KRIYA Research Intelligence Platform</h1>
    <h2>${reportTitle}</h2>
  </div>

  <div class="meta-bar">
    <div><strong>Generated On:</strong> ${new Date().toLocaleString()}</div>
    <div><strong>Scope:</strong> ${reportData.appliedFilters.departmentId}</div>
    <div><strong>Status Filter:</strong> ${reportData.appliedFilters.status}</div>
    <div><strong>Audit Code:</strong> KRIYA-RPT-${Math.floor(100000 + Math.random() * 900000)}</div>
  </div>

  <div class="summary-grid">
    <div class="card">
      <div class="val">${reportData.total}</div>
      <div class="lbl">Total Manuscripts</div>
    </div>
    <div class="card">
      <div class="val" style="color: #2563eb;">${reportData.summary.totalCitations}</div>
      <div class="lbl">Total Citations</div>
    </div>
    <div class="card">
      <div class="val">${reportData.summary.avgCitations}</div>
      <div class="lbl">Avg Citations / Paper</div>
    </div>
    <div class="card">
      <div class="val" style="color: #16a34a;">${reportData.summary.publishedCount}</div>
      <div class="lbl">Peer-Reviewed Published</div>
    </div>
  </div>

  <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:8px 12px; border-radius:6px; margin-bottom:12px; font-size:10px; color:#475569; display:flex; gap:15px; align-items:center;">
    <strong>Author Designation Legend:</strong>
    <span><span style="background:#fef3c7; color:#92400e; padding:1px 5px; border-radius:3px; font-weight:bold;">⭐ Main Author</span> = Primary / 1st Author (Lead Researcher)</span>
    <span><span style="background:#e0e7ff; color:#3730a3; padding:1px 5px; border-radius:3px; font-weight:bold;">✉️ Corresponding</span> = Communicating Author</span>
    <span><span style="background:#f1f5f9; color:#64748b; padding:1px 5px; border-radius:3px;">Co-Author</span> = Contributing Researcher</span>
  </div>

  <table>
    <thead>
      <tr>
        ${activeCols.map((c) => `<th>${c.label}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${reportData.records
        .map(
          (row: any) => `
        <tr>
          ${activeCols
            .map((c) => {
              if (c.key === "status") {
                return `<td><span class="badge">${row.status}</span></td>`;
              }
              if (c.key === "authors") {
                return `<td>${row.authorsHtml || row.authors || "—"}</td>`;
              }
              return `<td>${row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : "—"}</td>`;
            })
            .join("")}
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <div>Verified Institutional Research Intelligence Audit Trail</div>
    <div>Confidential & Proprietary — KRIYA Platform</div>
  </div>
</body>
</html>
    `;
  }

  // 5. Saved Reports Management
  static async saveReportConfig(userId: string, payload: any) {
    return await prisma.savedReport.create({
      data: {
        userId,
        name: payload.name || "Untitled Research Report",
        description: payload.description || "",
        reportType: payload.reportType || "INSTITUTIONAL",
        filters: JSON.stringify(payload.filters || {}),
        columns: payload.columns || [],
        grouping: payload.grouping || "none",
        sorting: payload.sorting || "year_desc",
      },
    });
  }

  static async getSavedReports(userId: string) {
    return await prisma.savedReport.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  // 6. Report Audit History
  static async logReportHistory(userId: string, payload: { reportType: string; title: string; filters: any; format: string; recordCount: number }) {
    return await prisma.reportHistory.create({
      data: {
        userId,
        reportType: payload.reportType,
        title: payload.title,
        filters: JSON.stringify(payload.filters || {}),
        format: payload.format,
        recordCount: payload.recordCount,
      },
    });
  }

  static async getReportHistory(userId: string, role: Role) {
    if (role === "ADMIN" || role === "RESEARCH_CELL") {
      return await prisma.reportHistory.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      });
    }
    return await prisma.reportHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
