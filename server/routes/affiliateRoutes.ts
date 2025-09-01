import B2 from "backblaze-b2";
import { Request, Response, Router } from "express";
import { profilePhotoSchema, updateProfileSchema } from "../../shared/schema";
import { authenticate } from "../middleware/auth";
import { upload } from "../middleware/multerConfig";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();
const router = Router();

const b2 = new B2({
  applicationKeyId: process.env.BACKBLAZE_APP_KEY_ID,
  applicationKey: process.env.BACKBLAZE_APP_KEY,
});

router.post(
  "/profile-photo",
  authenticate,
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const file = req.file as Express.Multer.File;

      // Validate file upload
      profilePhotoSchema.parse({ avatar: file });

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      await b2.authorize();
      const bucketId = process.env.BACKBLAZE_BUCKET_ID;
      const bucketName = process.env.BACKBLAZE_BUCKET;

      if (!bucketId || !bucketName) {
        return res.status(500).json({ message: "Backblaze configuration missing" });
      }

      const fileName = `users/${userId}/avatar-${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
      const response = await b2.getUploadUrl({ bucketId });
      const uploadResponse = await b2.uploadFile({
        uploadUrl: response.data.uploadUrl,
        uploadAuthToken: response.data.authorizationToken,
        fileName,
        data: file.buffer,
        contentType: file.mimetype,
      });

      const uploadedFileName = uploadResponse.data.fileName;
      const avatarUrl = `https://f003.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

      await storage.updateUser(userId, { avatar: avatarUrl });

      await storage.createActivity({
        type: "update",
        description: `You updated your profile photo`,
        userId,
        metadata: { avatarUrl },
      });

      return res.status(200).json({
        message: "Profile photo uploaded successfully",
        avatarUrl,
      });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  }
);

router.put(
  '/profile',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const validatedData = updateProfileSchema.parse(req.body);

      // Check if username is provided and unique
      if (validatedData.username) {
        const existingUser = await storage.getUserByEmailOrUsername(validatedData.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
      }

      // Remove undefined or null fields
      const updateData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, value]) => value !== undefined && value !== null)
      );

      await storage.updateUser(userId, updateData);

      // Fetch the updated user
      const updatedUser = await storage.getUser(userId);

      await storage.createActivity({
        type: 'update',
        description: `You updated your profile`,
        userId,
        metadata: { updatedFields: Object.keys(updateData) },
      });

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message || 'Internal server error' });
    }
  }
);

export default router;