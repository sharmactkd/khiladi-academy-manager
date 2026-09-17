import { createClient } from "redis";
import env from "./env.js";
import logger from "../utils/logger.js";

let client;
let connectionPromise;

export const getRedisClient = () => {
  if (!env.REDIS_URL) return null;
  if (!client) {
    client = createClient({ url: env.REDIS_URL, socket: { reconnectStrategy: (attempt) => Math.min(attempt * 100, 3000) } });
    client.on("error", (error) => logger.error(`Redis error: ${error.message}`));
    connectionPromise = client.connect().catch((error) => {
      logger.error(`Redis connection failed: ${error.message}`);
      throw error;
    });
  }
  return { client, ready: connectionPromise };
};

export const sendRedisCommand = async (...args) => {
  const redis = getRedisClient();
  if (!redis) throw new Error("Redis is not configured");
  await redis.ready;
  return redis.client.sendCommand(args);
};
