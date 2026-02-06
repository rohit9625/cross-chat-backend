import { pool } from "../config/database";
import { Message } from "../models/message.model";

export async function getChatMessages(chatId: number): Promise<Message[]> {
  const { rows } = await pool.query<Message>(
    `
    SELECT
      m.sender_id,
      m.content,
      m.created_at
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
