import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { upload } from "../middleware/multerConfig";
import { uploadProfilePhoto, updateProfile } from "../controllers";

const router = Router();

router.post("/profile-photo", authenticate, upload.single("avatar"), uploadProfilePhoto);
router.put("/profile", authenticate, updateProfile);

export default router;