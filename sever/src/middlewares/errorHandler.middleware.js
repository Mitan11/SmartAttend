import { StatusCodes } from "http-status-codes";
export default async function errorHandler(err, req, res, next) {
  console.error("Global Error:", err);
  const message = err.message || "Internal Server Error";
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  return res.status(statusCode).json({
    success: false,
    message: message,
    errors: err.errors || []
  });
}
