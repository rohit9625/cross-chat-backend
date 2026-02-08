import { pool } from "../config/database";
import { Message, MessageTranslation } from "../models/message.model";

type MessageWithSender = Message & {
  sender_name: string | null;
};
type MessageWithTranslation = Message & {
  sender_name: string | null;
  translated_text: string | null;
  translated_language: string | null;
};

type MessageUpdate = Partial<
  Pick<
    Message,
    | "translation_status"
    | "auto_translate"
  >
>;

export async function getChatMessages(chatId: number): Promise<MessageWithSender[]> {
  const { rows } = await pool.query<MessageWithSender>(
    `
    SELECT
      m.*,
      u.name AS sender_name
    FROM messages m
    LEFT JOIN users u
      ON u.id = m.sender_id
    WHERE m.chat_id = $1
    ORDER BY m.created_at DESC
    `,
    [chatId]
  );
  return rows;
}

export async function createMessage(
  chatId: number,
  senderId: number,
  content: string
): Promise<MessageWithSender | null> {
  const {rows} = await pool.query<MessageWithSender>(
    `
    WITH inserted AS (
      INSERT INTO messages (chat_id, sender_id, content)
      SELECT $1, u.id, $2
      FROM users u
      WHERE u.id = $3
      RETURNING *
    )
    SELECT
      inserted.*,
      u.name AS sender_name
    FROM inserted
    JOIN users u ON u.id = inserted.sender_id
    `,
    [chatId, content, senderId]
  );

  return rows[0] ?? null;
}

export async function updateMessage(
  messageId: number,
  updates: MessageUpdate
): Promise<Message | null> {
  const keys = Object.keys(updates) as (keyof MessageUpdate)[];

  if (keys.length === 0) {
    throw new Error("No fields provided to updateMessage");
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
    UPDATE messages
    SET ${setClauses.join(", ")}
    WHERE id = $${values.length + 1}
    RETURNING *
  `;

  const { rows } = await pool.query<Message>(query, [...values, messageId]);
  return rows[0] ?? null;
}

export async function getChatMessageById(messageId: number): Promise<Message | null> {
  const { rows } = await pool.query<Message>(
    `SELECT * FROM messages WHERE id = $1`,
    [messageId]
  );
  return rows[0] ?? null;
}

export async function getChatMessagesWithTranslation(
  chatId: number,
  language: string
): Promise<MessageWithTranslation[]> {
  const { rows } = await pool.query<MessageWithTranslation>(
    `
    SELECT
      m.*,
      u.name AS sender_name,
      mt.translated_text,
      mt.language AS translated_language
    FROM messages m
    LEFT JOIN users u
      ON u.id = m.sender_id
    LEFT JOIN message_translations mt
      ON mt.message_id = m.id
     AND mt.language = $2
    WHERE m.chat_id = $1
    ORDER BY m.created_at DESC
    `,
    [chatId, language]
  );

  return rows;
}

/**
 * Returns the translation for a message in a given language.
 *
 * @returns MessageTranslation or null if not found
 */
export async function findMessageTranslation(
  messageId: number,
  language: string
): Promise<MessageTranslation | null> {
  const { rows } = await pool.query<MessageTranslation>(
    `
    SELECT
      message_id,
      language,
      translated_text
    FROM message_translations
    WHERE message_id = $1
      AND language = $2
    LIMIT 1
    `,
    [messageId, language]
  );

  return rows[0] ?? null;
}

/**
 * Saves a message translation if it does not already exist.
 *
 * @returns MessageTranslation if inserted, or null if it already existed
 */
export async function saveMessageTranslation(
  messageId: number,
  language: string,
  translatedText: string
): Promise<MessageTranslation | null> {
  const { rows } = await pool.query<MessageTranslation>(
    `
    INSERT INTO message_translations (
      message_id,
      language,
      translated_text
    )
    VALUES ($1, $2, $3)
    ON CONFLICT (message_id, language) DO NOTHING
    RETURNING
      message_id,
      language,
      translated_text
    `,
    [messageId, language, translatedText]
  );

  return rows[0] ?? null;
}
