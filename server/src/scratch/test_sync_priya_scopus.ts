import { prisma } from "../config/db.js";
import { ScopusSyncService } from "../integrations/scopus/scopusSync.service.js";
import { FacultyResearchIdentityService } from "../services/facultyResearchIdentity.service.js";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "priya.rakibe@kkwagh.edu.in" },
    include: { facultyProfile: true },
  });

  if (!user || !user.facultyProfile) {
    console.error("Priya Rakibe faculty profile not found.");
    return;
  }

  console.log("Triggering Scopus sync for Priya Rakibe...");
  const synced = await ScopusSyncService.syncFacultyScopusProfile(user.facultyProfile.id);
  console.log("Synced Scopus Details:", JSON.stringify(synced, null, 2));

  const identity = await FacultyResearchIdentityService.getFacultyResearchIdentity(user.facultyProfile.id);
  console.log("\n==========================================");
  console.log("UPDATED FACULTY RESEARCH IDENTITY:");
  console.log(`Scopus Author ID: ${identity.scopusAuthorId}`);
  console.log(`Scopus Citations: ${identity.metrics.citationSources.scopus}`);
  console.log(`Google Scholar Citations: ${identity.metrics.citationSources.googleScholar}`);
  console.log("==========================================\n");
}

main()
  .catch((err) => console.error("Error syncing Scopus:", err))
  .finally(async () => await prisma.$disconnect());
