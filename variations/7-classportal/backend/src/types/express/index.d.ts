// STEP 5 - lets us use req.user (same as practice-c)
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    export interface Request {
      user?: string | JwtPayload;
    }
  }
}
