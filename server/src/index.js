import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";

import userRoutes from "./routes/userRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import weeklyClassRoutes from "./routes/weeklyClassRoutes.js";
import weeklyBookingRoutes from "./routes/weeklyBookingRoutes.js";
import cancellationRoutes from "./routes/cancellationRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import rentalCategoryRoutes from "./routes/rentalCategoryRoutes.js";
import rentalPricingRoutes from "./routes/rentalPricingRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import operatingHoursRoutes from "./routes/operatingHoursRoutes.js";

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
app.use("/api/classes", classRoutes);
app.use("/api/weekly-classes", weeklyClassRoutes);
app.use("/api/staff", staffRoutes);
app.use(express.json());
app.use("/api/cancellations", cancellationRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/rooms", roomRoutes);

app.use("/api/weekly-bookings", weeklyBookingRoutes);

// Studio rental management
app.use("/api/rooms", roomRoutes);
app.use("/api/rental-categories", rentalCategoryRoutes);
app.use("/api/rental-pricing", rentalPricingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/operating-hours", operatingHoursRoutes);

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
