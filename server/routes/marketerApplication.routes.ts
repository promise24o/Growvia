// routes/marketerApplication.routes.ts
import { Router } from "express";
import { UserRole } from "../../shared/schema";
import {
    approveApplication,
    getAllApplications,
    getApplicationByToken,
    getMarketerApplications,
    getSingleApplication,
    getTopMarketers,
    inviteMarketer,
    rejectApplication,
    removeMarketerOrApplication,
    resendInvite,
    reviewApplication,
    submitApplication,
    verifyApplicationToken,
} from "../controllers";
import { authenticate, authorize } from "../middleware/auth";
import { upload } from "../middleware/multerConfig";

const router = Router();

router.post("/invite", authenticate, authorize([UserRole.ADMIN]), inviteMarketer);
router.delete("/:id", authenticate, authorize([UserRole.ADMIN]), removeMarketerOrApplication);
router.get("/", authenticate, authorize([UserRole.ADMIN]), getMarketerApplications);
router.get("/:id", authenticate, authorize([UserRole.ADMIN]), getSingleApplication);
router.get("/verify/:token", verifyApplicationToken);
router.post("/application/submit/:token", upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "kycDocument", maxCount: 1 },
]), submitApplication);
router.post("/:id/review", authenticate, authorize([UserRole.ADMIN]), reviewApplication);
router.post("/approve/:id", authenticate, authorize([UserRole.ADMIN]), approveApplication);
router.post("/reject/:id", authenticate, authorize([UserRole.ADMIN]), rejectApplication);
router.get("/applications", authenticate, getAllApplications);
router.get("/application/:token", getApplicationByToken);
router.post("/resend-invite", authenticate, authorize([UserRole.ADMIN]), resendInvite);
router.get("/top", authenticate, getTopMarketers);

export default router;