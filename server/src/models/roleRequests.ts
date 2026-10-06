import { Schema, model, Document, Types } from "mongoose";

export type RequestableRole = "course_rep" | "president";

export interface IRoleRequest extends Document {
  user: Types.ObjectId;
  requestedRole: RequestableRole;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: Types.ObjectId;
}

const roleRequestSchema = new Schema<IRoleRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedRole: {
      type: String,
      enum: ["course_rep", "president"],
      required: true,
    },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default model<IRoleRequest>("RoleRequest", roleRequestSchema);
