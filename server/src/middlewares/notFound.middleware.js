import { StatusCodes } from "http-status-codes";

export default function notFoundHandler(req, res, next) {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errors: []
  });
}
