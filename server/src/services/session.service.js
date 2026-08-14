import { getIO } from "../config/socket.js";
import { generateQrToken } from "../utils/qrGenerator.js";
import logger from "../config/logger.js";

// In-memory store for active session timers and tokens
const activeSessions = new Map();

/**
 * Starts a single QR token for the duration of the session and auto-closes.
 * @param {string} sessionId
 * @param {number} durationMs - Total duration in milliseconds
 * @param {Function} onExpire - Callback to run when the session expires
 */
export const startSessionTimer = (sessionId, durationMs = 60000, onExpire = null) => {
  if (activeSessions.has(sessionId)) return;

  // Immediately generate first token
  let currentToken = generateQrToken(sessionId);
  logger.info(`Session ${sessionId} initialized with token ${currentToken}`);

  const timeoutId = setTimeout(async () => {
    // When time runs out, stop the timer and trigger the callback
    stopSessionTimer(sessionId);
    if (onExpire) {
      await onExpire(sessionId);
    }
  }, durationMs);

  activeSessions.set(sessionId, {
    timeoutId,
    currentToken,
    expiresAt: Date.now() + durationMs
  });

  // Emit first token after a brief delay to ensure client joined
  setTimeout(() => {
    const io = getIO();
    io.to(sessionId).emit("token-update", { token: currentToken, timestamp: Date.now(), durationMs });
  }, 1000);
};

export const stopSessionTimer = (sessionId) => {
  const sessionData = activeSessions.get(sessionId);
  if (sessionData) {
    clearTimeout(sessionData.timeoutId);
    activeSessions.delete(sessionId);
    logger.info(`Session ${sessionId} timer stopped`);
  }
};

export const getActiveToken = (sessionId) => {
  return activeSessions.get(sessionId);
};
