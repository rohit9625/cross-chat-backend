import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ENV } from "../config/env";
import { ApiErrorCode } from "../utils/constants";
import { AuthRequest } from "../utils/types";

interface AccessTokenPayload extends JwtPayload {
  userId: number;
}

function unauthorized(res: Response, message = "Unauthorized") {
  return res.status(401).json({
    code: ApiErrorCode.UNAUTHORIZED,
    message
  });
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
    const payload = jwt.verify(
      token,
      ENV.JWT_SECRET
    ) as AccessTokenPayload;

    if (!payload.userId) {
      return unauthorized(res, "Invalid token payload");
    }

    req.userId = payload.userId;
    return next();
  } catch (err) {
    return unauthorized(res, "Invalid or expired token");
  }
}
