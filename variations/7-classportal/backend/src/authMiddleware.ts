// middlewares: authenticateToken (same as practice-c) + requireTeacher / requireStudent (NEW)
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


// NEW: the token says WHICH KIND of account logged in: { userId, name, type: "teacher" | "student" }
// ALWAYS put these AFTER authenticateToken (they read req.user)

export const requireTeacher = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as JwtPayload;

  if (user.type !== "teacher") {
    return res.status(403).json({
      error: "Teachers only.",
    });
  }

  next();
};

export const requireStudent = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as JwtPayload;

  if (user.type !== "student") {
    return res.status(403).json({
      error: "Students only.",
    });
  }

  next();
};
