// server/routes/commission.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { commissionController } from "../controllers/commission.controller";
import { UserRole } from "../../shared/schema";

const router = Router();

router.post("/", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), commissionController.createCommission);
router.get("/organization", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), commissionController.getOrganizationCommissions);
router.get("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), commissionController.getCommission);
router.put("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), commissionController.updateCommission);
router.post("/:id/duplicate", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), commissionController.duplicateCommission);
router.delete("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), commissionController.deleteCommission);

export default router;