// middlewares: authenticateToken (same as practice-c) + optionalAuth (NEW)
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

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


// NEW: OPTIONAL auth - like authenticateToken, but it NEVER blocks the request
//   good token      -> req.user is set (logged-in user)
//   no / bad token  -> just continue as a GUEST (req.user stays undefined)
// used on routes that EVERYONE can see, but logged-in users see a bit more
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("Authorization");

  const token =
    authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // bad or expired token -> ignore it, treat them as a guest
    }
  }

  next();
};
