import { Router } from "express";
import { createDirectChat, getAllChats, getChatMessagesHandler } from "../controllers/chat.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post('/', requireAuth, createDirectChat);
router.get('/', requireAuth, getAllChats);

router.get("/:chatId/messages",requireAuth, getChatMessagesHandler);

export default router;
