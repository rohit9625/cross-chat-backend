import { Response } from "express";
import { searchUsersByEmail } from "../data/user.repository";
import { ApiErrorCode } from "../utils/constants";
import { AuthRequest } from "../utils/types";
import { failure, success } from "../utils/response";

export async function searchUsers(req: AuthRequest, res: Response) {
  try {
    const currentUserId = req.userId!;
    const email = req.query.email as string;

    if (!email || email.length < 3) {
      return success(res, {users: []});
    }

    const users = await searchUsersByEmail(email, currentUserId);
    return success(res, { users });
  } catch (err) {
    console.error('[searchUsers]', err);
    return failure(res, {
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
