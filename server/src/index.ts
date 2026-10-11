import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./router/auth";
import sessionRoutes from "./router/session";
import rolesRoutes from "./router/roleRequest";
import courseRoutes from "./router/course";
import directoryRoutes from "./router/directory";
import timetableRoutes from "./router/timeTable";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "CS Guide API is running" });
});
console.log("working");
app.use("/api/auth", authRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/directory", directoryRoutes);
app.use("/api/timetable", timetableRoutes);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
