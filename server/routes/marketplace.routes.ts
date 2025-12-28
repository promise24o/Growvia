import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { marketplaceController } from "../controllers/marketplace.controller";

const router = Router();

router.get("/campaigns", authenticate, marketplaceController.getMarketplaceCampaigns);
router.get("/campaigns/:id", authenticate, marketplaceController.getCampaignById);
router.get("/recommendations", authenticate, marketplaceController.getRecommendations);
router.post("/campaigns/:id/apply", authenticate, marketplaceController.applyToCampaign);
router.post("/campaigns/:id/save", authenticate, marketplaceController.saveCampaign);
router.post("/campaigns/:id/unsave", authenticate, marketplaceController.unsaveCampaign);
router.get("/saved", authenticate, marketplaceController.getSavedCampaigns);
router.get("/applications", authenticate, marketplaceController.getUserApplications);

export default router;
