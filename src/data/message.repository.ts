import { pool } from "../config/database";
import { Message } from "../models/message.model";

export type MessageWithSender = Message & {
  sender_name: string;
};

export async function getChatMessages(chatId: number): Promise<MessageWithSender[]> {
  const { rows } = await pool.query<MessageWithSender>(
    `
    SELECT
      m.*,
      u.name AS sender_name
    FROM messages m
    JOIN users u
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
