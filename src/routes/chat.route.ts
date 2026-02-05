import { Router } from "express";
import { createDirectChat, getAllChats } from "../controllers/chat.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post('/', requireAuth, createDirectChat);
router.get('/', requireAuth, getAllChats);

export default router;
