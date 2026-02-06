import { pool } from "../config/database";
import { Message } from "../models/message.model";

export async function getChatMessages(chatId: number): Promise<Message[]> {
  const { rows } = await pool.query<Message>(
    `
    SELECT m.*
    FROM messages m
    JOIN chats c
      ON c.id = m.chat_id
    WHERE c.id = $1
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
): Promise<Message | null> {
  const {rows} = await pool.query<Message>(
    `
    INSERT INTO
      messages (chat_id, sender_id, content)
    VALUES
      ($1, $2, $3)
    RETURNING *
    `,
    [chatId, senderId, content]
  );

  return rows[0] ?? null;
}
