import { Server } from "socket.io";
import { socketAuthMiddleware } from "./middlewares/auth.middleware";
import { AuthSocket, MessagePayload } from "./utils/types";
import { SocketEvent } from "./utils/constants";
import { createMessage, updateMessage } from "./data/message.repository";
import { getChatMembers, isUserChatMember, updateChatLastMessageAt } from "./data/chat.repository";
import { initSocketEmitter } from "./utils/socket.util";
import { enqueueTranslationJob } from "./data/translation.repository";

export function initSocket(server: any) {
  const io = new Server(server, {
    connectionStateRecovery: {}
  });

  initSocketEmitter(io);

  io.use(socketAuthMiddleware);

  io.on(SocketEvent.CONNECTION, (socket: AuthSocket) => {

    socket.on(SocketEvent.SEND_MESSAGE, async (
      payload: MessagePayload,
      ack?: (response: {
        success: boolean;
        message?: any;
        error?: string;
      }) => void
    ) => {
      try {
        const userId = socket.userId;
        const sourceLanguage = socket.preferredLanguage!;
        const { chat_id, text } = payload;
        // This should come from user preference/settings
        const autoTranslateEnabled = true; // temporarily true

        if (!userId) {
          throw new Error("Unauthorized");
        }

        if (!chat_id || typeof chat_id !== "number") {
          throw new Error("Invalid chatId");
        }

        if (!text || !text.trim()) {
          throw new Error("Empty message");
        }

        const shouldAllowMessage = await isUserChatMember(userId, chat_id);
        if (!shouldAllowMessage) {
          return ack?.({ success: false, error: "Forbidden" });
        }

        const message = await createMessage(chat_id, userId, text.trim());

        if (!message) {
          throw new Error("Internal server error");
        }

        if (autoTranslateEnabled) {
          await updateMessage(message.id, {
            auto_translate: true,
            translation_status: "PENDING",
          });

          const members = await getChatMembers(chat_id);
          const languages = new Set(
            members
              .map(m => m.preferred_language)
              .filter(Boolean)
          );

          for (const lang of languages) {
            if (lang === sourceLanguage) continue;

            await enqueueTranslationJob({
              message_id: message.id,
              chat_id,
              source_language: sourceLanguage,
              target_language: lang ?? "en",
              text: text.trim(),
            });
          }
        }

        await updateChatLastMessageAt(chat_id, message.created_at);

        socket.nsp
          .to(`chat:${chat_id}`)
          .emit(SocketEvent.NEW_MESSAGE, message);


        ack?.({ success: true, message });
      } catch (err: any) {
        console.error(`[${SocketEvent.SEND_MESSAGE}]`, err);
        ack?.({
          success: false,
          error: err.message ?? "Failed to send message",
        });
      }
    });

    socket.on(SocketEvent.JOIN_CHAT, async (chatId: number) => {
      await isUserChatMember(socket.userId!, chatId);
      socket.join(`chat:${chatId}`);
    });

    socket.on(SocketEvent.DISCONNECT, () => {
      // TODO("Update online status of user")
    });
  });

  return io;
}
