import mongoose from "mongoose";
import env from "./env.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    const connection = await mongoose.connect(env.MONGO_URI);

    logger.info(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

export default connectDB;