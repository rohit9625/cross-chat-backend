import { Router } from "express";
import { searchUsers } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get('/search', requireAuth, searchUsers);

export default router;
