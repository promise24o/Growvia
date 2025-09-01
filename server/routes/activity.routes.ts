import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getActivitiesByOrganization } from "../controllers";

const router = Router();

router.get("/", authenticate, getActivitiesByOrganization);

export default router;