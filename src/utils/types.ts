import { Request } from "express";
import { ApiErrorCode, AuthErrorCode } from "./constants";

export interface AuthRequest extends Request {
  userId?: number;
}

export interface ErrorPayload {
  code: ApiErrorCode | AuthErrorCode;
  message: string;
}