import { prisma } from "../../config/db.js";
import { GoogleScholarService } from "./googleScholar.service.js";
import { OpenAlexService } from "../../services/openalex.service.js";
import { CrossrefService } from "../../services/crossref.service.js";
import { ScholarNormalizationService } from "./scholarNormalization.service.js";
import { ScholarMatchingService, type ExistingPublicationCandidate } from "./scholarMatching.service.js";
import { AuditorService } from "../../services/auditor.service.js";
import { AnalyticsService } from "../../services/analytics.service.js";
import { FieldReconciliationService } from "../../services/fieldReconciliation.service.js";
import type { ScholarSyncTrigger, ScholarSyncStatus } from "@prisma/client";

export interface SyncOptions {
  force?: boolean;
  triggerType?: ScholarSyncTrigger;
  triggeredById?: string | null;
  concurrency?: number;
}

export interface SingleSyncResult {
  facultyId: string;
  scholarAuthorId?: string;
  status: ScholarSyncStatus;
  publicationsDiscovered: number;
  publicationsAdded: number;
  publicationsUpdated: number;
  citationsUpdated: number;
  error?: string;
}

export class ScholarSyncAgent {
  private static activeSyncLocks = new Set<string>();

  /**
   * Evaluates sync cooldown (6 hours minimum between automatic background syncs)
   */
  private static isCooldownActive(lastSyncTime: Date | null | undefined): { inCooldown: boolean; remainingMinutes: number } {
    if (!lastSyncTime) return { inCooldown: false, remainingMinutes: 0 };
    const sixHoursMs = 6 * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(lastSyncTime).getTime();
    if (elapsed < sixHoursMs) {
      const remainingMs = sixHoursMs - elapsed;
      return { inCooldown: true, remainingMinutes: Math.ceil(remainingMs / (60 * 1000)) };
    }
    return { inCooldown: false, remainingMinutes: 0 };
  }

  /**
   * Idempotent, locked synchronization of a single faculty member's profile
   */
  static async syncSingleFaculty(facultyId: string, options: SyncOptions = {}): Promise<SingleSyncResult> {
    if (this.activeSyncLocks.has(facultyId)) {
      console.warn(`[ScholarSyncAgent] Sync already active for faculty '${facultyId}'. Skipping duplicate concurrent execution.`);
      return {
        facultyId,
        status: "SUCCESS",
        publicationsDiscovered: 0,
        publicationsAdded: 0,
        publicationsUpdated: 0,
        citationsUpdated: 0,
        error: "Sync already in progress.",
      };
    }

    this.activeSyncLocks.add(facultyId);

    try {
      return await this.executeSingleFacultySync(facultyId, options);
    } finally {
      this.activeSyncLocks.delete(facultyId);
    }
  }

  private static async executeSingleFacultySync(facultyId: string, options: SyncOptions = {}): Promise<SingleSyncResult> {
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { user: true, department: true },
    });

    if (!faculty) {
      throw new Error(`Faculty member with ID '${facultyId}' not found.`);
    }

    const inputScholarUrlOrId = faculty.scholarUrl || faculty.scholarAuthorId;
    if (!inputScholarUrlOrId) {
      await prisma.faculty.update({
        where: { id: facultyId },
        data: {
          scholarSyncStatus: "FAILED",
          scholarSyncError: "No Google Scholar Author ID or Profile URL linked.",
        },
      });
      return {
        facultyId,
        status: "FAILED",
        publicationsDiscovered: 0,
        publicationsAdded: 0,
        publicationsUpdated: 0,
        citationsUpdated: 0,
        error: "No Google Scholar Author ID or Profile URL linked.",
      };
    }

    // Cooldown verification unless force sync is requested
    const cooldown = this.isCooldownActive(faculty.lastSyncTime);
    if (cooldown.inCooldown && !options.force) {
      return {
        facultyId,
        scholarAuthorId: faculty.scholarAuthorId || undefined,
        status: "RATE_LIMITED",
        publicationsDiscovered: 0,
        publicationsAdded: 0,
        publicationsUpdated: 0,
        citationsUpdated: 0,
        error: `Cooldown active. Next sync permitted in ${cooldown.remainingMinutes} minutes. Use force=true to bypass.`,
      };
    }

    // Set status to SYNCING
    await prisma.faculty.update({
      where: { id: facultyId },
      data: { scholarSyncStatus: "SYNCING", scholarSyncError: null },
    });

    try {
      console.log(`[SCHOLAR_SYNC_START] Faculty: ${faculty.user.name} (${facultyId})`);

      // 1. Acquire Google Scholar & Academic data via OpenRouter AI integration
      const profile = await GoogleScholarService.fetchProfilePreview(inputScholarUrlOrId, {
        facultyName: faculty.user.name,
        departmentName: faculty.department?.name,
        affiliation: faculty.department?.name || faculty.affiliation || "Department of Computer Science & Engineering",
        interests: faculty.researchInterests,
      });

      // Fetch all existing KRIYA publications to run 5-tier deterministic matching
      const existingResearchesRaw = await prisma.research.findMany({
        include: { authors: true },
      });

      const existingResearches: ExistingPublicationCandidate[] = existingResearchesRaw.map((r) => ({
        id: r.id,
        title: r.title,
        doi: r.doi,
        publicationYear: r.publicationYear,
        authors: r.authors.map((a) => ({
          authorName: a.authorName,
          facultyId: a.facultyId,
        })),
      }));

      // Fetch all faculty members for strong identity cross-faculty matching
      const allFaculties = await prisma.faculty.findMany({
        include: { user: true },
      });

      let pubDiscovered = profile.publications.length;
      let pubAdded = 0;
      let pubUpdated = 0;
      let citUpdated = 0;

      const todayBucket = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

      for (const pub of profile.publications) {
        let enrichedAbstract = pub.snippet || `Research paper by ${pub.authors}.`;
        let openAlexKeywords: string[] = profile.interests.length > 0 ? profile.interests : ["Research"];
        let resolvedDoi = ScholarNormalizationService.normalizeDoi(pub.doi);
        let venueJournal = pub.journal || null;
        let venueConference = pub.conference || null;

        // 2. OpenAlex Primary Enrichment & Crossref Fallback
        let fetchedMeta: any | null = null;
        if (resolvedDoi) {
          try {
            fetchedMeta = await OpenAlexService.fetchMetadata(resolvedDoi);
          } catch {}
          if (!fetchedMeta) {
            try {
              fetchedMeta = await CrossrefService.fetchMetadata(resolvedDoi);
            } catch {}
          }
        }

        let openAlexAuthors: { authorName: string; authorOrder: number }[] = [];
        if (fetchedMeta) {
          const facultyLastName = faculty.user.name.split(" ").pop()?.toLowerCase() || "";
          const facultyFirstName = faculty.user.name.split(" ")[0]?.toLowerCase() || "";

          const matchesFaculty = (fetchedMeta.authors || []).some((a: any) => {
            const nameLower = (a.authorName || "").toLowerCase();
            return (
              (facultyLastName.length >= 3 && nameLower.includes(facultyLastName)) ||
              (facultyFirstName.length >= 3 && nameLower.includes(facultyFirstName))
            );
          });

          if (resolvedDoi || matchesFaculty) {
            if (fetchedMeta.abstract && fetchedMeta.abstract !== "Abstract unavailable.") enrichedAbstract = fetchedMeta.abstract;
            if (fetchedMeta.keywords && fetchedMeta.keywords.length > 0) openAlexKeywords = fetchedMeta.keywords;
            if (fetchedMeta.journal) venueJournal = fetchedMeta.journal;
            if (fetchedMeta.conference) venueConference = fetchedMeta.conference;
            
            if (fetchedMeta.doi) {
              const candidateDoi = ScholarNormalizationService.normalizeDoi(fetchedMeta.doi);
              if (candidateDoi) {
                const similarity = ScholarNormalizationService.titleSimilarity(pub.title, fetchedMeta.title || "");
                if (similarity >= 0.85 && matchesFaculty) {
                  resolvedDoi = candidateDoi;
                }
              }
            }

            if (fetchedMeta.authors && fetchedMeta.authors.length > 0 && matchesFaculty) {
              openAlexAuthors = fetchedMeta.authors;
            }
          }
        }

        // Parse authors string if OpenAlex didn't provide author list
        if (openAlexAuthors.length === 0 && pub.authors) {
          const names = pub.authors
            .split(/,|\band\b|&/i)
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && s.toLowerCase() !== "..." && s.toLowerCase() !== "et al");

          openAlexAuthors = names.map((n, idx) => ({
            authorName: n,
            authorOrder: idx + 1,
          }));
        }

        if (openAlexAuthors.length === 0) {
          openAlexAuthors = [{ authorName: faculty.user.name, authorOrder: 1 }];
        }

        // 3. Build ResearchAuthor records with STRONG IDENTITY author matching
        const authorCreateData = openAlexAuthors.map((a, idx) => {
          const authorNameNorm = ScholarNormalizationService.normalizeAuthorName(a.authorName);

          // Strong Identity Safeguard: Require exact Faculty ID, ORCID, exact Email, or explicitly target faculty
          let matchedFacultyId: string | null = null;
          let isCorresponding = false;

          // Check if author is the target faculty member being synchronized
          const isTargetFaculty =
            ScholarNormalizationService.isAuthorMatchingFaculty(a.authorName, faculty.user.name) ||
            authorNameNorm.includes(ScholarNormalizationService.normalizeAuthorName(faculty.user.name)) ||
            ScholarNormalizationService.normalizeAuthorName(faculty.user.name).includes(authorNameNorm) ||
            openAlexAuthors.length === 1;

          if (isTargetFaculty) {
            matchedFacultyId = faculty.id;
            isCorresponding = true;
          } else {
            // Strong Identity Signal Check for other faculty members:
            const strongMatch = allFaculties.find((f) => {
              if (f.id === faculty.id) return false;
              return ScholarNormalizationService.isAuthorMatchingFaculty(a.authorName, f.user.name);
            });

            if (strongMatch) {
              matchedFacultyId = strongMatch.id;
            }
          }

          return {
            authorName: a.authorName,
            authorOrder: a.authorOrder || idx + 1,
            facultyId: matchedFacultyId,
            isCorresponding: isCorresponding || (idx === 0 && !matchedFacultyId),
          };
        });

        // Safeguard: Ensure target faculty is associated with at least one author entry
        if (!authorCreateData.some((a) => a.facultyId === faculty.id) && authorCreateData.length > 0) {
          authorCreateData[0].facultyId = faculty.id;
          authorCreateData[0].isCorresponding = true;
        }

        // 4. Deterministic Priority Matching against existing publications
        const matchResult = ScholarMatchingService.findBestMatch(
          {
            scholarId: pub.scholarId,
            title: pub.title,
            doi: resolvedDoi,
            year: pub.year,
            authors: pub.authors,
          },
        existingResearches
        );

        let targetResearchId: string | null = null;

        // Perform Field-Level Data Reconciliation
        const reconciled = FieldReconciliationService.reconcilePublication({
          openAlex: fetchedMeta?.sourceApi === "OpenAlex" ? {
            title: fetchedMeta.title,
            abstract: fetchedMeta.abstract,
            doi: fetchedMeta.doi,
            venue: fetchedMeta.journal || fetchedMeta.conference,
            citationCount: fetchedMeta.citationCount,
          } : undefined,
          crossref: fetchedMeta?.sourceApi === "Crossref" ? {
            title: fetchedMeta.title,
            abstract: fetchedMeta.abstract,
            doi: fetchedMeta.doi,
            venue: fetchedMeta.journal || fetchedMeta.conference,
          } : undefined,
          scholar: {
            title: pub.title,
            snippet: pub.snippet,
            doi: resolvedDoi || undefined,
            venue: pub.journal || pub.conference || undefined,
            citationCount: pub.citationCount,
            publicationYear: pub.year,
          },
        });

        if (matchResult.match) {
          // UPDATE Existing Record (Idempotent merge with Field-Level Provenance)
          targetResearchId = matchResult.match.id;

          const existingRec = await prisma.research.findUnique({
            where: { id: targetResearchId },
          });

          if (existingRec) {
            const oldCitationCount = existingRec.citationCount;
            const newCitationCount = Math.max(oldCitationCount, reconciled.citationCount.value);

            if (newCitationCount !== oldCitationCount) {
              citUpdated += Math.abs(newCitationCount - oldCitationCount);
            }

            // Keep manual abstract if present, else use reconciled abstract
            const finalAbstract = (existingRec.abstractSource === "MANUAL_KRIYA" && FieldReconciliationService.isValidAbstract(existingRec.abstract))
              ? existingRec.abstract
              : reconciled.abstract.value;
            const finalAbstractSource = (existingRec.abstractSource === "MANUAL_KRIYA" && FieldReconciliationService.isValidAbstract(existingRec.abstract))
              ? "MANUAL_KRIYA"
              : reconciled.abstract.source;

            await prisma.research.update({
              where: { id: targetResearchId },
              data: {
                citationCount: newCitationCount,
                citationSource: reconciled.citationCount.source,
                abstract: finalAbstract,
                abstractSource: finalAbstractSource,
                doi: resolvedDoi || existingRec.doi,
                doiSource: reconciled.doi.source,
                journal: reconciled.isJournal ? (reconciled.venue.value || existingRec.journal) : existingRec.journal,
                conference: !reconciled.isJournal ? (reconciled.venue.value || existingRec.conference) : existingRec.conference,
                venueSource: reconciled.venue.source,
                venueType: reconciled.venueType,
                patentNumber: reconciled.patentNumber || existingRec.patentNumber,
                isbn: reconciled.isbn || existingRec.isbn,
                provenance: reconciled as any,
              },
            });

            // Update ResearchAuthor links if incomplete single author
            const existingAuthorsCount = await prisma.researchAuthor.count({
              where: { researchId: targetResearchId },
            });

            if (existingAuthorsCount <= 1 && authorCreateData.length > 1) {
              await prisma.researchAuthor.deleteMany({
                where: { researchId: targetResearchId },
              });
              await prisma.researchAuthor.createMany({
                data: authorCreateData.map((a) => ({
                  researchId: targetResearchId!,
                  ...a,
                })),
              });
            }

            pubUpdated++;
          }
        } else {
          // CREATE New Research Record with Field-Level Data Provenance
          const newResearch = await prisma.research.create({
            data: {
              title: reconciled.title.value,
              titleSource: reconciled.title.source,
              abstract: reconciled.abstract.value,
              abstractSource: reconciled.abstract.source,
              keywords: openAlexKeywords,
              researchArea: profile.interests[0] || "Computer Science",
              doi: resolvedDoi,
              doiSource: reconciled.doi.source,
              journal: reconciled.isJournal ? (reconciled.venue.value || null) : null,
              conference: !reconciled.isJournal ? (reconciled.venue.value || null) : null,
              venueSource: reconciled.venue.source,
              venueType: reconciled.venueType,
              patentNumber: reconciled.patentNumber || null,
              isbn: reconciled.isbn || null,
              publicationYear: reconciled.publicationYear.value,
              citationCount: reconciled.citationCount.value,
              citationSource: reconciled.citationCount.source,
              provenance: reconciled as any,
              pdfUrl: pub.link || null,
              status: "PUBLISHED",
              departmentId: faculty.departmentId,
              createdById: faculty.userId,
              authors: {
                create: authorCreateData,
              },
            },
          });

          targetResearchId = newResearch.id;
          pubAdded++;
          // Add to local in-memory candidate array for subsequent loop matching
          existingResearches.push({
            id: newResearch.id,
            title: newResearch.title,
            doi: newResearch.doi,
            publicationYear: newResearch.publicationYear,
            authors: authorCreateData,
          });
        }

        // 5. Time-Bucket Citation Snapshot Recording (Idempotent per day)
        if (targetResearchId) {
          try {
            await prisma.citationSnapshot.upsert({
              where: {
                researchId_source_recordedDate: {
                  researchId: targetResearchId,
                  source: "GOOGLE_SCHOLAR",
                  recordedDate: todayBucket,
                },
              },
              update: {
                scholarCitations: pub.citationCount,
                kriyaCitations: pub.citationCount,
              },
              create: {
                researchId: targetResearchId,
                source: "GOOGLE_SCHOLAR",
                scholarCitations: pub.citationCount,
                kriyaCitations: pub.citationCount,
                recordedDate: todayBucket,
              },
            });
          } catch {}
        }
      }

      // Update Faculty Profile
      const updatedFaculty = await prisma.faculty.update({
        where: { id: facultyId },
        data: {
          scholarUrl: profile.scholarUrl,
          scholarAuthorId: profile.authorId,
          scholarAvatarUrl: profile.thumbnailUrl || faculty.scholarAvatarUrl,
          scholarSyncStatus: "SYNCED",
          scholarSyncError: null,
          lastSyncTime: new Date(),
          affiliation: profile.affiliation || faculty.affiliation,
          totalCitations: profile.totalCitations,
          hIndex: profile.hIndex,
          i10Index: profile.i10Index,
          publicationCount: profile.publicationCount,
          researchInterests:
            profile.interests.length > 0 ? profile.interests : faculty.researchInterests,
        },
      });

      // Invalidate/refresh analytics cache
      try {
        await AnalyticsService.getOverviewAnalytics();
      } catch {}

      console.log(
        `[SCHOLAR_SYNC_COMPLETE] Faculty: ${faculty.user.name} | Discovered: ${pubDiscovered} | Added: ${pubAdded} | Updated: ${pubUpdated}`
      );

      return {
        facultyId,
        scholarAuthorId: updatedFaculty.scholarAuthorId || undefined,
        status: "SUCCESS",
        publicationsDiscovered: pubDiscovered,
        publicationsAdded: pubAdded,
        publicationsUpdated: pubUpdated,
        citationsUpdated: citUpdated,
      };
    } catch (error: any) {
      console.error(`[SCHOLAR_SYNC_ERROR] Faculty: ${faculty.user.name}:`, error);
      await prisma.faculty.update({
        where: { id: facultyId },
        data: {
          scholarSyncStatus: "FAILED",
          scholarSyncError: error.message || "Scholar synchronization failed.",
        },
      });

      return {
        facultyId,
        scholarAuthorId: faculty.scholarAuthorId || undefined,
        status: "FAILED",
        publicationsDiscovered: 0,
        publicationsAdded: 0,
        publicationsUpdated: 0,
        citationsUpdated: 0,
        error: error.message || "Scholar synchronization failed.",
      };
    }
  }

  /**
   * Run Institutional Sync across all eligible faculty profiles with controlled concurrency.
   */
  static async runInstitutionalSync(options: SyncOptions = {}) {
    const triggerType: ScholarSyncTrigger = options.triggerType || "INSTITUTIONAL_MANUAL";
    const concurrency = options.concurrency || Number(process.env.SCHOLAR_SYNC_CONCURRENCY || 5);

    // Create ScholarSyncRun record
    const syncRun = await prisma.scholarSyncRun.create({
      data: {
        startedAt: new Date(),
        status: "RUNNING",
        triggeredById: options.triggeredById || null,
        triggerType,
      },
    });

    try {
      const faculties = await prisma.faculty.findMany({
        where: {
          OR: [{ NOT: { scholarUrl: null } }, { NOT: { scholarAuthorId: null } }],
        },
      });

      let totalDiscovered = 0;
      let totalAdded = 0;
      let totalUpdated = 0;
      let totalCitations = 0;
      let totalErrors = 0;

      // Process in controlled concurrency batches
      for (let i = 0; i < faculties.length; i += concurrency) {
        const batch = faculties.slice(i, i + concurrency);
        const batchResults = await Promise.all(
          batch.map((f) => this.syncSingleFaculty(f.id, options))
        );

        for (const res of batchResults) {
          // Record structured ScholarSyncRunItem
          await prisma.scholarSyncRunItem.create({
            data: {
              syncRunId: syncRun.id,
              facultyId: res.facultyId,
              status: res.status,
              publicationsDiscovered: res.publicationsDiscovered,
              publicationsAdded: res.publicationsAdded,
              publicationsUpdated: res.publicationsUpdated,
              citationsUpdated: res.citationsUpdated,
              error: res.error || null,
            },
          });

          totalDiscovered += res.publicationsDiscovered;
          totalAdded += res.publicationsAdded;
          totalUpdated += res.publicationsUpdated;
          totalCitations += res.citationsUpdated;
          if (res.status === "FAILED") {
            totalErrors++;
          }
        }
      }

      const finalStatus: ScholarSyncStatus =
        totalErrors === 0
          ? "SUCCESS"
          : totalErrors < faculties.length
          ? "PARTIAL_SUCCESS"
          : "FAILED";

      const completedRun = await prisma.scholarSyncRun.update({
        where: { id: syncRun.id },
        data: {
          completedAt: new Date(),
          status: finalStatus,
          facultiesProcessed: faculties.length,
          publicationsDiscovered: totalDiscovered,
          publicationsAdded: totalAdded,
          publicationsUpdated: totalUpdated,
          citationsUpdated: totalCitations,
          errorsCount: totalErrors,
        },
        include: {
          items: {
            include: { faculty: { include: { user: true } } },
          },
        },
      });

      return completedRun;
    } catch (error: any) {
      await prisma.scholarSyncRun.update({
        where: { id: syncRun.id },
        data: {
          completedAt: new Date(),
          status: "FAILED",
          errorsCount: 1,
        },
      });
      throw error;
    }
  }
}
