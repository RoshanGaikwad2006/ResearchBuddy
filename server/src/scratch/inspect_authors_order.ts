import { prisma } from "../config/db.js";

async function inspectPaperAuthors() {
  const papers = await prisma.research.findMany({
    where: { title: { contains: "Virtual Reality", mode: "insensitive" } },
    include: {
      authors: {
        orderBy: { authorOrder: "asc" },
      },
    },
  });

  console.log(`Found ${papers.length} paper(s) matching 'Virtual Reality'`);

  papers.forEach((p) => {
    console.log(`\nPaper Title: "${p.title}" (ID: ${p.id})`);
    console.log("Authors:");
    p.authors.forEach((a, idx) => {
      console.log(`  [Index ${idx}] ID: ${a.id} | Name: "${a.authorName}" | authorOrder: ${a.authorOrder} | isCorresponding: ${a.isCorresponding} | facultyId: ${a.facultyId}`);
    });
  });
}

inspectPaperAuthors()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
