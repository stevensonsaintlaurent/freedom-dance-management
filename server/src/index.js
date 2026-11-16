import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Freedom Dance Studio API is running!",
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Freedom Dance Studio API",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Freedom Dance Studio API is running!",
  });
});

// 404 handler - MUST come after your routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
