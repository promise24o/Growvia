import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { UserSession } from "../models/UserSession";
import { handleTrialExpiry } from "../services/subscription.service";
import { UserRole } from "../../shared/schema";

const JWT_SECRET =
  process.env.JWT_SECRET || "growvia-super-secret-key-change-in-production";

interface JwtPayload {
  userId?: string;
  id?: string;
  sub?: string;
  organizationId?: string | null;
  role?: string;
  sessionId?: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const userId = decoded.userId || decoded.id || decoded.sub;
    const sessionId = decoded.sessionId;

    const session = await UserSession.findOne({ token });
    if (!session) {
      return res.status(401).json({ message: "Session not found" });
    }

    const user = await User.findById(userId).select('name username email');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    (req as any).user = {
      id: userId,
      userId: userId,
      organizationId: decoded.organizationId,
      role: decoded.role,
      sessionId: sessionId,
      name: user.name,
      email: user.email,
      username: user.username,
    };

    if (decoded.organizationId && decoded.role === UserRole.ADMIN) {
      await handleTrialExpiry(decoded.organizationId);
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};

export const requireManagement = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (user.role !== UserRole.MANAGEMENT) {
    return res.status(403).json({ message: "Management access required" });
  }
  next();
};
