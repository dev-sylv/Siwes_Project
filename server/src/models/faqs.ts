import { Schema, model, Document } from "mongoose";

export interface IFaq extends Document {
  question: string;
  answer: string;
  order: number; // lower numbers show first
}

const faqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default model<IFaq>("Faq", faqSchema);
