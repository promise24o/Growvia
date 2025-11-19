import { Router } from 'express';
import { kycController } from '../controllers/kyc.controller';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/multerConfig';
import { UserRole } from '../../shared/schema';

const router = Router();

router.use(authenticate);

router.get('/status', kycController.getStatus);
router.post('/bvn/verify', kycController.verifyBVN);
router.post('/documents/upload', upload.single('document'), kycController.uploadDocument);
router.post('/selfie/upload', upload.single('selfie'), kycController.uploadSelfie);

router.post('/tier2/approve', authorize([UserRole.ADMIN]), kycController.approveTier2);
router.post('/tier2/reject', authorize([UserRole.ADMIN]), kycController.rejectTier2);

export default router;
