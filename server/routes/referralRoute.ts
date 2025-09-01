import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Referral, IReferral } from '../models/Referral';
import { User } from '../models/User';
import { MongoStorage } from '../mongoStorage';
import { IStorage } from '../storage';

const router = Router();
const storage: IStorage = new MongoStorage();

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const referrals = await Referral.find({ referrerId: userId })
      .populate({
        path: 'referredId',
        select: 'name email status role createdAt',
        model: User,
      })
      .sort({ createdAt: -1 })
      .lean();

    const formattedReferrals = referrals.map((referral: IReferral) => ({
      id: referral._id.toString(),
      referredUser: referral.referredId
        ? {
            id: (referral.referredId as any)._id.toString(),
            name: (referral.referredId as any).name,
            email: (referral.referredId as any).email,
            status: (referral.referredId as any).status,
            role: (referral.referredId as any).role,
            signupDate: (referral.referredId as any).createdAt,
          }
        : null,
      type: referral.type,
      status: referral.status,
      rewardAmount: referral.rewardAmount || 0,
      rewardType: referral.rewardType || null,
      organizationId: referral.organizationId ? referral.organizationId.toString() : null,
      createdAt: referral.createdAt,
      updatedAt: referral.updatedAt,
    }));

    return res.json({
      referrals: formattedReferrals,
      total: formattedReferrals.length,
    });
  } catch (error: any) {
    console.error('Fetch referrals error:', error);
    return res.status(500).json({ message: 'Failed to fetch referrals' });
  }
});

export default router;