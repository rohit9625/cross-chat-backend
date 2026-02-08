import { Request } from "express";
import { ApiErrorCode, AuthErrorCode } from "./constants";
import { Socket } from "socket.io";

export interface AuthRequest extends Request {
  userId?: number;
  preferredLanguage?: string;
}

export interface AuthSocket extends Socket {
  userId?: number;
  preferredLanguage?: string;
}

export interface ErrorPayload {
  code: ApiErrorCode | AuthErrorCode;
  message: string;
}

export interface MessagePayload {
  chat_id: number;
  text: string;
}