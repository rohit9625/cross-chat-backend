import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { findUserByEmail, createUser } from "../data/user.repository";
import { ApiErrorCode, AuthErrorCode } from "../utils/constants";

/**
 * Generate a JWT access token
 */
function signAccessToken(userId: number) {
  return jwt.sign({ userId }, ENV.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body as {
      name?: string
      email?: string
      password?: string
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        code: AuthErrorCode.MISSING_FIELDS,
        message: 'Missing required fields'
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        code: AuthErrorCode.USER_ALREADY_EXISTS,
        message: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser(email, name, hashedPassword);
    if (!user) {
      return res.status(500).json({
        code: AuthErrorCode.USER_CREATION_FAILED,
        message: 'Failed to create user',
      });
    }

    return res.status(201).json({
      token: signAccessToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferred_language: user.preferred_language,
      },
    });
  } catch (err) {
    console.error('[register] error:', err);
    return res.status(500).json({
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as {
      email?: string
      password?: string
    }

    if (!email || !password) {
      return res.status(400).json({
        code: AuthErrorCode.MISSING_FIELDS,
        message: 'Missing required fields'
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: "Invalid email or password"
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: "Invalid email or password"
      });
    }

    return res.json({
      token: signAccessToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        preferred_language: user.preferred_language,
      },
    });
  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}

export default { login, register };
