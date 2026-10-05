import { Schema, model, Document } from "mongoose";

export interface ISession extends Document {
  name: string; // e.g. "2026/2027"
  isCurrent: boolean;
}

const sessionSchema = new Schema<ISession>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default model<ISession>("Session", sessionSchema);
