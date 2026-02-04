import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { ApiErrorCode } from "../utils/constants";

export const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,

  handler: (_req: Request, res: Response) => {
    return res.status(429).json({
      code: ApiErrorCode.TOO_MANY_REQUESTS,
      message: "Too many requests. Please try again later."
    });
  }
});

