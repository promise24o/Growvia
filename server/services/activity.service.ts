// services/activity.service.ts
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();

export const getActivitiesByOrganization = async (organizationId: string, limit?: number) => {
  return await storage.getActivitiesByOrganization(organizationId, limit);
};