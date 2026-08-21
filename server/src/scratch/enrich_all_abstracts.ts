import { prisma } from "../config/db.js";
import { OpenAlexService } from "../services/openalex.service.js";
import { CrossrefService } from "../services/crossref.service.js";
import { FieldReconciliationService } from "../services/fieldReconciliation.service.js";
import { resilientFetch } from "../utils/resilientFetch.js";

async function enrichAllAbstracts() {
  console.log("=======================================================");
  console.log("🔍 KRIYA ABSTRACT ENRICHMENT ENGINE - STARTING AUDIT");
  console.log("=======================================================");

  const papers = await prisma.research.findMany({
    select: {
      id: true,
      title: true,
      doi: true,
      abstract: true,
      abstractSource: true,
    },
  });

  console.log(`Total research papers in database: ${papers.length}`);

  let enrichedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const paper of papers) {
    const isAbstractMissing =
      !paper.abstract ||
      paper.abstract.trim() === "" ||
      paper.abstract.toLowerCase().includes("abstract unavailable") ||
      paper.abstract.trim().length < 25;

    if (!isAbstractMissing) {
      skippedCount++;
      continue;
    }

    console.log(`\n📄 Attempting enrichment for Paper ID: ${paper.id}`);
    console.log(`   Title: "${paper.title}"`);
    console.log(`   DOI:   ${paper.doi || "None"}`);

    let fetchedAbstract: string | null = null;
    let fetchedDoi: string | null = null;
    let source: string = "OPENALEX";

    // 1. Try DOI fetch if available via OpenAlex
    if (paper.doi) {
      const alexMeta = await OpenAlexService.fetchMetadata(paper.doi);
      if (alexMeta?.abstract && FieldReconciliationService.isValidAbstract(alexMeta.abstract, paper.title)) {
        fetchedAbstract = alexMeta.abstract;
        source = "OPENALEX";
      } else {
        // Try Crossref fallback
        const crossMeta = await CrossrefService.fetchMetadata(paper.doi);
        if (crossMeta?.abstract && FieldReconciliationService.isValidAbstract(crossMeta.abstract, paper.title)) {
          fetchedAbstract = crossMeta.abstract;
          source = "CROSSREF";
        }
      }
    }

    // 2. If no DOI or DOI fetch failed, search OpenAlex by Title
    if (!fetchedAbstract && paper.title) {
      try {
        const searchUrl = `https://api.openalex.org/works?search=${encodeURIComponent(paper.title)}&per_page=3`;
        const resp = await resilientFetch(searchUrl, {
          headers: {
            "User-Agent": "KRIYA-Research-Platform/1.0 (mailto:admin@university.edu)",
          },
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
                if (work.doi && !paper.doi) {
                  fetchedDoi = work.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
                }
                break;
              }
            }
          }
        }
      } catch (err: any) {
        console.error(`   Error searching OpenAlex by title: ${err.message}`);
      }
    }

    if (fetchedAbstract) {
      let finalDoiToSet: string | undefined = paper.doi || undefined;
      if (!finalDoiToSet && fetchedDoi) {
        const doiExists = await prisma.research.findUnique({ where: { doi: fetchedDoi } });
        if (!doiExists) {
          finalDoiToSet = fetchedDoi;
        }
      }

      await prisma.research.update({
        where: { id: paper.id },
        data: {
          abstract: fetchedAbstract,
          abstractSource: source,
          doi: finalDoiToSet,
        },
      });

      enrichedCount++;
      console.log(`   ✅ SUCCESS! Enriched abstract (${fetchedAbstract.length} chars) from ${source}`);
    } else {
      failedCount++;
      console.log(`   ⚠️ Could not resolve full text abstract from Open Science registries.`);
    }
  }

  console.log("\n=======================================================");
  console.log("📊 ABSTRACT ENRICHMENT SUMMARY REPORT");
  console.log(`   Total Papers Audited:  ${papers.length}`);
  console.log(`   Already Had Abstract:  ${skippedCount}`);
  console.log(`   Successfully Enriched: ${enrichedCount} ✅`);
  console.log(`   Enrichment Pending:    ${failedCount}`);
  console.log("=======================================================");
}

enrichAllAbstracts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Enrichment error:", err);
    process.exit(1);
  });
