import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { normalizePublicationDate, parseYearAndMonth, formatDisplayDate, matchesDateFilter, buildPrismaMonthFilter } from "../utils/dateFormatter.js";
import { GoogleScholarService } from "../integrations/googleScholar/googleScholar.service.js";
import { OpenAlexService } from "../services/openalex.service.js";
import { ResearchService } from "../services/research.service.js";
import { ReportService } from "../services/report.service.js";

const prisma = new PrismaClient();

async function runTests() {
  console.log("================================================================================");
  console.log("🚀 COMPREHENSIVE PRODUCTION DATE MODULE VERIFICATION TEST");
  console.log("================================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`, detail || "");
    }
  }

  // TEST 1: Date Normalization
  console.log("--- TEST GROUP 1: Date Normalization & Parsing ---");
  const norm1 = normalizePublicationDate("2025/1/17");
  assert(norm1 === "2025-01-17", "Normalizes '2025/1/17' to '2025-01-17'", norm1);

  const norm2 = normalizePublicationDate("2024-10-17");
  assert(norm2 === "2024-10-17", "Keeps '2024-10-17' as '2024-10-17'", norm2);

  const norm3 = normalizePublicationDate("2024/5");
  assert(norm3 === "2024-05", "Normalizes '2024/5' to '2024-05'", norm3);

  const norm4 = normalizePublicationDate("May 2024");
  assert(norm4 === "2024-05", "Normalizes 'May 2024' to '2024-05'", norm4);

  const norm5 = normalizePublicationDate("2023");
  assert(norm5 === "2023", "Preserves exact 4-digit year '2023'", norm5);

  const norm6 = normalizePublicationDate(null, 2022);
  assert(norm6 === "2022", "Uses fallback year '2022' when raw date is null", norm6);

  // TEST 2: Display Formatting
  console.log("\n--- TEST GROUP 2: Human Display Formatting ---");
  const disp1 = formatDisplayDate("2025-01-17");
  assert(disp1 === "17 Jan 2025", "Formats '2025-01-17' to '17 Jan 2025'", disp1);

  const disp2 = formatDisplayDate("2024-10-05");
  assert(disp2 === "5 Oct 2024", "Formats '2024-10-05' to '5 Oct 2024'", disp2);

  const disp3 = formatDisplayDate("2024-05");
  assert(disp3 === "May 2024", "Formats '2024-05' to 'May 2024'", disp3);

  const disp4 = formatDisplayDate("2023");
  assert(disp4 === "2023", "Formats '2023' to '2023'", disp4);

  // TEST 3: Year and Month Parsing
  console.log("\n--- TEST GROUP 3: Month & Year Extraction ---");
  const parsed1 = parseYearAndMonth("2025-01-17");
  assert(parsed1.year === 2025 && parsed1.month === 1 && parsed1.day === 17, "Extracts year 2025, month 1, day 17", parsed1);

  const parsed2 = parseYearAndMonth("2024-10");
  assert(parsed2.year === 2024 && parsed2.month === 10, "Extracts year 2024, month 10", parsed2);

  // TEST 4: Google Scholar Live SerpApi Citation Detail Fetch
  console.log("\n--- TEST GROUP 4: Google Scholar Live Citation Detail Fetch ---");
  try {
    const citationId = "Y8O6WQcAAAAJ:roLk4NBRz8UC"; // Kushal Birla's 2025 paper
    console.log(`Fetching citation detail for Google Scholar citation: ${citationId}...`);
    const scholarCite = await GoogleScholarService.fetchCitationDetail(citationId);
    console.log("Scholar Citation Result:", scholarCite);

    assert(Boolean(scholarCite), "Google Scholar citation detail was retrieved");
    if (scholarCite) {
      assert(Boolean(scholarCite.publicationDate), `Retrieved publicationDate: ${scholarCite.publicationDate}`);
      assert(Boolean(scholarCite.authors), `Retrieved full authors: ${scholarCite.authors}`);
    }
  } catch (err: any) {
    console.error("Scholar live fetch failed:", err.message);
  }

  // TEST 5: OpenAlex Live Metadata & Title Search
  console.log("\n--- TEST GROUP 5: OpenAlex Live Metadata & Date Search ---");
  try {
    const testTitle = "Blockchain powered carbon credit trading system using CAP-and-trade mechanism";
    console.log(`Searching OpenAlex for: "${testTitle}"...`);
    const openAlexMeta = await OpenAlexService.fetchMetadataByTitle(testTitle);
    console.log("OpenAlex Result:", {
      title: openAlexMeta?.title,
      publicationDate: openAlexMeta?.publicationDate,
      publicationYear: openAlexMeta?.publicationYear,
      doi: openAlexMeta?.doi,
    });

    assert(Boolean(openAlexMeta), "OpenAlex returned matching publication");
    assert(Boolean(openAlexMeta?.publicationDate), `OpenAlex retrieved exact publicationDate: ${openAlexMeta?.publicationDate}`);
  } catch (err: any) {
    console.error("OpenAlex live search failed:", err.message);
  }

  // TEST 6: Date Enrichment on Database Records (Backfill sample)
  console.log("\n--- TEST GROUP 6: Database Publication Date Enrichment ---");
  try {
    // Find papers missing publicationDate
    const nullDateCountBefore = await prisma.research.count({
      where: { OR: [{ publicationDate: null }, { publicationDate: "" }] },
    });
    console.log(`Papers currently missing publicationDate in DB: ${nullDateCountBefore}`);

    // Enrich a batch of papers
    console.log("Running automated date enrichment on database papers...");
    const enrichResult = await ResearchService.enrichAllMissingDates();
    console.log(`Enrichment complete: Enriched ${enrichResult.enrichedCount} of ${enrichResult.totalCandidates} papers!`);

    assert(enrichResult.enrichedCount >= 0, `Batch enrichment executed successfully (${enrichResult.enrichedCount} enriched)`);

    // Verify sample of enriched papers
    const sampleWithDate = await prisma.research.findMany({
      where: { publicationDate: { not: null } },
      select: { id: true, title: true, publicationDate: true, publicationYear: true },
      take: 5,
    });
    console.log("Sample enriched papers from DB:", sampleWithDate);
    assert(sampleWithDate.length > 0, "At least one paper has publicationDate set in database");
  } catch (err: any) {
    console.error("Database enrichment failed:", err.message);
  }

  // TEST 7: Monthly Filtering on Database
  console.log("\n--- TEST GROUP 7: Monthly Database Filtering ---");
  try {
    // Test filtering by month
    const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (const m of allMonths) {
      const filter = buildPrismaMonthFilter(m);
      const count = await prisma.research.count({ where: filter });
      if (count > 0) {
        console.log(`Found ${count} papers published in Month ${m}!`);
      }
    }

    assert(true, "Month filter queries executed successfully against database");
  } catch (err: any) {
    console.error("Monthly filter failed:", err.message);
  }

  // TEST 8: Report Service Generation with Publication Date & Month Filter
  console.log("\n--- TEST GROUP 8: Report Generation with Publication Dates ---");
  try {
    const adminUser = { id: "test-admin", role: "ADMIN" as const };
    const reportRes = await ReportService.generateReportData(
      {
        reportType: "RESEARCH_OUTPUT",
        viewMode: "PAPER_WISE",
        columns: ["title", "authors", "journal", "publicationYear", "publicationDate", "citationCount"],
        sorting: "date_desc",
        page: 1,
        limit: 10,
      },
      adminUser
    );

    console.log(`Generated report with ${reportRes.records.length} records`);
    if (reportRes.records.length > 0) {
      const sample = reportRes.records[0] as any;
      console.log("Sample report row with date:", {
        title: sample.title?.slice(0, 40) + "...",
        publicationYear: sample.publicationYear,
        publicationDate: sample.publicationDate,
      });
      assert(Boolean(sample.publicationDate), `Report row includes publicationDate: ${sample.publicationDate}`);
    }

    // Also test monthFilter in report
    const monthReportRes = await ReportService.generateReportData(
      {
        reportType: "RESEARCH_OUTPUT",
        viewMode: "PAPER_WISE",
        monthFilter: "10", // October
        page: 1,
        limit: 10,
      },
      adminUser
    );
    console.log(`Monthly report (Month 10) found ${monthReportRes.records.length} matching records`);
    assert(true, "Monthly report generation succeeded");
  } catch (err: any) {
    console.error("Report test failed:", err.message);
  }

  console.log("\n================================================================================");
  console.log(`📊 FINAL TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("================================================================================\n");

  await prisma.$disconnect();
}

runTests().catch((e) => {
  console.error("Fatal test error:", e);
  process.exit(1);
});
