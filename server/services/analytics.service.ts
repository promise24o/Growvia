import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();

export const getOrganizationStats = async (organizationId: string) => {
  return await storage.getOrganizationStats(organizationId);
};

export const getUserStats = async (userId: string) => {
  return await storage.getUserStats(userId);
};