import { Response, NextFunction } from "express";
import { ApiErrorCode } from "../utils/constants";
import { AuthRequest, AuthSocket } from "../utils/types";
import { failure } from "../utils/response";
import { verifyAccessToken } from "../utils/auth.util";
import { ExtendedError } from "socket.io";
import { findUserById } from "../data/user.repository";

function unauthorized(res: Response, message = "Unauthorized") {
  return failure(res, {
    code: ApiErrorCode.UNAUTHORIZED,
    message
  }, 401)
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized(res);
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = verifyAccessToken(token);

    req.userId = payload.userId;
    return next();
  } catch (err) {
    return unauthorized(res, "Invalid or expired token");
  }
}

export async function socketAuthMiddleware(
  socket: AuthSocket,
  next: (err?: ExtendedError) => void
) {
  try {
    const token = socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.userId);
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = payload.userId;
    socket.preferredLanguage = user.preferred_language ?? "en";

    next();
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Authentication failed");
    next(error);
  }
}
