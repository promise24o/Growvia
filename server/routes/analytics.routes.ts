import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getOrganizationStats, getUserStats } from "../controllers";

const router = Router();

router.get("/organization", authenticate, getOrganizationStats);
router.get("/user", authenticate, getUserStats);

export default router;