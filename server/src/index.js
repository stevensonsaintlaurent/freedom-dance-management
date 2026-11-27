import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import prisma from "./lib/prisma.js";

// ==========================================
// ROUTES
// ==========================================

import authRoutes from "./routes/authRoutes.js";
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

// ==========================================
// MIDDLEWARE
// ==========================================

import { errorMiddleware } from "./middleware/errorMiddleware.js";

// ==========================================
// BACKGROUND WORKERS
// ==========================================

import {
  startNotificationWorker,
  stopNotificationWorker,
} from "./jobs/notificationWorker.js";

// ==========================================
// APPLICATION CONFIGURATION
// ==========================================

const app = express();

const PORT = process.env.PORT || 5000;

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

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

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

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

// ==========================================
// AUTHENTICATION AND USERS
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/staff", staffRoutes);

// ==========================================
// DANCE CLASS MANAGEMENT
// ==========================================

app.use("/api/classes", classRoutes);
app.use("/api/weekly-classes", weeklyClassRoutes);
app.use("/api/weekly-bookings", weeklyBookingRoutes);
app.use("/api/cancellations", cancellationRoutes);
app.use("/api/attendance", attendanceRoutes);

// ==========================================
// STUDIO RENTAL MANAGEMENT
// ==========================================

app.use("/api/rooms", roomRoutes);
app.use("/api/rental-categories", rentalCategoryRoutes);
app.use("/api/rental-pricing", rentalPricingRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/operating-hours", operatingHoursRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

// ==========================================
// START SERVER
// ==========================================

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  startNotificationWorker();
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`\n${signal} received. Shutting down...`);

  const forceShutdown = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 30000);

  try {
    await Promise.all([
      stopNotificationWorker(),

      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      }),
    ]);

    await prisma.$disconnect();

    clearTimeout(forceShutdown);

    console.log("Server shut down successfully.");

    process.exit(0);
  } catch (error) {
    clearTimeout(forceShutdown);

    console.error("Shutdown error:", error.message);

    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
