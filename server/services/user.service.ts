import B2 from "backblaze-b2";
import { profilePhotoSchema, updateProfileSchema } from "../../shared/schema";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();

const b2 = new B2({
  applicationKeyId: process.env.BACKBLAZE_APP_KEY_ID,
  applicationKey: process.env.BACKBLAZE_APP_KEY,
});

export const uploadProfilePhoto = async (userId: string, file: Express.Multer.File) => {
  profilePhotoSchema.parse({ avatar: file });

  if (!file) {
    throw new Error("No file uploaded");
  }

  await b2.authorize();
  const bucketId = process.env.BACKBLAZE_BUCKET_ID;
  const bucketName = process.env.BACKBLAZE_BUCKET;

  if (!bucketId || !bucketName) {
    throw new Error("Backblaze configuration missing");
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

  return {
    message: "Profile photo uploaded successfully",
    avatarUrl,
  };
};

export const updateProfile = async (userId: string, data: any) => {
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
};