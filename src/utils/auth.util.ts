import jwt, { JwtPayload } from "jsonwebtoken";
import { ENV } from "../config/env";

interface AccessTokenPayload extends JwtPayload {
  userId: number;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, ENV.JWT_SECRET) as AccessTokenPayload;

  if (!payload.userId) {
    throw new Error("Invalid token payload");
  }

  return payload;
}