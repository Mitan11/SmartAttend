import { getIO } from "../config/socket.js";
import { generateQrToken } from "../utils/qrGenerator.js";
import logger from "../config/logger.js";

// In-memory store for active session timers and tokens
const activeSessions = new Map();

/**
 * Starts generating and rotating QR tokens for a specific session.
 * @param {string} sessionId
 * @param {number} intervalMs - Rotation interval in milliseconds
 */
export const startSessionTimer = (sessionId, intervalMs = 15000) => {
  if (activeSessions.has(sessionId)) return;

  // Immediately generate first token
  let currentToken = generateQrToken(sessionId);
  logger.info(`Session ${sessionId} initialized with token ${currentToken}`);

  const intervalId = setInterval(() => {
    currentToken = generateQrToken(sessionId);
    // Emit to room `sessionId`
    const io = getIO();
    io.to(sessionId).emit("token-update", { token: currentToken, timestamp: Date.now() });
    
    // Also save it locally in map if we need to validate it later during attendance mark
    const sessionData = activeSessions.get(sessionId);
    if (sessionData) {
      sessionData.currentToken = currentToken;
      sessionData.expiresAt = Date.now() + intervalMs;
    }
  }, intervalMs);

  activeSessions.set(sessionId, {
    intervalId,
    currentToken,
    expiresAt: Date.now() + intervalMs
  });

  // Emit first token after a brief delay to ensure client joined
  setTimeout(() => {
    const io = getIO();
    io.to(sessionId).emit("token-update", { token: currentToken, timestamp: Date.now() });
  }, 1000);
};

export const stopSessionTimer = (sessionId) => {
  const sessionData = activeSessions.get(sessionId);
  if (sessionData) {
    clearInterval(sessionData.intervalId);
    activeSessions.delete(sessionId);
    logger.info(`Session ${sessionId} timer stopped`);
  }
};

export const getActiveToken = (sessionId) => {
  return activeSessions.get(sessionId);
};
