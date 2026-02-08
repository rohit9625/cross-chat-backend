import { Response } from "express";
import { searchUsersByEmail, updateUserPreferredLanguage } from "../data/user.repository";
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

export async function updatePreferredLanguage(
  req: AuthRequest,
  res: Response
) {
  try {
    const userId = req.userId!;
    const { preferred_language } = req.body as {
      preferred_language?: string;
    };

    if (!preferred_language) {
      return failure(res, {
        code: ApiErrorCode.INVALID_REQUEST,
        message: "preferred_language is required",
      }, 400);
    }

    // Optional but strongly recommended
    if (preferred_language.length > 10) {
      return failure(res, {
        code: ApiErrorCode.INVALID_REQUEST,
        message: "Invalid language code",
      }, 400);
    }

    const user = await updateUserPreferredLanguage(
      userId,
      preferred_language
    );

    if (!user) {
      return failure(res, {
        code: ApiErrorCode.NOT_FOUND,
        message: "User not found",
      }, 404);
    }

    return success(res, {
      preferred_language: user.preferred_language,
    });

  } catch (err) {
    console.error("[updatePreferredLanguage]", err);
    return failure(res, {
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
}
