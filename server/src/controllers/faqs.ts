import Joi from "joi";
import { Response } from "express";
import Faq from "../models/faqs";
import asyncHandler, { httpError } from "../utils/asyncHandler";

// validation lives here so this module does not depend on any other file's exports
const faqSchema = Joi.object({
  question: Joi.string().trim().min(5).max(200).required(),
  answer: Joi.string().trim().min(5).max(2000).required(),
  order: Joi.number().integer().min(0).max(999),
});

const faqUpdateSchema = faqSchema
  .fork(["question", "answer"], (s) => s.optional())
  .min(1);

// validate a request body, strip unknown fields, and report every problem at once
const parseBody = (res: Response, schema: Joi.ObjectSchema, body: unknown) => {
  const { error, value } = schema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error)
    httpError(res, 400, error.details.map((d) => d.message).join(". "));
  return value as { question?: string; answer?: string; order?: number };
};

// any logged-in user can read
export const getFaqs = asyncHandler(async (_req, res) => {
  res.json(await Faq.find().sort({ order: 1, createdAt: 1 }));
});

// admin only (enforced in the routes file)
export const createFaq = asyncHandler(async (req, res) => {
  const data = parseBody(res, faqSchema, req.body);
  // new questions go to the end unless an order is given
  if (data.order === undefined) data.order = await Faq.countDocuments();
  res.status(201).json(await Faq.create(data));
});

export const updateFaq = asyncHandler(async (req, res) => {
  const data = parseBody(res, faqUpdateSchema, req.body);
  const faq = await Faq.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  });
  if (!faq) httpError(res, 404, "FAQ not found");
  res.json(faq);
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findByIdAndDelete(req.params.id);
  if (!faq) httpError(res, 404, "FAQ not found");
  res.json({ message: "FAQ deleted" });
});
