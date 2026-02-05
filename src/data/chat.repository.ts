import { pool } from "../config/database";
import { Chat, ChatMember } from "../models/chat.model";
import { ChatType, MemberRole } from "../utils/constants";

export async function findOrCreateDirectChat(
  firstUser: number,
  secondUser: number
): Promise<Chat | null> {

  if (firstUser === secondUser) {
    throw new Error("Cannot create direct chat with self");
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query<Chat>(
      `
      SELECT c.*
      FROM chats c
      JOIN chat_members cm1 ON cm1.chat_id = c.id
      JOIN chat_members cm2 ON cm2.chat_id = c.id
      WHERE c.type = $1
        AND cm1.user_id = $2
        AND cm2.user_id = $3
      FOR UPDATE
      `,
      [ChatType.DIRECT, firstUser, secondUser]
    );

    if (rows.length > 0) {
      await client.query('COMMIT');
      return rows[0] ??  null;
    }

    const chatRes = await client.query<Chat>(
      `
      INSERT INTO chats (type, last_message_at)
      VALUES ($1, NOW())
      RETURNING *
      `,
      [ChatType.DIRECT]
    );

    const chat = chatRes.rows[0];

    await client.query(
      `
      INSERT INTO chat_members (chat_id, user_id)
      VALUES ($1, $2), ($1, $3)
      `,
      [chat!.id, firstUser, secondUser]
    );

    await client.query('COMMIT');
    return chat ?? null;

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function findDirectChat(firstUser: number, secondUser: number): Promise<Chat | null> {
  const { rows } = await pool.query<Chat>(
    `
    SELECT c.*
    FROM chats c
    JOIN chat_members cm1 ON cm1.chat_id = c.id
    JOIN chat_members cm2 ON cm2.chat_id = c.id
    WHERE c.type = 'DIRECT'
      AND cm1.user_id = $1
      AND cm2.user_id = $2
    `,
    [firstUser, secondUser]
  );
  return rows[0] ?? null;
}

export async function getUserChats(userId: number): Promise<Chat[] | null> {
  const { rows } = await pool.query<Chat>(
    `
    SELECT c.*
    FROM chats c
    JOIN chat_members cm ON cm.chat_id = c.id
    WHERE cm.user_id = $1
    ORDER BY c.last_message_at DESC
    `,
    [userId]
  );
  return rows;
}

export async function getChatMembers(chatId: number): Promise<ChatMember[]> {
  const { rows } = await pool.query<ChatMember>(
    `
    SELECT *
    FROM chat_members
    WHERE chat_id = $1
    `,
    [chatId]
  );
  return rows;
}

export async function addChatMember(
  chatId: number,
  userId: number,
  role: MemberRole = MemberRole.MEMBER,
): Promise<ChatMember | null> {
  const {rows} = await pool.query<ChatMember>(
    `
    INSERT INTO chat_members (chat_id, user_id, role)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [chatId, userId, role]
  );

  return rows[0] ?? null;
}
