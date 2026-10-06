import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user";

const run = async (): Promise<void> => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    await User.updateOne({ email: ADMIN_EMAIL }, { role: "admin" });
    console.log("Existing user promoted to admin");
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name: ADMIN_NAME || "Admin",
      email: ADMIN_EMAIL,
      password: hashed,
      role: "admin",
      level: 400,
    });
    console.log("Admin created");
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
