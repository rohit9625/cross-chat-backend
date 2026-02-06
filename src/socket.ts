import { Server } from "socket.io";
import { socketAuthMiddleware } from "./middlewares/auth.middleware";
import { AuthSocket, MessagePayload } from "./utils/types";
import { SocketEvent } from "./utils/constants";
import { createMessage } from "./data/message.repository";
import { isUserChatMember, updateChatLastMessageAt } from "./data/chat.repository";

export function initSocket(server: any) {
  const io = new Server(server, {
    connectionStateRecovery: {}
  });

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
        const { chat_id, text } = payload;

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
