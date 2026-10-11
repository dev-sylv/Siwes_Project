import { Schema, model, Document, Types } from "mongoose";

export interface ICourseAssignment extends Document {
  course: Types.ObjectId;
  lecturer: Types.ObjectId;
  session: Types.ObjectId;
}

const courseAssignmentSchema = new Schema<ICourseAssignment>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lecturer: { type: Schema.Types.ObjectId, ref: "Lecturer", required: true },
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  },
  { timestamps: true },
);

// the same lecturer can't be assigned to the same course twice in a session
courseAssignmentSchema.index(
  { course: 1, lecturer: 1, session: 1 },
  { unique: true },
);

export default model<ICourseAssignment>(
  "CourseAssignment",
  courseAssignmentSchema,
);
