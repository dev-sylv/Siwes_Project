import { Schema, model, Document } from "mongoose";

export type Role = "student" | "course_rep" | "president" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  level: number;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["student", "course_rep", "president", "admin"],
      default: "student",
    },
    level: { type: Number, required: true, min: 100, max: 500 },
  },
  { timestamps: true },
);

export default model<IUser>("User", userSchema);
