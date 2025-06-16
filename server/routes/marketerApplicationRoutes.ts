import { PLAN_LIMITS, SubscriptionPlan, UserRole } from "@shared/schema";
import B2 from "backblaze-b2";
import { randomBytes } from "crypto";
import { Request, Response, Router } from "express";
import { ObjectId } from "mongoose";
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
  applicationKeyId: process.env.BACKBLAZE_APP_KEY_ID,
  applicationKey: process.env.BACKBLAZE_APP_KEY,
});

// Invite marketer
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

      if (organization.plan === SubscriptionPlan.FREE_TRIAL) {
        const currentMarketers = await User.countDocuments({
          organizationId,
          role: UserRole.MARKETER,
        });

        if (
          currentMarketers >= PLAN_LIMITS[SubscriptionPlan.FREE_TRIAL].marketers
        ) {
          return res.status(403).json({
            message:
              "You've reached the maximum number of marketers for your trial plan. Please upgrade your subscription.",
          });
        }
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

      const baseUrl =
        process.env.NODE_ENV === "production"
          ? `https://${req.get("host")}`
          : `http://localhost:5000`;
      const invitationUrl = `${baseUrl}/apply/marketer/${applicationToken}`;

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
        description: `${
          (req as any).user.name || "Admin"
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
        },
      });
    } catch (error: any) {
      console.error("Error inviting marketer:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

// Get all applications
router.get(
  "/",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const organizationId = (req as any).user.organizationId;
      const { status } = req.query;

      let query: any = { organizationId };
      if (
        status &&
        ["invited", "pending", "approved", "rejected"].includes(
          status as string
        )
      ) {
        query.status = status;
      }

      const users = await storage.getUsersByOrganization(organizationId);
      const approvedMarketers = users
        .filter((user) => user.role === UserRole.MARKETER)
        .map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          createdAt: user.createdAt,
          role: user.role,
          source: "user",
        }));

      const approvedMarketerEmails = approvedMarketers.map((m) => m.email);

      const applications = await MarketerApplication.find({
        ...query,
        email: { $nin: approvedMarketerEmails },
      }).sort({
        applicationDate: -1,
      });

      const invitedMarketers = applications.map((app) => ({
        id: app._id,
        name: app.name,
        email: app.email,
        phone: app.phone,
        status: app.status,
        createdAt: app.applicationDate,
        role: UserRole.MARKETER,
        resumeUrl: app.resumeUrl,
        kycDocUrl: app.kycDocUrl,
        socialMedia: app.socialMedia,
        experience: app.experience,
        skills: app.skills,
        reviewedAt: app.reviewedAt,
        reviewNotes: app.reviewNotes,
        source: "application",
      }));

      const allMarketers = [...approvedMarketers, ...invitedMarketers].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return res.json(allMarketers);
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
  "/application/:token/submit",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "kycDocument", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { experience, skills, twitter, instagram, linkedin, facebook } =
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
      const bucketId = process.env.BACKBLAZE_BUCKET_ID;
      const bucketName = process.env.BACKBLAZE_BUCKET;

      if (files.resume && files.resume[0]) {
        const resumeFile = files.resume[0];
        const resumeFileName = `organizations/${
          application.organizationId
        }/marketers/${
          application._id
        }/resume-${Date.now()}-${resumeFile.originalname.replace(/\s+/g, "_")}`;
        const response = await b2.getUploadUrl({ bucketId });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: resumeFileName,
          data: resumeFile.buffer,
          contentType: resumeFile.mimetype,
        });
        const uploadedFileName = uploadResponse.data.fileName;
        application.resumeUrl = `https://f003.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;
      }

      if (files.kycDocument && files.kycDocument[0]) {
        const kycFile = files.kycDocument[0];
        const kycFileName = `organizations/${
          application.organizationId
        }/marketers/${
          application._id
        }/kyc-${Date.now()}-${kycFile.originalname.replace(/\s+/g, "_")}`;
        const response = await b2.getUploadUrl({ bucketId });
        const uploadResponse = await b2.uploadFile({
          uploadUrl: response.data.uploadUrl,
          uploadAuthToken: response.data.authorizationToken,
          fileName: kycFileName,
          data: kycFile.buffer,
          contentType: kycFile.mimetype,
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

        application.user = user._id as ObjectId;
        await emailQueue.add({
          type: "approval",
          application,
          organization,
        });

        await storage.createActivity({
          organizationId,
          userId: reviewerId,
          type: "marketer_approved",
          description: `${(req as any).user.name || "Admin"} approved ${
            application.name
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
          description: `${(req as any).user.name || "Admin"} rejected ${
            application.name
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
  "/:id/approve",
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

      application.status = "approved";
      application.reviewedBy = reviewerId;
      application.reviewedAt = new Date();
      application.reviewNotes = reviewNotes || "";

      const existingUser = await User.findOne({
        email: application.email,
        role: UserRole.MARKETER,
      });

      if (existingUser) {
        // Add the new organizationId to the existing user's organizationId array
        if (!existingUser.organizationId.includes(organizationId)) {
          existingUser.organizationId = [
            ...existingUser.organizationId,
            organizationId,
          ] as mongoose.Types.ObjectId[];
          await existingUser.save();
        }
        application.user = existingUser._id as ObjectId;
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

        application.user = user._id as ObjectId;
        await emailQueue.add({
          type: "approval",
          application,
          organization,
          tempPassword,
        });
      }

      await storage.createActivity({
        organizationId,
        userId: reviewerId,
        type: "marketer_approved",
        description: `${(req as any).user.name || "Admin"} approved ${
          application.name
        } as a marketer`,
      });

      await application.save();

      return res.json({
        message: "Application approved successfully",
        application: {
          id: application._id,
          name: application.name,
          email: application.email,
          status: application.status,
          reviewedAt: application.reviewedAt,
        },
      });
    } catch (error: any) {
      console.error("Error approving application:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);


router.post(
  "/:id/reject",
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
        description: `${(req as any).user.name || "Admin"} rejected ${
          application.name
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
      console.log("I made it here");
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

      const baseUrl =
        process.env.NODE_ENV === "production"
          ? `https://${req.get("host")}`
          : `http://localhost:5000`;
      const invitationUrl = `${baseUrl}/apply/marketer/${application.applicationToken}`;

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
