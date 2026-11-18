import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

import userRoutes from "./routes/userRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Behind Render's reverse proxy in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

// Home
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Freedom Dance Studio API",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Freedom Dance Studio API is running!",
  });
});

// Authentication
app.use("/api/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
