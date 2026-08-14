import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
      const err = new Error("Authentication failed: No token provided");
      err.statusCode = StatusCodes.UNAUTHORIZED;
      return next(err);
    }
    const decoded = jwt.verify(token, env.ACCESSTOKEN);
    const user = await User.findById(decoded.id);
    if (!user) {
      const err = new Error("Authentication failed: User not found");
      err.statusCode = StatusCodes.UNAUTHORIZED;
      return next(err);
    }
    if (user.status === "Suspended" || user.status === "Inactive") {
      const err = new Error(`Authentication failed: Account is ${user.status}`);
      err.statusCode = StatusCodes.FORBIDDEN;
      return next(err);
    }
    req.user = user;
    next();
  } catch (error) {
    const err = new Error("Authentication failed: Invalid or expired token");
    err.statusCode = StatusCodes.UNAUTHORIZED;
    return next(err);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const err = new Error(`Authorization failed: Requires one of [${roles.join(", ")}] roles`);
      err.statusCode = StatusCodes.FORBIDDEN;
      return next(err);
    }
    next();
  };
};
