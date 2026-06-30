import { NextRequest, NextResponse } from "next/server";

const DB_URL = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

// Import the publish workflow orchestrator
// We can import runPublishWorkflow from our publish route or replicate/re-import its execution.
// Since Next.js routes can import helper functions, let's load it.
import { POST as publishPost } from "../publish/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    // Secure cron trigger endpoint with a secret from environment variables
    const cronSecret = process.env.CRON_SECRET || "zaproshenya_cron_tick_secret_99";
    if (secret !== cronSecret) {
      return NextResponse.json({ message: "Невірний секретний ключ крону" }, { status: 401 });
    }

    // Load all jobs
    const jobsRes = await fetch(`${DB_URL}/autopost/jobs.json`);
    if (!jobsRes.ok) {
      return NextResponse.json({ message: "Помилка читання черги завдань" }, { status: 500 });
    }

    const jobs = await jobsRes.json();
    if (!jobs) {
      return NextResponse.json({ message: "Черга порожня", processedCount: 0 });
    }

    const now = Date.now();
    const overdueJobs: any[] = [];

    // Filter jobs that are scheduled and ready to be published
    for (const [id, job] of Object.entries(jobs)) {
      const jobData = job as any;
      if (jobData && jobData.status === "scheduled" && jobData.scheduledTime <= now) {
        overdueJobs.push({ id, ...jobData });
      }
    }

    if (overdueJobs.length === 0) {
      return NextResponse.json({ message: "Немає запланованих завдань до виконання", processedCount: 0 });
    }

    console.log(`Cron trigger: processing ${overdueJobs.length} scheduled autopost jobs`);

    // Process each overdue job
    for (const job of overdueJobs) {
      const { id, payload } = job;
      
      // Re-trigger publishing by sending a request to our publish endpoint or calling the orchestrator
      // To simulate, we can post directly to our publish route internally!
      const host = req.headers.get("host") || "localhost:3000";
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      const publishUrl = `${protocol}://${host}/api/admin/autopost/publish`;

      // Trigger immediate publication of the payload
      fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: payload.uid || "cron_worker",
          token: payload.token, // Retrieve the admin token saved during scheduling
          mediaUrl: payload.mediaUrl,
          description: payload.description,
          hashtags: payload.hashtags,
          platforms: payload.platforms
          // Note: scheduledTime is omitted here to trigger immediate execution!
        })
      }).catch(err => console.error(`Cron trigger publish error for job ${id}:`, err));

      // Delete or update the scheduled job node to prevent repeated cron processing
      // We overwrite it or delete it. Changing status is safer!
      await fetch(`${DB_URL}/autopost/jobs/${id}/status.json?auth=${payload.token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify("processing")
      });
    }

    return NextResponse.json({ 
      message: `Оброблено запланованих завдань: ${overdueJobs.length}`, 
      processedCount: overdueJobs.length 
    });
  } catch (error: any) {
    console.error("Error in cron scheduler route:", error);
    return NextResponse.json({ message: error.message || "Внутрішня помилка сервера" }, { status: 500 });
  }
}
