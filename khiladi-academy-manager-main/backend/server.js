import http from "http";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import env from "./src/config/env.js";
import logger from "./src/utils/logger.js";

const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});