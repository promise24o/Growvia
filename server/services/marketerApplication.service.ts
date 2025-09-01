import B2 from "backblaze-b2";
import { randomBytes } from "crypto";
import mongoose, { ObjectId } from "mongoose";
import { PLAN_LIMITS, SubscriptionPlan, UserRole } from "../../shared/schema";
import { Organization, User } from "../models";
import { FraudReviewRequest } from "../models/FraudReviewRequest";
import MarketerApplication from "../models/MarketerApplication";
import { MarketerOrganization } from "../models/MarketerOrganization";
import { MongoStorage } from "../mongoStorage";
import emailQueue from "../queue/emailQueue";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();
if (!process.env.BACKBLAZE_APP_KEY_ID || !process.env.BACKBLAZE_APP_KEY || !process.env.BACKBLAZE_BUCKET_ID || !process.env.BACKBLAZE_BUCKET) {
  throw new Error('Missing Backblaze credentials or bucket configuration');
}

const b2 = new B2({
  applicationKeyId: process.env.BACKBLAZE_APP_KEY_ID,
  applicationKey: process.env.BACKBLAZE_APP_KEY,
});

export const inviteMarketer = async (data: any, user: any) => {
  const { name, email, phone } = data;
  if (!name || !email) {
    throw new Error("Name and email are required");
  }
  const organizationId = user.organizationId;
  const userId = user.id;
  if (!organizationId) {
    throw new Error("User is not associated with an organization");
  }
  const existingApplication = await MarketerApplication.findOne({ email });
  if (existingApplication) {
    throw new Error("An application with this email already exists");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("A user with this email already exists");
  }
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }
  const plan = organization.plan as SubscriptionPlan;
  const currentMarketers = await User.countDocuments({
    organizationId,
    role: UserRole.MARKETER,
  });
  if (currentMarketers >= PLAN_LIMITS[plan].marketers) {
    throw new Error(
      `You've reached the maximum number of marketers (${PLAN_LIMITS[plan].marketers}) for your ${plan} plan. Please upgrade your subscription.`
    );
  }
  const applicationToken = randomBytes(32).toString("hex");
  const tokenExpiry = new Date();
  tokenExpiry.setDate(tokenExpiry.getDate() + 7);
  const application = await MarketerApplication.create({
    name,
    email,
    phone: phone || "",
    organizationId,
    invitedBy: userId,
    applicationDate: new Date(),
    status: "invited",
    applicationToken,
    tokenExpiry,
  });
  const origin = "https://www.growviapro.com";
  const invitationUrl = `${origin}/apply/marketer/${applicationToken}`;
  await emailQueue.add({
    type: "invitation",
    application,
    organization,
    invitationUrl,
  });
  await storage.createActivity({
    organizationId,
    userId,
    type: "marketer_invited",
    description: `${user.name || "Admin"} invited ${name} as a marketer`,
  });
  return {
    message: "Invitation queued successfully",
    application: {
      id: application._id,
      name: application.name,
      phone: application.phone,
      email: application.email,
      status: application.status,
      applicationDate: application.applicationDate,
      invitationUrl,
    },
  };
};

export const removeMarketerOrApplication = async (id: string, data: any, user: any) => {
  const { reason = "No reason provided", fraud = false } = data;
  const organizationId = user.organizationId;
  const submittedBy = user.id;
  const actorName = user.name || "Admin";
  if (!organizationId) {
    throw new Error("User not linked to an organization");
  }
  const marketerOrg = await MarketerOrganization.findOne({
    userId: id,
    organizationId,
  });
  const application = await MarketerApplication.findOne({
    _id: id,
    organizationId,
  });
  if (!marketerOrg && !application) {
    throw new Error("Marketer or application not found");
  }
  if (marketerOrg) {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const approvedAt = marketerOrg.approvedAt;
    const activeDuration = approvedAt ? Date.now() - new Date(approvedAt).getTime() : 0;
    if (fraud) {
      const review = await FraudReviewRequest.create({
        marketerId: marketerOrg.userId,
        organizationId,
        submittedBy,
        reason,
      });
      marketerOrg.status = "under_review";
      marketerOrg.reviewRequestId = review._id as mongoose.Types.ObjectId;
      await marketerOrg.save();
      await storage.createActivity({
        organizationId,
        userId: submittedBy,
        type: "fraud_review_requested",
        description: `${actorName} reported affiliate for fraud. Pending admin review.`,
        metadata: {
          marketerId: marketerOrg.userId,
          reason,
        },
      });
      return {
        status: 202,
        message: "Fraud case submitted for review. Action will be taken after admin review.",
      };
    }
    if (activeDuration < THIRTY_DAYS) {
      throw new Error("Marketer must be active for at least 30 days before removal unless for fraud.");
    }
    marketerOrg.status = "revoked";
    marketerOrg.revokedAt = new Date();
    marketerOrg.revokedBy = submittedBy;
    marketerOrg.revocationReason = reason;
    await marketerOrg.save();
    const marketerUser = await User.findById(marketerOrg.userId);
    if (marketerUser?.email) {
      await emailQueue.add({
        type: "marketer_revoked",
        email: marketerUser.email,
        user: marketerUser,
        organizationName: actorName,
        reason,
      });
    }
    await storage.createActivity({
      organizationId,
      userId: submittedBy,
      type: "marketer_revoked",
      description: `${actorName} revoked marketer from this organization`,
      metadata: {
        marketerId: marketerOrg.userId,
        reason,
      },
    });
    return {
      status: 200,
      message: "Marketer revoked successfully.",
    };
  }
  if (application) {
    await MarketerApplication.deleteOne({ _id: id });
    if (application.email) {
      await emailQueue.add({
        type: "application_removed",
        email: application.email,
        name: application.name,
        organizationName: actorName,
        reason,
      });
    }
    await storage.createActivity({
      organizationId,
      userId: submittedBy,
      type: "application_removed",
      description: `${actorName} removed application for ${application.name}`,
      metadata: {
        applicationId: application._id,
        reason,
      },
    });
    return {
      status: 200,
      message: "Application removed successfully.",
    };
  }
};

export const getMarketerApplications = async (user: any, query: any) => {
  const organizationId = user.organizationId;
  const { status, search, socialMedia, skills, page = 1, limit = 20 } = query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;
  let userQuery: any = { organizationId, role: UserRole.MARKETER };
  let applicationQuery: any = { organizationId };
  let marketerOrgQuery: any = { organizationId, status: { $ne: 'revoked' } };
  if (status && ["invited", "pending", "approved", "rejected", "active"].includes(status)) {
    if (status === "active") {
      userQuery.status = "active";
      marketerOrgQuery.status = "approved";
    } else {
      applicationQuery.status = status;
    }
  }
  if (search) {
    const searchRegex = new RegExp(search as string, "i");
    userQuery.$or = [{ name: searchRegex }, { email: searchRegex }];
    applicationQuery.$or = [{ name: searchRegex }, { email: searchRegex }];
  }
  if (socialMedia) {
    userQuery['socialMedia.platform'] = socialMedia;
    applicationQuery['socialMedia.platform'] = socialMedia;
  }
  if (skills) {
    userQuery.skills = { $in: [skills] };
    applicationQuery.skills = { $in: [skills] };
  }
  const users = await User.find(userQuery);
  const allApplications = await MarketerApplication.find(applicationQuery);
  const marketerOrgs = await MarketerOrganization.find(marketerOrgQuery);
  const applicationMap = new Map(
    allApplications.map((app) => [app.email, {
      id: app._id,
      resumeUrl: app.resumeUrl || "",
      kycDocUrl: app.kycDocUrl || "",
      socialMedia: app.socialMedia || {},
      skills: app.skills || [],
      reviewedAt: app.reviewedAt || null,
      reviewNotes: app.reviewNotes || "",
      experience: app.experience || "",
      applicationDate: app.applicationDate,
      status: app.status,
      reviewedBy: app.reviewedBy || null,
      applicationToken: app.applicationToken || null,
      tokenExpiry: app.tokenExpiry || null,
      invitedBy: app.invitedBy || null,
      user: app.user || null,
    }])
  );
  const marketerOrgMap = new Map(
    marketerOrgs.map((mo) => [mo.userId.toString(), {
      status: mo.status,
      appliedAt: mo.appliedAt,
      approvedAt: mo.approvedAt,
      revokedAt: mo.revokedAt,
      revokedBy: mo.revokedBy,
      revocationReason: mo.revocationReason,
      reviewRequestId: mo.reviewRequestId,
    }])
  );
  const userMarketers = users
    .filter((user) => user.role === UserRole.MARKETER)
    .map((user) => {
      const application = applicationMap.get(user.email);
      const marketerOrg = marketerOrgMap.get(user.id);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        status: user.status || "active",
        createdAt: user.createdAt,
        role: user.role,
        source: "user",
        clicks: user.clicks || 0,
        conversions: user.conversions || 0,
        commission: user.commission || 0,
        payoutStatus: user.payoutStatus || "pending",
        assignedApps: user.assignedApps || [],
        socialMedia: user.socialMedia || {},
        skills: user.skills || [],
        application: application || null,
        marketerOrganization: marketerOrg || null,
      };
    });
  const userEmails = new Set(users.map((u) => u.email));
  const applicationMarketers = allApplications
    .filter((app) => !userEmails.has(app.email))
    .map((app) => ({
      id: app._id,
      name: app.name,
      email: app.email,
      phone: app.phone || "",
      status: app.status,
      createdAt: app.applicationDate,
      role: UserRole.MARKETER,
      source: "application",
      clicks: 0, // Application doesn't have these properties
      conversions: 0,
      commission: 0,
      payoutStatus: "pending",
      assignedApps: [],
      socialMedia: app.socialMedia || {},
      skills: app.skills || [],
      application: {
        id: app._id,
        resumeUrl: app.resumeUrl || "",
        kycDocUrl: app.kycDocUrl || "",
        socialMedia: app.socialMedia || {},
        skills: app.skills || [],
        reviewedAt: app.reviewedAt || null,
        reviewNotes: app.reviewNotes || "",
        experience: app.experience || "",
        applicationDate: app.applicationDate,
        status: app.status,
        reviewedBy: app.reviewedBy || null,
        applicationToken: app.applicationToken || null,
        tokenExpiry: app.tokenExpiry || null,
        invitedBy: app.invitedBy || null,
        user: app.user || null,
      },
      marketerOrganization: null,
    }));
  let allMarketers = [...userMarketers, ...applicationMarketers].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const totalItems = allMarketers.length;
  const paginatedMarketers = allMarketers.slice(skip, skip + limitNum);
  const totalPages = Math.ceil(totalItems / limitNum);
  return {
    data: paginatedMarketers,
    pagination: {
      totalItems,
      totalPages,
      currentPage: pageNum,
      itemsPerPage: limitNum,
    },
  };
};

export const getSingleApplication = async (id: string, user: any) => {
  const organizationId = user.organizationId;
  const application = await MarketerApplication.findOne({
    _id: id,
    organizationId,
  });
  if (!application) {
    throw new Error("Application not found");
  }
  return {
    id: application._id,
    name: application.name,
    email: application.email,
    phone: application.phone,
    status: application.status,
    applicationDate: application.applicationDate,
    resumeUrl: application.resumeUrl,
    kycDocUrl: application.kycDocUrl,
    socialMedia: application.socialMedia,
    experience: application.experience,
    skills: application.skills,
    reviewedAt: application.reviewedAt,
    reviewNotes: application.reviewNotes,
  };
};

export const verifyApplicationToken = async (token: string) => {
  const application = await MarketerApplication.findOne({
    applicationToken: token,
    tokenExpiry: { $gt: new Date() },
  });
  if (!application) {
    throw new Error("Invalid or expired invitation");
  }
  const organization = await Organization.findById(application.organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }
  return {
    valid: true,
    application: {
      id: application._id,
      name: application.name,
      email: application.email,
      status: application.status,
      organization: {
        name: organization.name,
        id: organization._id,
      },
    },
  };
};

export const submitApplication = async (token: string, body: any, files: { [fieldname: string]: Express.Multer.File[] }) => {
  const { experience, skills, twitter, instagram, linkedin, facebook } = body;
  const application = await MarketerApplication.findOne({
    applicationToken: token,
    tokenExpiry: { $gt: new Date() },
  });

  if (!application) {
    throw new Error("Application not found or token expired");
  }

  if (application.status !== "invited") {
    throw new Error(`Application is already in '${application.status}' status`);
  }

  application.status = "pending";
  application.experience = experience || null;
  application.skills = skills ? skills.split(",").map((s: string) => s.trim()) : [];
  application.socialMedia = {
    twitter: twitter || undefined,
    instagram: instagram || undefined,
    linkedin: linkedin || undefined,
    facebook: facebook || undefined,
  };

  await b2.authorize();
  const bucketId = process.env.BACKBLAZE_BUCKET_ID!;
  const bucketName = process.env.BACKBLAZE_BUCKET!;

  if (files.resume && files.resume[0]) {
    const resumeFile = files.resume[0];
    const resumeFileName = `organizations/${application.organizationId}/marketers/${application._id}/resume-${Date.now()}-${resumeFile.originalname.replace(/\s+/g, "_")}`;
    const response = await b2.getUploadUrl({ bucketId });
    const uploadResponse = await b2.uploadFile({
      uploadUrl: response.data.uploadUrl,
      uploadAuthToken: response.data.authorizationToken,
      fileName: resumeFileName,
      data: resumeFile.buffer,
      mime: resumeFile.mimetype,
    });
    const uploadedFileName = uploadResponse.data.fileName;
    application.resumeUrl = `https://f003.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
  }

  if (files.kycDocument && files.kycDocument[0]) {
    const kycFile = files.kycDocument[0];
    const kycFileName = `organizations/${application.organizationId}/marketers/${application._id}/kyc-${Date.now()}-${kycFile.originalname.replace(/\s+/g, "_")}`;
    const response = await b2.getUploadUrl({ bucketId });
    const uploadResponse = await b2.uploadFile({
      uploadUrl: response.data.uploadUrl,
      uploadAuthToken: response.data.authorizationToken,
      fileName: kycFileName,
      data: kycFile.buffer,
      mime: kycFile.mimetype,
    });
    const uploadedFileName = uploadResponse.data.fileName;
    application.kycDocUrl = `https://f003.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
  }

  await application.save();

  await storage.createActivity({
    type: "marketer_application_submitted",
    description: `${application.name} submitted their marketer application`,
    organizationId: application.organizationId,
    metadata: { applicationId: application._id },
  });

  return {
    message: "Application submitted successfully",
    application: {
      id: application._id,
      name: application.name,
      email: application.email,
      status: application.status,
    },
  };
};

export const reviewApplication = async (id: string, data: any, user: any) => {
  const { approved, notes } = data;
  const organizationId = user.organizationId;
  const reviewerId = user.id;

  if (approved === undefined) {
    throw new Error("'approved' field is required");
  }

  const application = await MarketerApplication.findOne({
    _id: id,
    organizationId,
    status: "pending",
  });

  if (!application) {
    throw new Error("Application not found or not in pending status");
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }

  application.status = approved ? "approved" : "rejected";
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  application.reviewNotes = notes || "";

  if (approved) {
    const currentMarketers = await User.countDocuments({
      organizationId,
      role: UserRole.MARKETER,
    });

    const planLimit = PLAN_LIMITS[organization.plan as SubscriptionPlan].marketers;
    if (currentMarketers >= planLimit) {
      throw new Error(`You've reached the maximum number of marketers (${planLimit}) for your plan. Please upgrade your subscription.`);
    }

    const tempPassword = randomBytes(8).toString("hex");
    const user = await User.create({
      name: application.name,
      email: application.email,
      password: tempPassword,
      role: UserRole.MARKETER,
      organizationId: application.organizationId,
      status: "active",
    });

    application.user = user._id;
    await emailQueue.add({
      type: "approval",
      application,
      organization,
    });

    await storage.createActivity({
      organizationId,
      userId: reviewerId,
      type: "marketer_approved",
      description: `${user.name || "Admin"} approved ${application.name} as a marketer`,
    });
  } else {
    await emailQueue.add({
      type: "rejection",
      application,
      organization,
      notes,
    });
    await storage.createActivity({
      organizationId,
      userId: reviewerId,
      type: "marketer_rejected",
      description: `${user.name || "Admin"} rejected ${application.name}'s application`,
    });
  }

  await application.save();

  return {
    message: approved ? "Application approved successfully" : "Application rejected",
    application: {
      id: application._id,
      name: application.name,
      email: application.email,
      status: application.status,
      reviewedAt: application.reviewedAt,
    },
  };
};

export const approveApplication = async (id: string, data: any, user: any) => {
  const { reviewNotes } = data;
  const organizationId = user.organizationId;
  const reviewerId = user.id;

  const application = await MarketerApplication.findOne({
    _id: id,
    organizationId,
    status: "pending",
  });

  if (!application) {
    throw new Error("Application not found or not in pending status");
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }

  const existingUser = await User.findOne({
    email: application.email,
    role: UserRole.MARKETER,
  });

  let userId: ObjectId;

  if (existingUser) {
    if (!existingUser.organizationId.includes(organizationId)) {
      existingUser.organizationId = [...existingUser.organizationId, organizationId] as mongoose.Types.ObjectId[];
      await existingUser.save();
    }
    userId = existingUser._id as ObjectId;
    await emailQueue.add({
      type: "approval",
      application,
      organization,
    });
  } else {
    const currentMarketers = await User.countDocuments({
      organizationId,
      role: UserRole.MARKETER,
    });

    const planLimit = PLAN_LIMITS[organization.plan as SubscriptionPlan].marketers;
    if (currentMarketers >= planLimit) {
      throw new Error(`You've reached the maximum number of marketers (${planLimit}) for your plan. Please upgrade your subscription.`);
    }

    const tempPassword = randomBytes(8).toString("hex");
    const user = await User.create({
      name: application.name,
      email: application.email,
      password: tempPassword,
      role: UserRole.MARKETER,
      organizationId: [organizationId],
      status: "active",
    });

    userId = user._id as ObjectId;
    await emailQueue.add({
      type: "approval",
      application,
      organization,
      tempPassword,
    });
  }

  application.status = "approved";
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  application.reviewNotes = reviewNotes || "";
  await application.save();

  await MarketerOrganization.create({
    userId,
    organizationId,
    status: "approved",
    appliedAt: application.applicationDate,
    approvedAt: new Date(),
  });

  await storage.createActivity({
    organizationId,
    userId: reviewerId,
    type: "marketer_approved",
    description: `${user.name || "Admin"} approved ${application.name} as a marketer`,
  });

  return {
    message: "Application approved successfully",
    application: {
      id: application._id,
      name: application.name,
      email: application.email,
      status: "approved",
      reviewedAt: new Date(),
    },
  };
};

export const rejectApplication = async (id: string, data: any, user: any) => {
  const { reviewNotes, applyCoolOff, coolOffDays } = data;
  const organizationId = user.organizationId;
  const reviewerId = user.id;

  const application = await MarketerApplication.findOne({
    _id: id,
    organizationId,
    status: "pending",
  });

  if (!application) {
    throw new Error("Application not found or not in pending status");
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }

  application.status = "rejected";
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  application.reviewNotes = reviewNotes || "";

  if (applyCoolOff && coolOffDays) {
    if (coolOffDays < 7 || coolOffDays > 30) {
      throw new Error("Cool-off period must be between 7 and 30 days");
    }
    const coolOffEndDate = new Date();
    coolOffEndDate.setDate(coolOffEndDate.getDate() + coolOffDays);
    application.coolOffUntil = coolOffEndDate;
  }

  await storage.createActivity({
    organizationId,
    userId: reviewerId,
    type: "marketer_rejected",
    description: `${user.name || "Admin"} rejected ${application.name}'s marketer application`,
  });

  await application.save();

  await emailQueue.add({
    type: "rejection",
    application,
    organization,
    notes: reviewNotes,
    coolOffDays: applyCoolOff ? coolOffDays : null,
  });

  return {
    message: "Application rejected successfully",
    application: {
      id: application._id,
      name: application.name,
      email: application.email,
      status: application.status,
      reviewedAt: application.reviewedAt,
      coolOffUntil: application.coolOffUntil,
    },
  };
};

export const getAllApplications = async (user: any, query: any) => {
  const organizationId = user.organizationId;
  if (!organizationId) {
    throw new Error("Only organization users can view applications");
  }

  const status = query.status as string;
  const email = query.email as string;
  let queryObj: any = { organizationId };

  if (status && ["invited", "pending", "approved", "rejected"].includes(status)) {
    queryObj.status = status;
  }
  if (email) {
    queryObj.email = email;
  }

  const applications = await MarketerApplication.find(queryObj).sort({
    applicationDate: -1,
  });

  return applications.map((app) => ({
    id: app._id,
    name: app.name,
    email: app.email,
    phone: app.phone,
    status: app.status,
    applicationDate: app.applicationDate,
    resumeUrl: app.resumeUrl,
    kycDocUrl: app.kycDocUrl,
    socialMedia: app.socialMedia,
    experience: app.experience,
    skills: app.skills,
    reviewedAt: app.reviewedAt,
    reviewNotes: app.reviewNotes,
  }));
};

export const getApplicationByToken = async (token: string) => {
  if (!token) {
    throw new Error("Application token is required");
  }

  const application = await MarketerApplication.findOne({
    applicationToken: token,
    tokenExpiry: { $gt: new Date() },
  });

  if (!application) {
    throw new Error("Application not found or token expired");
  }

  return {
    id: application._id,
    name: application.name,
    email: application.email,
    phone: application.phone,
    status: application.status,
    organizationId: application.organizationId,
  };
};

export const resendInvite = async (data: any, user: any, req: any) => {
  const { email } = data;
  if (!email) {
    throw new Error("Email is required");
  }

  const userId = user.id;
  const organizationId = user.organizationId;
  const existingApplications = await storage.getMarketerApplications({
    organizationId,
    email,
  });

  if (existingApplications.length === 0) {
    throw new Error("No existing invitation found for this email");
  }

  const application = existingApplications[0];
  if (application.status !== "invited") {
    throw new Error("Cannot resend invite for non-invited application");
  }

  const organization = await storage.getOrganization(organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }

  const origin = req.get("origin") || "https://www.growviapro.com";
  const invitationUrl = `${origin}/auth/apply/marketer/${application.applicationToken}`;

  await emailQueue.add({
    type: "resend_invitation",
    application,
    organization,
    invitationUrl,
  });

  return {
    message: "Invitation resent successfully",
    application,
    inviteLink: invitationUrl,
  };
};

export const getTopMarketers = async (user: any, query: any) => {
  const organizationId = user.organizationId;
  if (!organizationId) {
    throw new Error("No organization associated with this user");
  }

  const limit = parseInt(query.limit as string) || 5;
  return await storage.getTopMarketers(organizationId, limit);
};