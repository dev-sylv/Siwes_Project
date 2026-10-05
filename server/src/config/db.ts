import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in .env");
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("MongoDB connection error:", message);
    process.exit(1);
  }
};

export default connectDB;
