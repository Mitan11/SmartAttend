import crypto from "crypto";

export const generateQrToken = (sessionId) => {
  const payload = `${sessionId}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
};
