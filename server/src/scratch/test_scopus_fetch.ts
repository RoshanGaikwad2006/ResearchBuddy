import { prisma } from "../config/db.js";

async function test() {
  const faculties = await prisma.faculty.findMany({
    include: {
      user: true,
      researchAuthorships: {
        include: {
          research: true,
        },
      },
    },
  });

  console.log(`Found ${faculties.length} faculty profiles:`);
  for (const f of faculties) {
    const pubCount = f.researchAuthorships.length;
    let sumCitations = 0;
    f.researchAuthorships.forEach((a) => {
      if (a.research) {
        sumCitations += a.research.citationCount || 0;
      }
    });

    console.log(`- ${f.user.name} (${f.user.email}):`);
    console.log(`  Scopus ID: ${f.scopusAuthorId || "NONE"} | DB Citations: ${f.totalCitations} | Sum Paper Citations: ${sumCitations} | Pubs: ${pubCount}`);
  }
}

test();
