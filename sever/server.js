import createApp from "./src/app.js";
import connectDB from "./src/database/db.js";
import logger from "./src/config/logger.js";
import env from "./src/config/env.js";
import http from "http";
import { initSocket } from "./src/config/socket.js";

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

(async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    logger.error({ error: error }, "There is an error while connecting to DB");
  }

  server.listen(env.PORT || 3000, () => {
    logger.info({ port: env.PORT || 3000 }, "Your app is running");
  });
})();
