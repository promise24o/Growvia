import { Referral, IReferral } from "../models/Referral";
import { User } from "../models/User";

export const getReferrals = async (userId: string) => {
  const referrals = await Referral.find({ referrerId: userId })
    .populate({
      path: "referredId",
      select: "name email status role createdAt",
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

  return {
    referrals: formattedReferrals,
    total: formattedReferrals.length,
  };
};