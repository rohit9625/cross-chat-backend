import { Router } from "express";
import { searchUsers, updatePreferredLanguage } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get('/search', requireAuth, searchUsers);
router.patch("/me/language", requireAuth, updatePreferredLanguage);

export default router;
