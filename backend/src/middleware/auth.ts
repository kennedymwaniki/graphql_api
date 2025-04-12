import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils";

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Get the token from the header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN format

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = { id: payload.userId };
    }
  }

  next();
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};
