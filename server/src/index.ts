import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "CS Guide API is running" });
});

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
