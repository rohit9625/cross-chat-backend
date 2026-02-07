import { pool } from "../config/database";
import { Chat, ChatMember, ChatWithMembers } from "../models/chat.model";
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

export async function getUserChatsWithMembers(userId: number): Promise<ChatWithMembers[]> {
  const { rows } = await pool.query<ChatWithMembers>(
    `
    SELECT
      c.id,
      c.type,
      c.last_message_at,
      c.created_at,

      json_agg(
        json_build_object(
          'user_id', u.id,
          'name', u.name,
          'email', u.email
        )
        ORDER BY u.name
      ) AS members

    FROM chats c
    JOIN chat_members cm_self
      ON cm_self.chat_id = c.id
      AND cm_self.user_id = $1

    JOIN chat_members cm_all
      ON cm_all.chat_id = c.id

    JOIN users u
      ON u.id = cm_all.user_id

    GROUP BY c.id
    ORDER BY c.last_message_at DESC
    `,
    [userId]
  );

  return rows;
}

export async function getChatMembers(chatId: number): Promise<ChatMember[]> {
  const { rows } = await pool.query<ChatMember>(
    `
    SELECT
      u.id as user_id,
      u.name,
      u.email,
      u.preferred_language
    FROM chat_members cm
    JOIN users u
      ON cm.user_id = u.id
      AND cm.chat_id = $1
    `,
    [chatId]
  );
  return rows;
}

export async function isUserChatMember(
  userId: number,
  chatId: number
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `
    SELECT 1
    FROM chat_members
    WHERE user_id = $1 AND chat_id = $2
    LIMIT 1
    `,
    [userId, chatId]
  );

  return !!rowCount;
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

export async function updateChatLastMessageAt(
  chatId: number,
  timestamp: string,
): Promise<void> {
  await pool.query(
    `
    UPDATE chats
    SET last_message_at = $2
    WHERE id = $1
    `,
    [chatId, timestamp]
  );
}
