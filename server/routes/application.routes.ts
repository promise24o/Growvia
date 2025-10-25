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
router.get("/audit-stats", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.getApplicationAuditStats);
router.get("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.getApp);
router.put("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), upload.single('icon'), appController.updateApp);
router.post("/:id/duplicate", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.duplicateApp);
router.delete("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.deleteApp);
router.get("/:id/assets", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.getAppAssets);
router.post("/:id/promo-materials", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), upload.single('file'), appController.uploadPromoMaterial);
router.delete("/:id/promo-materials/:materialId", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.deletePromoMaterial);
// Landing pages
router.post("/:id/landing-pages", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.addLandingPage);
router.delete("/:id/landing-pages/:pageId", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.deleteLandingPage);
router.put("/:id/landing-pages/:pageId/primary", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.setPrimaryLandingPage);
router.put("/:id/app-store-links", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.updateAppStoreLinks);

// Migration endpoint
router.post("/migrate/landing-pages", authenticate, authorize([UserRole.ADMIN]), appController.migrateLegacyLandingPages);

// Audit log endpoints
router.get("/:id/audit-logs", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.getApplicationAuditLogs);
router.get("/:id/audit-logs/export", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), appController.exportApplicationAuditLogs);

export default router;