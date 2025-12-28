import B2 from "backblaze-b2";
import { randomBytes } from "crypto";
import { Request, Response, Router } from "express";
import mongoose, { ObjectId } from "mongoose";
import { FraudReviewRequest } from "../models/FraudReviewRequest";
import { MarketerOrganization } from "../models/MarketerOrganization";
import { PLAN_LIMITS, SubscriptionPlan, UserRole } from "../../shared/schema";
import { authenticate, authorize } from "../middleware/auth";
import { upload } from "../middleware/multerConfig";
import { Organization, User } from "../models";
import MarketerApplication from "../models/MarketerApplication";
import { MongoStorage } from "../mongoStorage";
import emailQueue from "../queue/emailQueue";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();
const router = Router();

const b2 = new B2({
  applicationKeyId: process.env.BACKBLAZE_APP_KEY_ID!,
  applicationKey: process.env.BACKBLAZE_APP_KEY!,
});

router.post(
  "/invite",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { name, email, phone } = req.body;
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      const organizationId = (req as any).user.organizationId;
      const userId = (req as any).user.id;
      if (!organizationId) {
        return res
          .status(400)
          .json({ message: "User is not associated with an organization" });
      }

      const existingApplication = await MarketerApplication.findOne({ email });
      if (existingApplication) {
        return res
          .status(400)
          .json({ message: "An application with this email already exists" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "A user with this email already exists" });
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const plan = organization.plan as keyof typeof PLAN_LIMITS;
      const currentMarketers = await User.countDocuments({
        organizationId,
        role: UserRole.MARKETER,
      });

      if (currentMarketers >= PLAN_LIMITS[plan].marketers) {
        return res.status(403).json({
          message:
            `You've reached the maximum number of marketers (${PLAN_LIMITS[plan].marketers}) for your ${plan} plan. Please upgrade your subscription.`,
        });
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

      const origin = req.get("origin") || "https://www.growviapro.com";
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
        description: `${(req as any).user.name || "Admin"
          } invited ${name} as a marketer`,
      });

      return res.status(201).json({
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
      });
    } catch (error: any) {
      console.error("Error inviting marketer:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);


router.delete(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason = "No reason provided", fraud = false } = req.body;

      const organizationId = (req as any).user.organizationId;
      const submittedBy = (req as any).user.id;
      const actorName = (req as any).user.name || "Admin";

      if (!organizationId) {
        return res.status(400).json({ message: "User not linked to an organization" });
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
        return res.status(404).json({ message: "Marketer or application not found" });
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

          return res.status(202).json({
            message: "Fraud case submitted for review. Action will be taken after admin review.",
          });
        }

        if (activeDuration < THIRTY_DAYS) {
          return res.status(403).json({
            message: "Marketer must be active for at least 30 days before removal unless for fraud.",
          });
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

        return res.status(200).json({ message: "Marketer revoked successfully." });
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

        return res.status(200).json({ message: "Application removed successfully." });
      }
      
      // This should not be reached due to the earlier check, but TypeScript requires it
      throw new Error("Marketer or application not found");
    } catch (error: any) {
      console.error("Error removing marketer or application:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);



router.get(
  "/",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const organizationId = (req as any).user.organizationId;

      const { status, search, socialMedia, skills, page = 1, limit = 20 } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      let userQuery: any = { organizationId, role: UserRole.MARKETER };
      let applicationQuery: any = { organizationId };
      let marketerOrgQuery: any = { organizationId, status: { $ne: 'revoked' } };

      // Filter by status
      if (
        status &&
        ["invited", "pending", "approved", "rejected", "active"].includes(
          status as string
        )
      ) {
        if (status === "active") {
          userQuery.status = "active";
          marketerOrgQuery.status = "approved";
        } else {
          applicationQuery.status = status;
        }
      }

      // Filter by search (name/email)
      if (search) {
        const searchRegex = new RegExp(search as string, "i");
        userQuery.$or = [
          { name: searchRegex },
          { email: searchRegex },
        ];
        applicationQuery.$or = [
          { name: searchRegex },
          { email: searchRegex },
        ];
      }


      // Step 1: Fetch all users first
      const users = await User.find(userQuery);
      // Step 2: Fetch all applications and marketer organizations
      const allApplications = await MarketerApplication.find(applicationQuery).populate('user');
      
            const marketerOrgs = await MarketerOrganization.find(marketerOrgQuery);

      // Create maps for efficient lookup
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
          user: app.user && typeof app.user === 'object' && '_id' in app.user ? {
            id: (app.user as any)._id,
            name: (app.user as any).name,
            username: (app.user as any).username,
            about: (app.user as any).about,
            country: (app.user as any).country,
            state: (app.user as any).state,
            languages: (app.user as any).languages,
            industryFocus: (app.user as any).industryFocus,
            email: (app.user as any).email,
            phone: (app.user as any).phone,
            role: (app.user as any).role,
            organizationId: (app.user as any).organizationId,
            avatar: (app.user as any).avatar,
            status: (app.user as any).status,
            socialMedia: (app.user as any).socialMedia,
            skills: (app.user as any).skills,
            loginNotifications: (app.user as any).loginNotifications,
            createdAt: (app.user as any).createdAt,
            updatedAt: (app.user as any).updatedAt
          } : null,
        }])
      );

      const marketerOrgMap = new Map(
        marketerOrgs.map((mo: any) => [mo.userId.toString(), {
          status: mo.status,
          appliedAt: mo.appliedAt,
          approvedAt: mo.approvedAt,
          revokedAt: mo.revokedAt,
          revokedBy: mo.revokedBy,
          revocationReason: mo.revocationReason,
          reviewRequestId: mo.reviewRequestId,
        }])
      );

      // Step 3: Process users with their applications and marketer organization data
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

      // Step 4: Fetch applications only for emails not in the users table
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
          clicks: 0, // Applications don't have clicks
          conversions: 0, // Applications don't have conversions
          commission: 0, // Applications don't have commission
          payoutStatus: "pending", // Applications don't have payoutStatus
          assignedApps: [], // Applications don't have assignedApps
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
            user: app.user && typeof app.user === 'object' && '_id' in app.user ? {
              id: (app.user as any)._id,
              name: (app.user as any).name,
              username: (app.user as any).username,
              about: (app.user as any).about,
              country: (app.user as any).country,
              state: (app.user as any).state,
              languages: (app.user as any).languages,
              industryFocus: (app.user as any).industryFocus,
              email: (app.user as any).email,
              phone: (app.user as any).phone,
              role: (app.user as any).role,
              organizationId: (app.user as any).organizationId,
              avatar: (app.user as any).avatar,
              status: (app.user as any).status,
              socialMedia: (app.user as any).socialMedia,
              skills: (app.user as any).skills,
              loginNotifications: (app.user as any).loginNotifications,
              createdAt: (app.user as any).createdAt,
              updatedAt: (app.user as any).updatedAt
            } : null,
          },
          marketerOrganization: null,
        }));

      // Step 5: Combine and sort all marketers
      let allMarketers = [...userMarketers, ...applicationMarketers].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Step 6: Apply pagination
      const totalItems = allMarketers.length;
      const paginatedMarketers = allMarketers.slice(skip, skip + limitNum);
      const totalPages = Math.ceil(totalItems / limitNum);

      return res.json({
        data: paginatedMarketers,
        pagination: {
          totalItems,
          totalPages,
          currentPage: pageNum,
          itemsPerPage: limitNum,
        },
      });
    } catch (error: any) {
      console.error("Error fetching marketer applications:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

// Get single application
router.get(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).user.organizationId;

      const application = await MarketerApplication.findOne({
        _id: id,
        organizationId,
      });
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      return res.json({
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
      });
    } catch (error: any) {
      console.error("Error fetching marketer application:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

// Verify application token
router.get("/verify/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const application = await MarketerApplication.findOne({
      applicationToken: token,
      tokenExpiry: { $gt: new Date() },
    });

    if (!application) {
      return res.status(404).json({ message: "Invalid or expired invitation" });
    }

    const organization = await Organization.findById(
      application.organizationId
    );
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    return res.json({
      valid: true,
      application: {
        id: application._id,
        name: application.name,
        email: application.email,
        status: application.status,
        accountCreated: application.accountCreated || false,
        organization: {
          name: organization.name,
          id: organization._id,
        },
      },
    });
  } catch (error: any) {
    console.error("Error verifying application token:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Submit application
router.post(
  "/application/submit/:token",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "kycDocument", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { experience, skills, twitter, instagram, linkedin, facebook, password } =
        req.body;

      const application = await MarketerApplication.findOne({
        applicationToken: token,
        tokenExpiry: { $gt: new Date() },
      });

      if (!application) {
        return res
          .status(404)
          .json({ message: "Application not found or token expired" });
      }

      if (application.status !== "invited") {
        return res.status(400).json({
          message: `Application is already in '${application.status}' status`,
        });
      }

      application.status = "pending";
      application.experience = experience || null;
      application.skills = skills
        ? skills.split(",").map((s: string) => s.trim())
        : [];
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
        const resumeFileName = `organizations/${application.organizationId
          }/marketers/${application._id
          }/resume-${Date.now()}-${resumeFile.originalname.replace(/\s+/g, "_")}`;
        const response = await b2.getUploadUrl({ bucketId });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: resumeFileName,
          data: resumeFile.buffer,
        });
        const uploadedFileName = uploadResponse.data.fileName;
        application.resumeUrl = `https://f003.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
      }

      if (files.kycDocument && files.kycDocument[0]) {
        const kycFile = files.kycDocument[0];
        const kycFileName = `organizations/${application.organizationId
          }/marketers/${application._id
          }/kyc-${Date.now()}-${kycFile.originalname.replace(/\s+/g, "_")}`;
        const response = await b2.getUploadUrl({ bucketId });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: kycFileName,
          data: kycFile.buffer,
        });
        const uploadedFileName = uploadResponse.data.fileName;
        application.kycDocUrl = `https://f003.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
      }

      // Handle account creation if password is provided and account doesn't exist
      if (password && !application.accountCreated && !application.user) {
        // Check if user already exists
        const existingUser = await User.findOne({ email: application.email });
        
        if (!existingUser) {
          // Create new user account
          const tempPassword = randomBytes(8).toString("hex");
          const user = await User.create({
            name: application.name,
            email: application.email,
            password: password || tempPassword,
            phone: application.phone,
            role: UserRole.MARKETER,
            organizationId: application.organizationId,
            status: "active",
          });

          // Link user to application
          application.user = user._id as mongoose.Types.ObjectId;
          application.accountCreated = true;
        } else {
          // User already exists, link to application
          if (!existingUser.organizationId.some(orgId => orgId.toString() === application.organizationId.toString())) {
            existingUser.organizationId = [
              ...existingUser.organizationId,
              application.organizationId,
            ] as mongoose.Types.ObjectId[];
            await existingUser.save();
          }
          application.user = existingUser._id as mongoose.Types.ObjectId;
          application.accountCreated = true;
        }
      }

      await application.save();

      await storage.createActivity({
        type: "marketer_application_submitted",
        description: `${application.name} submitted their marketer application`,
        organizationId: application.organizationId,
        metadata: { applicationId: application._id },
      });

      return res.status(200).json({
        message: "Application submitted successfully",
        application: {
          id: application._id,
          name: application.name,
          email: application.email,
          status: application.status,
        },
      });
    } catch (error: any) {
      console.error("Error submitting marketer application:", error);
      return res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  }
);

// Review application
router.post(
  "/:id/review",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { approved, notes } = req.body;
      const organizationId = (req as any).user.organizationId;
      const reviewerId = (req as any).user.id;

      if (approved === undefined) {
        return res
          .status(400)
          .json({ message: "'approved' field is required" });
      }

      const application = await MarketerApplication.findOne({
        _id: id,
        organizationId,
        status: "pending",
      });

      if (!application) {
        return res
          .status(404)
          .json({ message: "Application not found or not in pending status" });
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
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
          return res.status(403).json({
            message: `You've reached the maximum number of marketers (${planLimit}) for your plan. Please upgrade your subscription.`,
          });
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

        application.user = user._id as mongoose.Types.ObjectId;
        await emailQueue.add({
          type: "approval",
          application,
          organization,
        });

        await storage.createActivity({
          organizationId,
          userId: reviewerId,
          type: "marketer_approved",
          description: `${(req as any).user.name || "Admin"} approved ${application.name
            } as a marketer`,
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
          description: `${(req as any).user.name || "Admin"} rejected ${application.name
            }'s application`,
        });
      }

      await application.save();

      return res.json({
        message: approved
          ? "Application approved successfully"
          : "Application rejected",
        application: {
          id: application._id,
          name: application.name,
          email: application.email,
          status: application.status,
          reviewedAt: application.reviewedAt,
        },
      });
    } catch (error: any) {
      console.error("Error reviewing application:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/approve/:id",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const organizationId = (req as any).user.organizationId;
      const reviewerId = (req as any).user.id;

      const application = await MarketerApplication.findOne({
        _id: id,
        organizationId,
        status: "pending",
      });

      if (!application) {
        return res
          .status(404)
          .json({ message: "Application not found or not in pending status" });
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const existingUser = await User.findOne({
        email: application.email,
        role: UserRole.MARKETER,
      });

      let userId: ObjectId;

      if (existingUser) {
        if (!existingUser.organizationId.includes(organizationId)) {
          existingUser.organizationId = [
            ...existingUser.organizationId,
            organizationId,
          ] as mongoose.Types.ObjectId[];
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

        const planLimit =
          PLAN_LIMITS[organization.plan as SubscriptionPlan].marketers;
        if (currentMarketers >= planLimit) {
          return res.status(403).json({
            message: `You've reached the maximum number of marketers (${planLimit}) for your plan. Please upgrade your subscription.`,
          });
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

      // Create MarketerOrganization record
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
        description: `${(req as any).user.name || "Admin"} approved ${application.name} as a marketer`,
      });

      return res.json({
        message: "Application approved successfully",
        application: {
          id: application._id,
          name: application.name,
          email: application.email,
          status: "approved",
          reviewedAt: new Date(),
        },
      });
    } catch (error: any) {
      console.error("Error approving application:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);


router.post(
  "/reject/:id",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewNotes, applyCoolOff, coolOffDays } = req.body;
      const organizationId = (req as any).user.organizationId;
      const reviewerId = (req as any).user.id;

      const application = await MarketerApplication.findOne({
        _id: id,
        organizationId,
        status: "pending",
      });

      if (!application) {
        return res
          .status(404)
          .json({ message: "Application not found or not in pending status" });
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      application.status = "rejected";
      application.reviewedBy = reviewerId;
      application.reviewedAt = new Date();
      application.reviewNotes = reviewNotes || "";

      if (applyCoolOff && coolOffDays) {
        if (coolOffDays < 7 || coolOffDays > 30) {
          return res.status(400).json({
            message: "Cool-off period must be between 7 and 30 days",
          });
        }
        const coolOffEndDate = new Date();
        coolOffEndDate.setDate(coolOffEndDate.getDate() + coolOffDays);
        application.coolOffUntil = coolOffEndDate;
      }

      await storage.createActivity({
        organizationId,
        userId: reviewerId,
        type: "marketer_rejected",
        description: `${(req as any).user.name || "Admin"} rejected ${application.name
          }'s marketer application`,
      });

      await application.save();

      await emailQueue.add({
        type: "rejection",
        application,
        organization,
        notes: reviewNotes,
        coolOffDays: applyCoolOff ? coolOffDays : null,
      });

      return res.json({
        message: "Application rejected successfully",
        application: {
          id: application._id,
          name: application.name,
          email: application.email,
          status: application.status,
          reviewedAt: application.reviewedAt,
          coolOffUntil: application.coolOffUntil,
        },
      });
    } catch (error: any) {
      console.error("Error rejecting application:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

// Consolidated endpoints removing duplicates
router.get(
  "/applications",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const organizationId = (req as any).user.organizationId;
      if (!organizationId) {
        return res
          .status(403)
          .json({ message: "Only organization users can view applications" });
      }

      const status = req.query.status as string;
      const email = req.query.email as string;
      let query: any = { organizationId };

      if (
        status &&
        ["invited", "pending", "approved", "rejected"].includes(status)
      ) {
        query.status = status;
      }
      if (email) {
        query.email = email;
      }

      const applications = await MarketerApplication.find(query).sort({
        applicationDate: -1,
      });

      return res.status(200).json(
        applications.map((app) => ({
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
        }))
      );
    } catch (error: any) {
      console.error("Error fetching marketer applications:", error);
      return res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  }
);

router.get("/application/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: "Application token is required" });
    }

    const application = await MarketerApplication.findOne({
      applicationToken: token,
      tokenExpiry: { $gt: new Date() },
    });

    if (!application) {
      return res
        .status(404)
        .json({ message: "Application not found or token expired" });
    }

    return res.status(200).json({
      id: application._id,
      name: application.name,
      email: application.email,
      phone: application.phone,
      status: application.status,
      organizationId: application.organizationId,
    });
  } catch (error: any) {
    console.error("Error fetching marketer application:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
});

router.post(
  "/resend-invite",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const userId = (req as any).user.id;
      const organizationId = (req as any).user.organizationId;
      const existingApplications = await storage.getMarketerApplications({
        organizationId,
        email,
      });

      if (existingApplications.length === 0) {
        return res
          .status(404)
          .json({ message: "No existing invitation found for this email" });
      }

      const application = existingApplications[0];
      if (application.status !== "invited") {
        return res.status(400).json({
          message: "Cannot resend invite for non-invited application",
        });
      }

      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      const origin = req.get("origin") || "https://www.growviapro.com";
      const invitationUrl = `${origin}/auth/apply/marketer/${application.applicationToken}`;

      await emailQueue.add({
        type: "resend_invitation",
        application,
        organization,
        invitationUrl,
      });

      return res.status(200).json({
        message: "Invitation resent successfully",
        application,
        inviteLink: invitationUrl,
      });
    } catch (error: any) {
      console.error("Error resending marketer invite:", error);
      return res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  }
);


router.get("/top", authenticate, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    if (!organizationId) {
      return res
        .status(404)
        .json({ message: "No organization associated with this user" });
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const topMarketers = await storage.getTopMarketers(organizationId, limit);

    return res.json(topMarketers);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
