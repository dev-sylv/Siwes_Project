import { Schema, model, Document, Types } from "mongoose";

export interface IExco extends Document {
  session: Types.ObjectId;
  position: string; // President, Vice President, Secretary...
  name: string;
}

const excoSchema = new Schema<IExco>(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    position: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

// one person per position per session
excoSchema.index({ session: 1, position: 1 }, { unique: true });

export default model<IExco>("Exco", excoSchema);
