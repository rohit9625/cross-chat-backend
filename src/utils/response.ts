import { Response } from "express";
import { ErrorPayload } from "./types";

export function success<T>(res: Response, data: T, status: number = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
  });
}

export function failure(res: Response, error: ErrorPayload, status: number = 500) {
  return res.status(status).json({
    success: false,
    data: null,
    error: error,
  })
}
