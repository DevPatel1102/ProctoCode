import mongoose from "mongoose";

import { env } from "./env.js";

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  const connection = await mongoose.connect(env.mongodbUri);
  isConnected = connection.connection.readyState === 1;

  console.log("MongoDB connected successfully");

  return connection.connection;
}
