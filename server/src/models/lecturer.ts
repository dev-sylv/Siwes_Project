import { Schema, model, Document } from "mongoose";

export interface ILecturer extends Document {
  name: string;
  title: string; // Prof., Dr., Mr., Mrs.
  email?: string;
  isHod: boolean;
}

const lecturerSchema = new Schema<ILecturer>(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    email: { type: String, lowercase: true, trim: true },
    isHod: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default model<ILecturer>("Lecturer", lecturerSchema);
