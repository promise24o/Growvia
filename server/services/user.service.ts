// server/services/profile.service.ts
import { z } from "zod";
import { IStorage } from "../storage";
import { MongoStorage } from "../mongoStorage";
import { fileService } from "./file.service";
import { updateProfileSchema } from "../../shared/schema";

const storage: IStorage = new MongoStorage();

const profilePhotoSchema = z.object({
  file: z.any().refine((file) => file !== undefined, {
    message: "File is required",
  }),
});

export class ProfileService {
  async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
    profilePhotoSchema.parse({ file });

    const avatarUrl = await fileService.uploadFile(file, {
      userId,
      bucketFolder: "users",
      fileNamePrefix: "avatar",
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["image/png", "image/jpeg", "image/jpg"],
      activityDescription: "You updated your profile photo",
      updateEntity: {
        entityId: userId,
        field: "avatar",
        updateFn: storage.updateUser.bind(storage),
      },
    });

    return {
      message: "Profile photo uploaded successfully",
      avatarUrl,
    };
  }

  async updateProfile(userId: string, data: any) {
    const validatedData = updateProfileSchema.parse(data);

    if (validatedData.username) {
      const existingUser = await storage.getUserByEmailOrUsername(validatedData.username);
      if (existingUser && existingUser.id !== userId) {
        throw new Error("Username is already taken");
      }
    }

    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== undefined && value !== null)
    );

    await storage.updateUser(userId, updateData);
    const updatedUser = await storage.getUser(userId);

    await storage.createActivity({
      type: "update",
      description: `You updated your profile`,
      userId,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return {
      message: "Profile updated successfully",
      user: updatedUser,
    };
  }
}

export const profileService = new ProfileService();