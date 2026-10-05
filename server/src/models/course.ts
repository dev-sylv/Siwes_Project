import { Schema, model, Document } from "mongoose";

export interface ICourse extends Document {
  code: string;
  title: string;
  units: number;
  level: number;
  semester: "first" | "second";
}

const courseSchema = new Schema<ICourse>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true },
    units: { type: Number, required: true, min: 1 },
    level: { type: Number, required: true, min: 100, max: 500 },
    semester: { type: String, enum: ["first", "second"], required: true },
  },
  { timestamps: true },
);

export default model<ICourse>("Course", courseSchema);
