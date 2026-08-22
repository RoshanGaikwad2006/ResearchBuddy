import { prisma } from "../config/db.js";

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

async function verifyDoiAuthors() {
  console.log("=======================================================");
  console.log("🔍 AUDITING ALL PUBLICATION DOIs AGAINST AUTHOR NAMES");
  console.log("=======================================================\n");

  const publications = await prisma.research.findMany({
    where: { doi: { not: null } },
    include: {
      authors: true,
    },
  });

  console.log(`Auditing ${publications.length} publications with non-null DOIs...\n`);

  let invalidDoiCount = 0;
  const invalidDoiIds: string[] = [];

  for (const pub of publications) {
    if (!pub.doi) continue;

    const doiClean = pub.doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");

    try {
      // Query Crossref API for the DOI metadata
      const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doiClean)}`, {
        headers: { "User-Agent": "KRIYA-Research-Platform/1.0 (mailto:admin@kkwagh.edu.in)" },
      });

      if (!response.ok) {
        console.log(`❌ [DOI INVALID/404] "${pub.title.slice(0, 50)}..." | DOI: ${pub.doi} | HTTP ${response.status}`);
        invalidDoiCount++;
        invalidDoiIds.push(pub.id);
        continue;
      }

      const data: any = await response.json();
      const work = data?.message;
      const crossrefTitle = Array.isArray(work?.title) ? work.title[0] : "";
      const crossrefAuthors = Array.isArray(work?.author)
        ? work.author.map((a: any) => `${a.given || ""} ${a.family || ""}`.trim())
        : [];

      // Check author overlap
      const localAuthorNames = pub.authors.map((a) => a.authorName);
      let authorMatched = false;

      for (const localName of localAuthorNames) {
        const localNorm = normalizeName(localName);
        if (localNorm.length < 3) continue;

        for (const remoteName of crossrefAuthors) {
          const remoteNorm = normalizeName(remoteName);
          if (remoteNorm.includes(localNorm) || localNorm.includes(remoteNorm)) {
            authorMatched = true;
            break;
          }

          // Check last name matching
          const localParts = localName.trim().split(" ");
          const localLast = localParts[localParts.length - 1];
          if (localLast && localLast.length >= 3 && remoteNorm.includes(normalizeName(localLast))) {
            authorMatched = true;
            break;
          }
        }
        if (authorMatched) break;
      }

      if (!authorMatched) {
        console.log(`⚠️ [AUTHOR MISMATCH] Paper: "${pub.title.slice(0, 45)}..."`);
        console.log(`   Registered DOI: ${pub.doi}`);
        console.log(`   Crossref Paper Title: "${crossrefTitle.slice(0, 50)}..."`);
        console.log(`   Local Authors: [${localAuthorNames.join(", ")}]`);
        console.log(`   Crossref Authors: [${crossrefAuthors.join(", ")}]`);
        console.log(`   --> ACTION: DOI is MISMATCHED and will be cleared!\n`);
        invalidDoiCount++;
        invalidDoiIds.push(pub.id);
      } else {
        console.log(`✅ [VERIFIED] "${pub.title.slice(0, 45)}..." | DOI: ${pub.doi} | Authors Matched!`);
      }
    } catch (err: any) {
      console.log(`⚠️ Error checking DOI ${pub.doi}: ${err.message}`);
    }
  }

  console.log("\n=======================================================");
  console.log(`📊 DOI AUTHOR MATCH AUDIT COMPLETE`);
  console.log(`   Total Audited: ${publications.length}`);
  console.log(`   Mismatched/Invalid DOIs Found: ${invalidDoiCount}`);

  if (invalidDoiIds.length > 0) {
    console.log(`\n🧹 Clearing ${invalidDoiIds.length} mismatched DOIs from database...`);
    await prisma.research.updateMany({
      where: { id: { in: invalidDoiIds } },
      data: { doi: null },
    });
    console.log("✅ Database cleared of non-matching DOIs successfully!");
  }
}

verifyDoiAuthors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
