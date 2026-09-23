// middlewares: authenticateToken (same as practice-c) + requireAdmin (NEW)
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_secret";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("Authorization");

  const token =
    authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    res.status(403).json({
      error: "Invalid or expired token.",
    });
  }
};


// NEW: only admins can pass
// ALWAYS put it AFTER authenticateToken, because it reads req.user
//   router.post("/", authenticateToken, requireAdmin, validateResource(...), handler)
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as JwtPayload;   // { userId, email, role, iat, exp }

  if (user.role !== "admin") {
    return res.status(403).json({
      error: "Admins only.",
    });
  }

  next();
};
