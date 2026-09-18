import { prisma } from "../config/db.js";
import { GoogleScholarService, extractPublicationYear } from "../integrations/googleScholar/googleScholar.service.js";
import { extractScholarAuthorId } from "../integrations/googleScholar/googleScholar.utils.js";
import { ReportService, type ReportFilterPayload, type UserContext } from "../services/report.service.js";
import { parseAuthorRoles, formatAuthorsSummaryString } from "../utils/authorFormatter.js";
import fs from "fs";
import path from "path";

interface TestCaseResult {
  id: string;
  category: "SCHOLAR_EXTRACTION" | "DATABASE_INTEGRITY" | "REPORT_ENGINE" | "REPORT_EXPORTERS";
  name: string;
  expected: string;
  actual: string;
  status: "PASSED" | "FAILED";
  durationMs: number;
  details?: any;
}

const results: TestCaseResult[] = [];

function logTest(res: TestCaseResult) {
  results.push(res);
  const icon = res.status === "PASSED" ? "✅" : "❌";
  console.log(`${icon} [${res.id}] [${res.category}] ${res.name} (${res.durationMs}ms)`);
  if (res.status === "FAILED") {
    console.error(`   ⚠️ Expected: ${res.expected}`);
    console.error(`   ⚠️ Actual:   ${res.actual}`);
    if (res.details) console.error(`   ⚠️ Details:  ${JSON.stringify(res.details)}`);
  }
}

// -------------------------------------------------------------
// PART 1: GOOGLE SCHOLAR DATA EXTRACTION & PARSING TESTS
// -------------------------------------------------------------
async function testGoogleScholarExtraction() {
  console.log("\n=======================================================");
  console.log("🔍 PART 1: TESTING GOOGLE SCHOLAR DATA EXTRACTION & ACCURACY");
  console.log("=======================================================\n");

  // ST-01: Publication Year Extraction Unit Tests
  const yearTestCases = [
    { input: { rawYear: "2023", pub: "IEEE Trans", snip: "" }, expected: 2023, label: "Numeric string rawYear" },
    { input: { rawYear: null, pub: "Proc. of ACM, 2021", snip: "" }, expected: 2021, label: "Year extracted from publication text" },
    { input: { rawYear: undefined, pub: "", snip: "Conference held in November 2019 in Tokyo" }, expected: 2019, label: "Year extracted from snippet text" },
    { input: { rawYear: undefined, pub: "", snip: "", title: "Comparative Study of 2022 AI Algorithms" }, expected: 2022, label: "Year extracted from title" },
    { input: { rawYear: "1850", pub: "Invalid Ancient Year", snip: "" }, expected: new Date().getFullYear(), label: "Out of range year fallback to current year" },
  ];

  for (let i = 0; i < yearTestCases.length; i++) {
    const tc = yearTestCases[i];
    const start = Date.now();
    const actual = extractPublicationYear(tc.input.rawYear, tc.input.pub, tc.input.snip, tc.input.title);
    const passed = actual === tc.expected;
    logTest({
      id: `ST-01.${i + 1}`,
      category: "SCHOLAR_EXTRACTION",
      name: `Publication Year Extraction: ${tc.label}`,
      expected: String(tc.expected),
      actual: String(actual),
      status: passed ? "PASSED" : "FAILED",
      durationMs: Date.now() - start,
    });
  }

  // ST-02: Google Scholar Author ID Extraction from different URL formats
  const authorIdCases = [
    { input: "https://scholar.google.com/citations?user=Y8O6WQcAAAAJ&hl=en", expected: "Y8O6WQcAAAAJ", label: "Full URL with query params" },
    { input: "https://scholar.google.com/citations?user=d1d-0t8AAAAJ", expected: "d1d-0t8AAAAJ", label: "Standard scholar citations URL" },
    { input: "user=Y8O6WQcAAAAJ", expected: "Y8O6WQcAAAAJ", label: "Query param fragment" },
    { input: "Y8O6WQcAAAAJ", expected: "Y8O6WQcAAAAJ", label: "Direct 12-char author ID" },
  ];

  for (let i = 0; i < authorIdCases.length; i++) {
    const tc = authorIdCases[i];
    const start = Date.now();
    const actual = extractScholarAuthorId(tc.input);
    const passed = actual === tc.expected;
    logTest({
      id: `ST-02.${i + 1}`,
      category: "SCHOLAR_EXTRACTION",
      name: `Scholar Author ID Parsing: ${tc.label}`,
      expected: tc.expected,
      actual,
      status: passed ? "PASSED" : "FAILED",
      durationMs: Date.now() - start,
    });
  }

  // ST-03: Author Name & Role Decomposition
  const startAuthor = Date.now();
  const rawAuthorString = "Birla Kushal, Snehal Mohan Kamalapur, Chaitali Patil, et al";
  const names = rawAuthorString
    .split(/,|\band\b|&/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.toLowerCase() !== "..." && s.toLowerCase() !== "et al");
  
  const formattedAuthors = names.map((n, idx) => ({
    authorName: n,
    authorOrder: idx + 1,
    isCorresponding: idx === 0,
  }));
  const roles = parseAuthorRoles(formattedAuthors);
  const summaryStr = formatAuthorsSummaryString(formattedAuthors);
  
  const passedAuthor =
    roles.length === 3 &&
    roles[0].isMainAuthor === true &&
    roles[0].isCorresponding === true &&
    roles[1].isMainAuthor === false &&
    !summaryStr.includes("et al");

  logTest({
    id: "ST-03",
    category: "SCHOLAR_EXTRACTION",
    name: "Author Name Splitting, Role Formatting & Et-Al Sanitization",
    expected: "3 parsed authors, primary author marked, 'et al' cleaned",
    actual: `${roles.length} authors, primary: ${roles[0]?.authorName}, summary: "${summaryStr}"`,
    status: passedAuthor ? "PASSED" : "FAILED",
    durationMs: Date.now() - startAuthor,
  });

  // ST-04: Live Scholar / SerpAPI Fetch Verification
  const startFetch = Date.now();
  try {
    const preview = await GoogleScholarService.fetchProfilePreview("Y8O6WQcAAAAJ", {
      facultyName: "Dr. Kamalapur Snehal Mohan",
      departmentName: "Computer Engineering",
    });

    const hasName = Boolean(preview.name && preview.name.length > 0);
    const hasCitations = typeof preview.totalCitations === "number" && preview.totalCitations >= 0;
    const hasHIndex = typeof preview.hIndex === "number" && preview.hIndex >= 0;
    const hasI10Index = typeof preview.i10Index === "number" && preview.i10Index >= 0;
    const hasPubs = Array.isArray(preview.publications) && preview.publications.length > 0;
    const pubsValid = preview.publications.every(
      (p) => p.title && typeof p.year === "number" && !isNaN(p.year) && p.year >= 1970
    );

    const passed = hasName && hasCitations && hasHIndex && hasI10Index && hasPubs && pubsValid;
    logTest({
      id: "ST-04",
      category: "SCHOLAR_EXTRACTION",
      name: "Google Scholar Profile Metrics & Publication Array Schema Validation",
      expected: "Valid profile with citations, hIndex, i10Index, and valid publication years",
      actual: `Name: "${preview.name}", Pubs: ${preview.publications.length}, Citations: ${preview.totalCitations}, h-index: ${preview.hIndex}, i10: ${preview.i10Index}`,
      status: passed ? "PASSED" : "FAILED",
      durationMs: Date.now() - startFetch,
      details: {
        authorId: preview.authorId,
        publicationsSample: preview.publications.slice(0, 2),
      },
    });
  } catch (err: any) {
    logTest({
      id: "ST-04",
      category: "SCHOLAR_EXTRACTION",
      name: "Google Scholar Profile Metrics & Publication Array Schema Validation",
      expected: "Valid profile data",
      actual: `Error: ${err.message}`,
      status: "FAILED",
      durationMs: Date.now() - startFetch,
    });
  }
}

// -------------------------------------------------------------
// PART 2: DATABASE DATA QUALITY & CONSISTENCY VERIFICATION
// -------------------------------------------------------------
async function testDatabaseIntegrity() {
  console.log("\n=======================================================");
  console.log("🗄️ PART 2: VERIFYING DATABASE DATA QUALITY & INTEGRITY");
  console.log("=======================================================\n");

  // DT-01: Verify Faculty Records in Database
  const startFac = Date.now();
  const faculties = await prisma.faculty.findMany({
    include: {
      user: { select: { name: true, email: true } },
      department: { select: { name: true, code: true } },
      _count: { select: { researchAuthorships: true } },
    },
  });

  const facultyCount = faculties.length;
  const facultiesWithValidMetrics = faculties.filter(
    (f) => typeof f.hIndex === "number" && f.hIndex >= 0 && typeof f.totalCitations === "number" && f.totalCitations >= 0
  );
  const passedFac = facultyCount > 0 && facultiesWithValidMetrics.length === facultyCount;

  logTest({
    id: "DT-01",
    category: "DATABASE_INTEGRITY",
    name: "Faculty Records & Bibliometric Profile Completeness Check",
    expected: `All faculty have valid non-negative hIndex and totalCitations (Found ${facultyCount})`,
    actual: `${facultiesWithValidMetrics.length}/${facultyCount} faculty records valid`,
    status: passedFac ? "PASSED" : "FAILED",
    durationMs: Date.now() - startFac,
  });

  // DT-02: Verify Research Publication Metadata Integrity
  const startResearch = Date.now();
  const researchItems = await prisma.research.findMany({
    include: {
      authors: true,
      department: true,
    },
  });

  const currentYear = new Date().getFullYear();
  let invalidYears = 0;
  let invalidCitations = 0;
  let invalidAuthors = 0;
  let invalidDois = 0;

  for (const item of researchItems) {
    if (item.publicationYear && (item.publicationYear < 1970 || item.publicationYear > currentYear + 1)) {
      invalidYears++;
    }
    if (item.citationCount < 0 || isNaN(item.citationCount)) {
      invalidCitations++;
    }
    if (!item.authors || item.authors.length === 0) {
      invalidAuthors++;
    }
    // Check DOI format if present (should start with 10. and not be placeholder)
    if (item.doi && (!item.doi.startsWith("10.") || item.doi.includes("placeholder") || item.doi.length < 6)) {
      invalidDois++;
    }
  }

  const passedResearch = invalidYears === 0 && invalidCitations === 0 && invalidAuthors === 0 && invalidDois === 0;

  logTest({
    id: "DT-02",
    category: "DATABASE_INTEGRITY",
    name: "Research Publication Records Metadata Quality Audit",
    expected: "0 invalid years, 0 negative citations, 0 unauthored papers, 0 invalid DOIs",
    actual: `Audited ${researchItems.length} papers: ${invalidYears} bad years, ${invalidCitations} bad citations, ${invalidAuthors} zero-author papers, ${invalidDois} bad DOIs`,
    status: passedResearch ? "PASSED" : "FAILED",
    durationMs: Date.now() - startResearch,
  });

  // DT-03: Cross-Check Faculty Authorships Linking
  const startAuthorLink = Date.now();
  const linkedAuthorships = await prisma.researchAuthor.count({
    where: { facultyId: { not: null } },
  });
  const totalAuthorships = await prisma.researchAuthor.count();
  const hasLinkedAuthors = linkedAuthorships > 0;

  logTest({
    id: "DT-03",
    category: "DATABASE_INTEGRITY",
    name: "Research Authorship Database Linking & Cross-Faculty Foreign Keys",
    expected: "At least one authorship linked to faculty profile",
    actual: `Total authorships: ${totalAuthorships}, Linked to faculty: ${linkedAuthorships}`,
    status: hasLinkedAuthors ? "PASSED" : "FAILED",
    durationMs: Date.now() - startAuthorLink,
  });
}

// -------------------------------------------------------------
// PART 3: REPORT ENGINE DATA GENERATION & MATH INTEGRITY
// -------------------------------------------------------------
async function testReportEngine() {
  console.log("\n=======================================================");
  console.log("📊 PART 3: REPORT ENGINE DATA GENERATION & MATHEMATICAL ACCURACY");
  console.log("=======================================================\n");

  const adminContext: UserContext = { id: "admin-verification-test", role: "ADMIN" };

  // RT-01: Faculty-Wise Research & Scholar Totals Report
  const startRT01 = Date.now();
  const facultyTotalsPayload: ReportFilterPayload = {
    reportType: "FACULTY_PUBLICATION",
    viewMode: "FACULTY_TOTALS",
    page: 1,
    limit: 100,
  };

  const facultyTotalsReport = await ReportService.generateReportData(facultyTotalsPayload, adminContext);

  const totalFacultyReported = facultyTotalsReport.total;
  const recordsCount = facultyTotalsReport.records.length;
  const sumPublications = facultyTotalsReport.records.reduce((acc, r: any) => acc + (r.publicationCount || 0), 0);
  const sumCitations = facultyTotalsReport.records.reduce((acc, r: any) => acc + (r.totalCitations || 0), 0);
  const calculatedAvg = totalFacultyReported > 0 ? (sumCitations / totalFacultyReported).toFixed(1) : "0";

  const totalMatches = totalFacultyReported === recordsCount;
  const pubSumMatches = facultyTotalsReport.summary.totalPublications === sumPublications;
  const citSumMatches = facultyTotalsReport.summary.totalCitations === sumCitations;
  const avgMatches = facultyTotalsReport.summary.avgCitations === calculatedAvg;

  const passedRT01 = totalMatches && pubSumMatches && citSumMatches && avgMatches;

  logTest({
    id: "RT-01",
    category: "REPORT_ENGINE",
    name: "Faculty-Wise Totals Report: Aggregates & Math Consistency Check",
    expected: `Faculty count matches records (${totalFacultyReported}), Publications sum = ${sumPublications}, Citations sum = ${sumCitations}, Avg = ${calculatedAvg}`,
    actual: `Report Total: ${totalFacultyReported}, Summary Pubs: ${facultyTotalsReport.summary.totalPublications}, Summary Cits: ${facultyTotalsReport.summary.totalCitations}, Summary Avg: ${facultyTotalsReport.summary.avgCitations}`,
    status: passedRT01 ? "PASSED" : "FAILED",
    durationMs: Date.now() - startRT01,
  });

  // RT-02: Comprehensive Institutional Paper-Wise Report & Hirsch h-index Calculation
  const startRT02 = Date.now();
  const paperWisePayload: ReportFilterPayload = {
    reportType: "INSTITUTIONAL",
    viewMode: "PAPER_WISE",
    page: 1,
    limit: 100,
  };

  const paperWiseReport = await ReportService.generateReportData(paperWisePayload, adminContext);

  // Independently verify h-index calculation on returned records
  const citationsSorted = paperWiseReport.records.map((r: any) => r.citationCount || 0).sort((a: number, b: number) => b - a);
  let expectedHIndex = 0;
  for (let i = 0; i < citationsSorted.length; i++) {
    if (citationsSorted[i] >= i + 1) expectedHIndex = i + 1;
    else break;
  }
  const expectedI10 = citationsSorted.filter((c: number) => c >= 10).length;

  const allHaveAuthors = paperWiseReport.records.every((r: any) => Boolean(r.authors && r.primaryAuthor));
  const hIndexCorrect = paperWiseReport.summary.scholarHIndex >= expectedHIndex;
  const i10Correct = paperWiseReport.summary.scholarI10Index >= expectedI10;

  const passedRT02 = paperWiseReport.records.length > 0 && allHaveAuthors && hIndexCorrect && i10Correct;

  logTest({
    id: "RT-02",
    category: "REPORT_ENGINE",
    name: "Paper-Wise Institutional Report: Bibliometric Metrics & Hirsch h-index Verification",
    expected: `Paper-wise records with primary & co-authors, calculated h-index >= ${expectedHIndex}, i10 >= ${expectedI10}`,
    actual: `Records: ${paperWiseReport.records.length}, Scholar h-index: ${paperWiseReport.summary.scholarHIndex}, i10: ${paperWiseReport.summary.scholarI10Index}, All authors present: ${allHaveAuthors}`,
    status: passedRT02 ? "PASSED" : "FAILED",
    durationMs: Date.now() - startRT02,
  });

  // RT-03: Filtering Strictness Verification (Year Range & Citation Threshold)
  const startRT03 = Date.now();
  const filteredPayload: ReportFilterPayload = {
    reportType: "INSTITUTIONAL",
    viewMode: "PAPER_WISE",
    yearStart: 2020,
    yearEnd: 2026,
    citationMin: 5,
    page: 1,
    limit: 50,
  };

  const filteredReport = await ReportService.generateReportData(filteredPayload, adminContext);

  const allWithinYearRange = filteredReport.records.every(
    (r: any) => r.publicationYear >= 2020 && r.publicationYear <= 2026
  );
  const allAboveMinCitations = filteredReport.records.every(
    (r: any) => (r.citationCount || 0) >= 5
  );

  const passedRT03 = allWithinYearRange && allAboveMinCitations;

  logTest({
    id: "RT-03",
    category: "REPORT_ENGINE",
    name: "Report Engine Filtering Verification (Year: 2020-2026, Min Citations: 5)",
    expected: "100% of filtered records satisfy publicationYear in [2020, 2026] and citationCount >= 5",
    actual: `Filtered count: ${filteredReport.records.length}, All years valid: ${allWithinYearRange}, All citations >= 5: ${allAboveMinCitations}`,
    status: passedRT03 ? "PASSED" : "FAILED",
    durationMs: Date.now() - startRT03,
  });

  return { facultyTotalsReport, paperWiseReport };
}

// -------------------------------------------------------------
// PART 4: REPORT EXPORTERS (EXCEL CSV & PDF LAYOUT)
// -------------------------------------------------------------
async function testReportExporters(reports: { facultyTotalsReport: any; paperWiseReport: any }) {
  console.log("\n=======================================================");
  console.log("💾 PART 4: TESTING EXCEL (.CSV) & PDF REPORT GENERATION");
  console.log("=======================================================\n");

  const { facultyTotalsReport, paperWiseReport } = reports;

  // EX-01: CSV Export for Faculty Totals Report
  const startCSV1 = Date.now();
  const csvTotalsBuffer = ReportService.generateCsvBuffer(
    facultyTotalsReport,
    ["slNo", "facultyName", "employeeId", "department", "publicationCount", "totalCitations", "hIndex", "i10Index"],
    "Faculty-Wise Research & Scholar Totals Report"
  );
  const csvTotalsStr = csvTotalsBuffer.toString("utf-8");
  const hasTotalsHeader = csvTotalsStr.includes("KRIYA AI-POWERED RESEARCH INTELLIGENCE PLATFORM");
  const hasTotalsCol = csvTotalsStr.includes('"Faculty Name"') && csvTotalsStr.includes('"Total Publications"');
  const totalsLines = csvTotalsStr.split("\n").filter((l) => l.trim().length > 0);
  const passedCSV1 = csvTotalsBuffer.length > 100 && hasTotalsHeader && hasTotalsCol && totalsLines.length > 5;

  logTest({
    id: "EX-01",
    category: "REPORT_EXPORTERS",
    name: "CSV Buffer Generation: Faculty Totals Report",
    expected: "Valid CSV buffer with institutional header, proper columns, and faculty data rows",
    actual: `Buffer size: ${csvTotalsBuffer.length} bytes, Total lines: ${totalsLines.length}`,
    status: passedCSV1 ? "PASSED" : "FAILED",
    durationMs: Date.now() - startCSV1,
  });

  // EX-02: CSV Export for Paper-Wise Institutional Report (with Authors & Co-Authors)
  const startCSV2 = Date.now();
  const csvPaperBuffer = ReportService.generateCsvBuffer(
    paperWiseReport,
    ["slNo", "title", "primaryAuthor", "coAuthors", "authors", "journal", "publicationYear", "citationCount", "doi"],
    "Comprehensive Institutional Research Report"
  );
  const csvPaperStr = csvPaperBuffer.toString("utf-8");
  const hasPaperHeader = csvPaperStr.includes("BIBLIOMETRIC INDEX METRICS");
  const hasCoAuthorCol = csvPaperStr.includes('"Primary Author"') && csvPaperStr.includes('"Co-Author(s)"');
  const paperLines = csvPaperStr.split("\n").filter((l) => l.trim().length > 0);
  const passedCSV2 = csvPaperBuffer.length > 100 && hasPaperHeader && hasCoAuthorCol && paperLines.length > 5;

  logTest({
    id: "EX-02",
    category: "REPORT_EXPORTERS",
    name: "CSV Buffer Generation: Paper-Wise Report with Authors & Co-Authors",
    expected: "Valid CSV buffer with Primary Author and Co-Author columns populated",
    actual: `Buffer size: ${csvPaperBuffer.length} bytes, Total lines: ${paperLines.length}, hasPaperHeader: ${hasPaperHeader}, hasCoAuthorCol: ${hasCoAuthorCol}`,
    status: passedCSV2 ? "PASSED" : "FAILED",
    durationMs: Date.now() - startCSV2,
    details: { hasPaperHeader, hasCoAuthorCol, snippet: csvPaperStr.slice(0, 250) },
  });

  // EX-03: HTML / PDF Printable Document Generator
  const startHtml = Date.now();
  const htmlDoc = ReportService.generateHtmlPdfReport(
    facultyTotalsReport,
    ["slNo", "facultyName", "employeeId", "department", "publicationCount", "totalCitations", "hIndex", "i10Index"],
    "Faculty-Wise Research & Scholar Totals Report"
  );

  const hasDoctype = htmlDoc.includes("<!DOCTYPE html>");
  const lowerHtml = htmlDoc.toLowerCase();
  const hasSummaryCards = lowerHtml.includes("total publications") && lowerHtml.includes("total citations");
  const hasTable = htmlDoc.includes("<table") && htmlDoc.includes("</table>");
  const passedHtml = hasDoctype && hasSummaryCards && hasTable && htmlDoc.length > 500;

  logTest({
    id: "EX-03",
    category: "REPORT_EXPORTERS",
    name: "HTML/PDF Printable Document Layout & Executive Summary Cards",
    expected: "Complete HTML document with CSS styles, KPI cards, and printable table",
    actual: `HTML size: ${htmlDoc.length} characters, DOCTYPE: ${hasDoctype}, KPI Cards: ${hasSummaryCards}`,
    status: passedHtml ? "PASSED" : "FAILED",
    durationMs: Date.now() - startHtml,
  });
}

// -------------------------------------------------------------
// SUMMARY PRINTER & MARKDOWN ARTIFACT WRITER
// -------------------------------------------------------------
function generateSummaryReport() {
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log("\n=======================================================");
  console.log("🏁 VERIFICATION & TEST EXECUTION COMPLETE");
  console.log("=======================================================");
  console.log(`Total Verification Cases: ${total}`);
  console.log(`Passed:                   ${passed} ✅`);
  console.log(`Failed:                   ${failed} ❌`);
  console.log(`Overall Quality Score:    ${passRate}%`);
  console.log("=======================================================\n");

  console.table(
    results.map((r) => ({
      ID: r.id,
      Category: r.category,
      Test_Name: r.name.length > 45 ? r.name.slice(0, 42) + "..." : r.name,
      Status: r.status,
      Latency: `${r.durationMs}ms`,
    }))
  );

  return { total, passed, failed, passRate };
}

async function main() {
  try {
    await testGoogleScholarExtraction();
    await testDatabaseIntegrity();
    const reports = await testReportEngine();
    await testReportExporters(reports);
    generateSummaryReport();
  } catch (err: any) {
    console.error("Fatal error during test execution:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
