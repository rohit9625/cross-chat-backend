import { pool } from "../config/database";
import { User } from "../models/user.model";


/**
 * Insert a new user record in the database with provided details.
 *
 * @param email - Unique email address of the user
 * @param name - Display name of the user
 * @param password - Hashed password to be stored in the database
 *
 * @returns The created {@link User} object if insertion succeeds, `null` otherwise
 */
export async function createUser(
  email: string,
  name: string,
  password: string,
): Promise<User | null> {
  const { rows } = await pool.query<User>(
    `
    INSERT INTO users (email, name, password)
    VALUES ($1, $2, $3)
    RETURNING id, email, name, preferred_language, created_at AS "createdAt"
    `,
    [email, name, password]
  );

  return rows[0] ?? null;
}

/**
 * Finds a user by their email address.
 *
 * @param email - Email address of the user to search for
 * @returns The matching {@link User} if found, otherwise `null`
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query<User>(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  )

  return rows[0] ?? null;
}

/**
 * Finds a user by it's id address.
 *
 * @param userId - id of the user to search for
 * @returns The matching {@link User} if found, otherwise `null`
 */
export async function findUserById(userId: number): Promise<User | null> {
  const { rows } = await pool.query<User>(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  )

  return rows[0] ?? null;
}

/**
 * Finds a user by their email address.
 *
 * @param email - Email address of the user to search for
 * @param excludeUserId - ID of the current user who is searching
 * @returns The matching {@link User} if found, otherwise `null`
 */
export async function searchUsersByEmail(
  email: string,
  excludeUserId: number
): Promise<User[]> {
  const { rows } = await pool.query<User>(
    `
    SELECT id, name, email, preferred_language
    FROM users
    WHERE email ILIKE $1
      AND id != $2
    LIMIT 10
    `,
    [`${email}%`, excludeUserId]
  );
  return rows;
}

export async function updateUserPreferredLanguage(
  userId: number,
  preferredLanguage: string
): Promise<User | null> {
  const { rows } = await pool.query<User>(
    `
    UPDATE users
    SET preferred_language = $2
    WHERE id = $1
    RETURNING
      id,
      email,
      name,
      preferred_language,
      created_at
    `,
    [userId, preferredLanguage]
  );

  return rows[0] ?? null;
}

/**
 * Delete a user from the database
 * 
 * @param userId - ID of the user to be deleted
 * @returns `true` if exactly one user was deleted, otherwise `false`
 */
export async function deleteUser(
  userId: number
): Promise<boolean> {
  const {rowCount} = await pool.query(
    `DELETE FROM users WHERE id = $1`,
    [userId]
  );

  return rowCount === 1;
}
