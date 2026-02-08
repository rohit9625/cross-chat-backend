import { Response } from "express";
import {
  getChatMembers,
  findOrCreateDirectChat,
  getUserChatsWithMembers,
  isUserChatMember
} from "../data/chat.repository";
import { ApiErrorCode, AuthErrorCode } from "../utils/constants";
import { AuthRequest } from "../utils/types";
import { findUserByEmail } from "../data/user.repository";
import { failure, success } from "../utils/response";
import { getChatMessages, getChatMessagesWithTranslation} from "../data/message.repository";

export async function createDirectChat(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const { email } = req.body as { email?: string };

  if (!email) {
    return failure(res, {
      code: ApiErrorCode.INVALID_REQUEST,
      message: "Missing required fields"
    }, 400);
  }

  const targetUser = await findUserByEmail(email);

  if (!targetUser) {
    return failure(res, {
      code: AuthErrorCode.USER_NOT_FOUND,
      message: "User not found"
    }, 404);
  }

  if (targetUser.id === userId) {
    return failure(res, {
      code: ApiErrorCode.INVALID_REQUEST,
      message: "Cannot create chat with yourself"
    }, 409);
  }

  try {
    const chat = await findOrCreateDirectChat(userId, targetUser.id);
    const members = await getChatMembers(chat!.id);

    return success(res, {
      ...chat,
      members,
      last_message: null,
    });
  } catch (err) {
    console.error('[createDirectChat]', err);
    return failure(res, {
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
}

export async function getAllChats(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const chats = await getUserChatsWithMembers(userId);

    const chatsWithMessages = await Promise.all(
      chats.map(async (chat) => {
        const messages = await getChatMessages(chat.id);
        return {
          ...chat,
          last_message: messages[0] ?? null,
        };
      })
    );

    return success(res, {
      chats: chatsWithMessages,
    });
  } catch (err) {
    console.error('[listChats]', err);
    return failure(res, {
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
}

export async function getChatMessagesHandler(
  req: AuthRequest,
  res: Response
) {
  try {
    const chatId = Number(req.params.chatId);
    const preferredLanguage = req.preferredLanguage ?? "en"; // Default to english

    if (Number.isNaN(chatId)) {
      return res.status(400).json({ message: "Invalid chatId" });
    }

    const isMember = await isUserChatMember(req.userId!, chatId);
    if (!isMember) {
      return failure(res, {
        code: ApiErrorCode.FORBIDDEN,
        message: "You are not a member of this chat",
      }, 403);
    }

    const messages = await getChatMessagesWithTranslation(chatId, preferredLanguage);

    return success(res, { messages }, 200);

  } catch (err) {
    console.error('[listChats]', err);
    return failure(res, {
      code: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
}
