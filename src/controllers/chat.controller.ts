import { Response } from "express";
import {
  getUserChats,
  getChatMembers,
  findOrCreateDirectChat
} from "../data/chat.repository";
import { ApiErrorCode, AuthErrorCode } from "../utils/constants";
import { AuthRequest } from "../utils/types";
import { findUserByEmail } from "../data/user.repository";


export async function createDirectChat(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({
      code: AuthErrorCode.MISSING_FIELDS,
      message: "Missing required fields",
    });
  }

  const targetUser = await findUserByEmail(email);

  if (!targetUser) {
    return res.status(404).json({
      code: AuthErrorCode.USER_NOT_FOUND,
      message: "User not found",
    });
  }

  if (targetUser.id === userId) {
    return res.status(409).json({
      code: ApiErrorCode.INVALID_REQUEST,
      message: "Cannot create chat with yourself",
    });
  }

  try {
    const chat = await findOrCreateDirectChat(userId, targetUser.id);
    const members = await getChatMembers(chat!.id);

    return res.json({ chat, members });

  } catch (err) {
    console.error('[createDirectChat]', err);
    return res.status(500).json({
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
}

export async function getAllChats(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const chats = await getUserChats(userId);
    return res.json(chats);
  } catch (err) {
    console.error('[listChats]', err);
    return res.status(500).json({
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
}
