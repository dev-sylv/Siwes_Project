import { Schema, model, Document, Types } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  targetLevel: number | null; // null means everyone
  postedBy: Types.ObjectId;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    targetLevel: { type: Number, default: null },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export default model<IAnnouncement>("Announcement", announcementSchema);
