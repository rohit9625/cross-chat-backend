import { Request, Response } from "express";
import { searchUsersByEmail } from "../data/user.repository";
import { ApiErrorCode } from "../utils/constants";
import { AuthRequest } from "../utils/types";

export async function searchUsers(req: AuthRequest, res: Response) {
  try {
    const currentUserId = req.userId!;
    const email = req.query.email as string;

    if (!email || email.length < 3) {
      return res.json([]);
    }

    const users = await searchUsersByEmail(email, currentUserId);
    return res.json(users);
  } catch (err) {
    console.error('[searchUsers]', err);
    return res.status(500).json({
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
