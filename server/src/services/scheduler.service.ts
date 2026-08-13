import cron from "node-cron";
import { ScholarSyncAgent } from "../integrations/googleScholar/scholarSyncAgent.service.js";

export class SchedulerService {
  private static task: any | null = null;

  /**
   * Initializes autonomous scheduler task if enabled via environment configuration
   */
  static initializeScheduler(): void {
    const isEnabled = process.env.SCHOLAR_SYNC_ENABLED === "true";
    const cronSchedule = process.env.SCHOLAR_SYNC_CRON || "0 3 * * 0"; // Weekly at 3:00 AM Sunday default

    if (!isEnabled) {
      console.log("ℹ️ Scholar Autonomous Scheduler is DISABLED (SCHOLAR_SYNC_ENABLED!=true).");
      return;
    }

    if (!cron.validate(cronSchedule)) {
      console.error(`❌ Invalid cron expression '${cronSchedule}' configured for SCHOLAR_SYNC_CRON.`);
      return;
    }

    console.log(`⏱️ Initializing Autonomous Scholar Scheduler with cron: '${cronSchedule}'`);

    this.task = cron.schedule(cronSchedule, async () => {
      console.log(`⏰ Autonomous Cron Triggered: Running Institutional Scholar Sync Run...`);
      try {
        const run = await ScholarSyncAgent.runInstitutionalSync({
          triggerType: "INSTITUTIONAL_CRON",
        });
        console.log(`✅ Autonomous Cron Sync Completed: Status '${run.status}', Processed: ${run.facultiesProcessed}`);
      } catch (error) {
        console.error(`❌ Autonomous Cron Sync Failed:`, error);
      }
    });
  }

  static stopScheduler(): void {
    if (this.task) {
      this.task.stop();
      console.log("⏹️ Scholar Autonomous Scheduler stopped.");
    }
  }
}
