import { prisma } from "../config/db.js";
import { PublicationClassifierService } from "../services/fieldReconciliation.service.js";

async function classifyExistingPublications() {
  console.log("=================================================");
  console.log("🏷️ RUNNING PUBLICATION CLASSIFICATION ENGINE ON ALL DB RECORDS");
  console.log("=================================================\n");

  const papers = await prisma.research.findMany();
  console.log(`Found ${papers.length} publications to classify.\n`);

  let journalCount = 0;
  let conferenceCount = 0;
  let patentCount = 0;
  let bookCount = 0;
  let otherCount = 0;

  for (const p of papers) {
    const classification = PublicationClassifierService.classifyPublication({
      title: p.title,
      venue: p.journal || p.conference,
      snippet: p.abstract,
    });

    console.log(`📌 Title: "${p.title.substring(0, 45)}..."`);
    console.log(`   Detected Venue Type: ${classification.venueType} ${classification.patentNumber ? `(Patent: ${classification.patentNumber})` : classification.isbn ? `(ISBN: ${classification.isbn})` : ""}`);

    await prisma.research.update({
      where: { id: p.id },
      data: {
        venueType: classification.venueType,
        patentNumber: classification.patentNumber || null,
        isbn: classification.isbn || null,
      },
    });

    if (classification.venueType === "JOURNAL") journalCount++;
    else if (classification.venueType === "CONFERENCE") conferenceCount++;
    else if (classification.venueType === "PATENT") patentCount++;
    else if (classification.venueType === "BOOK") bookCount++;
    else otherCount++;
  }

  console.log("\n=================================================");
  console.log(`📊 CLASSIFICATION BREAKDOWN:`);
  console.log(`   📖 Journals: ${journalCount}`);
  console.log(`   🎤 Conferences: ${conferenceCount}`);
  console.log(`   📜 Patents: ${patentCount}`);
  console.log(`   📚 Books & ISBN: ${bookCount}`);
  console.log(`   📄 Others / Articles: ${otherCount}`);
  console.log("=================================================");
}

classifyExistingPublications()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
