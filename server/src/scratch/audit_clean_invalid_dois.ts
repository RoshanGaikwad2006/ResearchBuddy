import { prisma } from "../config/db.js";
import { ScholarNormalizationService } from "../integrations/googleScholar/scholarNormalization.service.js";

async function cleanInvalidDois() {
  console.log("=======================================================");
  console.log("🔍 KRIYA DOI INTEGRITY AUDIT - CLEANING INVALID DOIs");
  console.log("=======================================================");

  const papers = await prisma.research.findMany({
    where: { doi: { not: null } },
    select: { id: true, title: true, doi: true },
  });

  console.log(`Auditing ${papers.length} publications with non-null DOIs...`);

  let validCount = 0;
  let clearedCount = 0;

  for (const paper of papers) {
    const normalized = ScholarNormalizationService.normalizeDoi(paper.doi);

    if (!normalized) {
      console.log(`\n❌ Clearing Invalid DOI from Paper ID: ${paper.id}`);
      console.log(`   Title:       "${paper.title}"`);
      console.log(`   Invalid DOI: "${paper.doi}"`);

      await prisma.research.update({
        where: { id: paper.id },
        data: { doi: null },
      });

      clearedCount++;
    } else if (normalized !== paper.doi) {
      console.log(`\n✏️ Canonicalizing DOI format for Paper ID: ${paper.id}`);
      console.log(`   Old DOI: "${paper.doi}" -> New DOI: "${normalized}"`);

      try {
        await prisma.research.update({
          where: { id: paper.id },
          data: { doi: normalized },
        });
        validCount++;
      } catch (err: any) {
        console.warn(`   DOI conflict for "${normalized}". Clearing duplicate.`);
        await prisma.research.update({
          where: { id: paper.id },
          data: { doi: null },
        });
        clearedCount++;
      }
    } else {
      validCount++;
    }
  }

  console.log("\n=======================================================");
  console.log("📊 DOI AUDIT SUMMARY REPORT");
  console.log(`   Total DOIs Audited: ${papers.length}`);
  console.log(`   Valid DOIs Retained: ${validCount} ✅`);
  console.log(`   Invalid DOIs Cleared: ${clearedCount} 🧹`);
  console.log("=======================================================");
}

cleanInvalidDois()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("DOI audit error:", err);
    process.exit(1);
  });
