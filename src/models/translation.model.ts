/**
 * Allowed lifecycle states for a translation job.
 *
 * These values MUST stay in sync with the database.
 */
export const TranslationJobStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export type TranslationJobStatus =
  typeof TranslationJobStatus[keyof typeof TranslationJobStatus];

/**
 * TranslationJob
 *
 * Represents a single asynchronous translation task for a message.
 * Jobs are claimed and processed by background workers.
 *
 * Lifecycle:
 * PENDING → IN_PROGRESS → COMPLETED | FAILED
 *
 * Uniqueness:
 * - One job per (message_id, target_language)
 */
export interface TranslationJob {
  /**
   * Unique identifier for the translation job.
   */
  id: number;

  /**
   * ID of the message that needs to be translated.
   * References `messages.id`.
   */
  message_id: number;

  /**
   * ID of the chat to which the message belongs.
   * References `chats.id`.
   */
  chat_id: number;

  /**
   * Language code of the original message (e.g. "en", "hi", "fr").
   */
  source_language: string;

  /**
   * Language code into which the message should be translated.
   */
  target_language: string;

  /**
   * Original text content to be translated.
   */
  text: string;

  /**
   * Current lifecycle state of the job.
   *
   * - PENDING: Waiting to be picked up
   * - IN_PROGRESS: Claimed by a worker
   * - COMPLETED: Translation successful
   * - FAILED: Permanently failed after retries
   */
  status: TranslationJobStatus;

  /**
   * Number of attempts made so far.
   * Incremented each time a worker claims the job.
   */
  attempt: number;

  /**
   * Maximum allowed attempts before marking the job as FAILED.
   */
  max_attempts: number;

  /**
   * Timestamp when the job was locked by a worker.
   * Used for crash recovery and stuck-job detection.
   *
   * Null when the job is not locked.
   */
  locked_at: string | null;

  /**
   * Error message from the most recent failure, if any.
   */
  last_error: string | null;

  /**
   * Timestamp when the job was created.
   */
  created_at: string;

  /**
   * Timestamp when the job was last updated.
   */
  updated_at: string;
}
