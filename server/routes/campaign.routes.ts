// server/routes/campaign.routes.ts
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { campaignController } from "../controllers/campaign.controller";
import { UserRole } from "../../shared/schema";

const router = Router();

// Campaign CRUD operations (Admin & Management only)
router.post("/", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), campaignController.createCampaign);
router.get("/organization", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), campaignController.getOrganizationCampaigns);
router.get("/stats", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), campaignController.getOrganizationCampaignStats);
router.get("/public", campaignController.getPublicCampaigns); // Public endpoint for marketers to browse
router.get("/application/:applicationId", authenticate, campaignController.getCampaignsByApplication);
router.get("/:id", authenticate, campaignController.getCampaign);
router.put("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), campaignController.updateCampaign);
router.post("/:id/duplicate", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), campaignController.duplicateCampaign);
router.delete("/:id", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), campaignController.deleteCampaign);

// Campaign status management (Admin & Management only)
router.patch("/:id/pause", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), campaignController.pauseCampaign);
router.patch("/:id/resume", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), campaignController.resumeCampaign);
router.patch("/:id/complete", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), campaignController.completeCampaign);
router.patch("/:id/archive", authenticate, authorize([UserRole.ADMIN, UserRole.MANAGEMENT]), campaignController.archiveCampaign);

export default router;
