import { Server } from "socket.io";
import { SocketEvent } from "./constants";

let io: Server | null = null;

export function initSocketEmitter(server: Server) {
  io = server;
}

export function emitToChat<T>(
  chatId: number,
  event: SocketEvent,
  payload: T
) {
  if (!io) {
    throw new Error("Socket emitter not initialized");
  }

  io.to(`chat:${chatId}`).emit(event, payload);
}