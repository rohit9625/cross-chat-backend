import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import { authRateLimiter } from "../middlewares/rate_limit.middleware";

const router = Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);

export default router;
