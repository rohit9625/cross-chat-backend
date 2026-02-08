import { pool } from "../config/database";
import { TranslationJob, TranslationJobStatus } from "../models/translation.model";

/**
 * Fields that are allowed to be updated after a job is created.
 */
type TranslationJobUpdate = Partial<
  Pick<
    TranslationJob,
    | "status"
    | "attempt"
    | "max_attempts"
    | "locked_at"
    | "last_error"
  >
>;

/**
 * Required fields to enqueue a translation job.
 */
export interface EnqueueTranslationJobInput {
  message_id: number;
  chat_id: number;
  source_language: string;
  target_language: string;
  text: string;
}

/**
 * Enqueues a new translation job.
 *
 * - Idempotent via (message_id, target_language)
 * - Notifies workers only if a job is inserted
 */
export async function enqueueTranslationJob(
  input: EnqueueTranslationJobInput
): Promise<void> {
  const {
    message_id,
    chat_id,
    source_language,
    target_language,
    text,
  } = input;

  const { rowCount } = await pool.query(
    `
    INSERT INTO translation_jobs (
      message_id,
      chat_id,
      source_language,
      target_language,
      text
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (message_id, target_language) DO NOTHING
    `,
    [message_id, chat_id, source_language, target_language, text]
  );


  if (rowCount && rowCount > 0) {
    await pool.query(`NOTIFY translation_jobs`);
  }
}

/**
 * Claims the next available translation job for processing.
 *
 * - Moves job to IN_PROGRESS
 * - Increments attempt count
 * - Handles stale locks safely
 *
 * @returns Claimed job or null if none available
 */
export async function claimNextTranslationJob(): Promise<TranslationJob | null> {
  const { rows } = await pool.query<TranslationJob>(
    `
    UPDATE translation_jobs
    SET
      status = $1,
      attempt = attempt + 1,
      locked_at = NOW(),
      updated_at = NOW()
    WHERE id = (
      SELECT id
      FROM translation_jobs
      WHERE status = $2
         OR (status = $1 AND locked_at < NOW() - INTERVAL '1 minute')
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
    `,
    [TranslationJobStatus.IN_PROGRESS, TranslationJobStatus.PENDING]
  );

  return rows[0] ?? null;
}

/**
 * Updates allowed fields of a translation job.
 *
 * - Always updates updated_at
 *
 * @throws If no fields are provided
 */
export async function updateTranslationJob(
  jobId: number,
  updates: TranslationJobUpdate
): Promise<TranslationJob | null> {
  const keys = Object.keys(updates) as (keyof TranslationJobUpdate)[];

  if (keys.length === 0) {
    throw new Error("No fields provided to updateTranslationJob");
  }

  const setClauses: string[] = [];
  const values: any[] = [];

  keys.forEach((key, index) => {
    setClauses.push(`${key} = $${index + 1}`);
    values.push(updates[key]);
  });

  // Always update updated_at
  setClauses.push(`updated_at = NOW()`);

  const query = `
    UPDATE translation_jobs
    SET ${setClauses.join(", ")}
    WHERE id = $${values.length + 1}
    RETURNING *
  `;

  const { rows } = await pool.query<TranslationJob>(query, [...values, jobId]);
  return rows[0] ?? null;
}
