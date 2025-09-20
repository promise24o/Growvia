// server/routes/application.routes.ts
import { Router } from "express";
import multer from "multer";
import { authenticate, authorize } from "../middleware/auth";
import { appController } from "../controllers/application.controller";
import { UserRole } from "../../shared/schema";

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post("/", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), upload.single('icon'), appController.createApp);
router.get("/organization", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.getOrganizationApps);
router.get("/stats", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.getOrganizationAppStats);
router.get("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.getApp);
router.put("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), upload.single('icon'), appController.updateApp);
router.post("/:id/duplicate", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.duplicateApp);
router.delete("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.deleteApp);

export default router;