import { Schema, model, Document, Types } from "mongoose";

export interface ITimetableEntry extends Document {
  course: Types.ObjectId;
  session: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  startTime: string; // "08:00"
  endTime: string; // "10:00"
  venue: string;
}

const timetableEntrySchema = new Schema<ITimetableEntry>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    venue: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export default model<ITimetableEntry>("TimetableEntry", timetableEntrySchema);
