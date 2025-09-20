import B2 from "backblaze-b2";
import { IStorage } from "../storage";
import { MongoStorage } from "../mongoStorage";
import { z } from "zod";

const storage: IStorage = new MongoStorage();

const b2 = new B2({
  applicationKeyId: process.env.BACKBLAZE_APP_KEY_ID,
  applicationKey: process.env.BACKBLAZE_APP_KEY,
});

const uploadSchema = z.object({
  file: z.any().refine((file) => file !== undefined, {
    message: "File is required",
  }),
});

interface UploadOptions {
  userId?: string;
  bucketFolder: string;
  fileNamePrefix?: string;
  maxSize?: number;
  allowedTypes?: string[];
  activityDescription?: string;
  updateEntity?: {
    entityId: string;
    field: string;
    updateFn: (id: string, data: any) => Promise<any>;
  };
}

export class FileService {
  private async initializeB2() {
    try {
      await b2.authorize();
    } catch (error) {
      throw new Error(`Backblaze authorization failed: ${error.message}`);
    }
  }

  private validateFile(file: Express.Multer.File, options: UploadOptions) {
    uploadSchema.parse({ file });

    if (!file) {
      throw new Error("No file provided");
    }

    if (options.maxSize && file.size > options.maxSize) {
      throw new Error(`File size exceeds ${options.maxSize / (1024 * 1024)}MB limit`);
    }

    if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${options.allowedTypes.join(", ")}`);
    }
  }

  private generateFileName(file: Express.Multer.File, options: UploadOptions): string {
    const prefix = options.fileNamePrefix || "file";
    const sanitizedOriginalName = file.originalname.replace(/\s+/g, "_");
    return `${options.bucketFolder}/${options.userId || "anonymous"}/${prefix}-${Date.now()}-${sanitizedOriginalName}`;
  }

  async uploadFile(file: Express.Multer.File, options: UploadOptions): Promise<string> {
    const {
      userId,
      bucketFolder,
      fileNamePrefix,
      maxSize = 5 * 1024 * 1024, // Default 5MB
      allowedTypes = ["image/png", "image/jpeg", "image/jpg"],
      activityDescription,
      updateEntity,
    } = options;

    this.validateFile(file, { maxSize, allowedTypes });

    await this.initializeB2();

    const bucketId = process.env.BACKBLAZE_BUCKET_ID;
    const bucketName = process.env.BACKBLAZE_BUCKET;

    if (!bucketId || !bucketName) {
      throw new Error("Backblaze configuration missing");
    }

    const fileName = this.generateFileName(file, { bucketFolder, userId, fileNamePrefix });

    const response = await b2.getUploadUrl({ bucketId });
    const uploadResponse = await b2.uploadFile({
      uploadUrl: response.data.uploadUrl,
      uploadAuthToken: response.data.authorizationToken,
      fileName,
      data: file.buffer,
      contentType: file.mimetype,
    });

    const uploadedFileName = uploadResponse.data.fileName;
    const fileUrl = `https://f003.backblazeb2.com/file/${bucketName}/${uploadedFileName}`;

    if (updateEntity && userId) {
      await updateEntity.updateFn(updateEntity.entityId, { [updateEntity.field]: fileUrl });
    }

    if (userId && activityDescription) {
      await storage.createActivity({
        type: "upload",
        description: activityDescription,
        userId,
        metadata: { fileUrl, fileName: uploadedFileName },
      });
    }

    return fileUrl;
  }
}

export const fileService = new FileService();