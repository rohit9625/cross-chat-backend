import { pool } from "../config/database";
import { translateText } from "../services/translation.service";
import { saveMessageTranslation, updateMessage } from "../data/message.repository";
import { emitToChat } from "../utils/socket.util";
import { SocketEvent } from "../utils/constants";
import { PoolClient } from "pg";
import { TranslationJob, TranslationJobStatus } from "../models/translation.model";
import { claimNextTranslationJob, updateTranslationJob } from "../data/translation.repository";

let workerRunning = false;
let pollingTimer: NodeJS.Timeout | null = null;
let listenClient: PoolClient | null = null;

/**
 * Starts the translation worker loop.
 *
 * - Listens for translation_jobs notifications
 * - Claims and processes available jobs
 * - Falls back to polling for reliability
 */
export async function startTranslationWorker() {
  if (workerRunning) {
    console.warn("[startTranslationWorker] Translation worker already started");
    return;
  }

  workerRunning = true;
  console.log("[startTranslationWorker] Translation worker starting...");

  listenClient = await pool.connect();

  await listenClient.query("LISTEN translation_jobs");
  console.log("[startTranslationWorker] Listening for translation_jobs notifications");

  // Handle notifications
  listenClient.on("notification", async () => {
    if (!workerRunning) return;

    console.log("[startTranslationWorker#notification] notification event received");
    try {
      let job;

      // Drain all available jobs
      while ((job = await claimNextTranslationJob())) {
        console.log(`[startTranslationWorker#notification] processing message_id: ${job.message_id}`);
        await processTranslationJob(job);
      }
    } catch (err) {
      console.error("[startTranslationWorker] Translation worker error:", err);
    }
  });

  // Fallback polling (VERY IMPORTANT)
  pollingTimer = setInterval(async () => {
    if (!workerRunning) return;

    console.log("[startTranslationWorker#setInterval] Claiming next translation job");

    let job;
    while ((job = await claimNextTranslationJob())) {
      console.log(`[startTranslationWorker#setInterval] processing message_id: ${job.message_id}`);
      await processTranslationJob(job);
    }
  }, 5000);
}

/**
 * Stops the translation worker and releases resources.
 */
export async function stopTranslationWorker() {
  console.log("[stopTranslationWorker] Stopping translation worker...");
  workerRunning = false;

  if (pollingTimer) {
    clearInterval(pollingTimer);
  }

  if (listenClient) {
    listenClient.release();
    listenClient = null;
  }
}

/**
 * Processes a claimed translation job.
 *
 * - Translates message text
 * - Persists translated content
 * - Marks job as COMPLETED or retries / FAILS on error
 * - Emits translation event to the chat
 */
export async function processTranslationJob(job: TranslationJob) {
  try {
    await updateMessage(job.message_id, {
      translation_status: "PROCESSING",
    });

    const translated = await translateText(job.text, {
      sourceLocale: job.source_language,
      targetLocale: job.target_language,
      fast: true, // Prefer speed over quality temporarily
    });

    console.log(`[processTranslationJob] Original text: ${job.text}, Translated text: ${translated}`);

    await saveMessageTranslation(
      job.message_id,
      job.target_language,
      translated,
    );

    console.log(`[processTranslationJob] Updating translation job: ${job.id}`);
    await updateTranslationJob(job.id, {
      status: TranslationJobStatus.COMPLETED,
    });

    console.log(`[processTranslationJob] Emitting to chat: ${job.chat_id}`);
    await updateMessage(job.message_id, {
      translation_status: "COMPLETED",
    });
    emitToChat(job.chat_id, SocketEvent.MESSAGE_TRANSLATED, {
      message_id: job.message_id,
      language: job.target_language,
      translated_text: translated,
    });

  } catch (err: any) {
    const failed = job.attempt >= job.max_attempts;

    if (failed) {
      await updateMessage(job.message_id, {
        translation_status: "FAILED",
      });
    }

    console.log(`[processTranslationJob] Error processing translation job: ${job.id}`, err);
    await updateTranslationJob(job.id, {
      status: failed ? TranslationJobStatus.FAILED : TranslationJobStatus.PENDING,
      last_error: err.message ?? null,
      locked_at: null, // Unlock the transaction so that it can be picked again
    });
  }
}
