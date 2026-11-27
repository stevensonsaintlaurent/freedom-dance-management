import "dotenv/config";

import {
  processPendingNotifications,
  inspectInterruptedDeliveries,
} from "../services/notificationDeliveryService.js";

// ==========================================
// WORKER CONFIGURATION
// ==========================================

const getInteger = (value, fallback, min, max) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

const INTERVAL_MS = getInteger(
  process.env.NOTIFICATION_WORKER_INTERVAL_MS,
  30000,
  5000,
  300000,
);

const BATCH_SIZE = getInteger(
  process.env.NOTIFICATION_WORKER_BATCH_SIZE,
  20,
  1,
  100,
);

// ==========================================
// WORKER STATE
// ==========================================

let timer = null;
let started = false;
let activeCycle = null;
let testRecipient = null;

const reportedInterruptedIds = new Set();

// ==========================================
// PROCESS NOTIFICATIONS
// ==========================================

const runCycle = async () => {
  try {
    const interrupted = await inspectInterruptedDeliveries();

    for (const delivery of interrupted) {
      if (reportedInterruptedIds.has(delivery.id)) {
        continue;
      }

      console.warn(
        "[Notification Worker] Manual review required:",
        delivery.id,
      );

      reportedInterruptedIds.add(delivery.id);
    }

    const summary = await processPendingNotifications({
      recipient: testRecipient,
      limit: BATCH_SIZE,
    });

    if (summary.processed > 0) {
      console.log("[Notification Worker] Processing summary:", summary);
    }
  } catch (error) {
    console.error("[Notification Worker] Processing error:", error.message);
  }
};

// ==========================================
// SCHEDULE NEXT CYCLE
// ==========================================

const scheduleNextCycle = () => {
  if (!started) {
    return;
  }

  timer = setTimeout(executeCycle, INTERVAL_MS);
};

const executeCycle = async () => {
  timer = null;

  if (!started || activeCycle) {
    return;
  }

  activeCycle = runCycle();

  try {
    await activeCycle;
  } finally {
    activeCycle = null;
    scheduleNextCycle();
  }
};

// ==========================================
// START WORKER
// ==========================================

export const startNotificationWorker = () => {
  if (started) {
    console.log("[Notification Worker] Already running.");

    return false;
  }

  if (process.env.NOTIFICATION_WORKER_ENABLED !== "true") {
    console.log("[Notification Worker] Disabled.");

    return false;
  }

  if (process.env.EMAIL_ENABLED !== "true") {
    console.log("[Notification Worker] Email delivery disabled.");

    return false;
  }

  testRecipient =
    process.env.NOTIFICATION_WORKER_TEST_RECIPIENT?.trim().toLowerCase();

  // Fail closed during initial testing.
  // Unrestricted delivery is not enabled yet.

  if (!testRecipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testRecipient)) {
    console.error("[Notification Worker] A valid test recipient is required.");

    return false;
  }

  started = true;

  console.log("[Notification Worker] Started.");

  console.log({
    mode: "CONTROLLED_TEST",
    intervalMs: INTERVAL_MS,
    batchSize: BATCH_SIZE,
    recipient: testRecipient,
  });

  timer = setTimeout(executeCycle, 0);

  return true;
};

// ==========================================
// STOP WORKER
// ==========================================

export const stopNotificationWorker = async () => {
  started = false;

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  if (activeCycle) {
    console.log("[Notification Worker] Waiting for active cycle...");

    await activeCycle;
  }

  console.log("[Notification Worker] Stopped.");
};

// ==========================================
// WORKER STATUS
// ==========================================

export const getNotificationWorkerStatus = () => {
  return {
    started,
    processing: Boolean(activeCycle),
    intervalMs: INTERVAL_MS,
    batchSize: BATCH_SIZE,
    mode: "CONTROLLED_TEST",
  };
};
