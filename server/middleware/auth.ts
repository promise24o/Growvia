import { UserRole } from "@shared/schema";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { handleTrialExpiry } from "../services/subscription";

const JWT_SECRET =
  process.env.JWT_SECRET || "growvia-super-secret-key-change-in-production";

interface JwtPayload {
  userId?: string;
  id?: string;
  sub?: string;
  organizationId?: string | null;
  role?: string;
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
    (req as any).user = {
      id: userId,
      userId: userId,
      organizationId: decoded.organizationId,
      role: decoded.role,
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

// export const generateToken = (user: {
//   id: number;
//   organizationId: number | null;
//   role: string;
// }): string => {
//   const payload = {
//     userId: user.id,
//     organizationId: user.organizationId,
//     role: user.role,
//   };
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
// };
