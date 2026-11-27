import "dotenv/config";
import {
  processPendingNotifications,
  inspectInterruptedDeliveries,
} from "../services/notificationDeliveryService.js";
const getInteger = (value, fallback, min, max) => {
  const parsed = Number(value);
  return Number.isInteger(parsed)
    ? Math.min(Math.max(parsed, min), max)
    : fallback;
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
let timer = null,
  started = false,
  activeCycle = null,
  testRecipient = null,
  createdAfter = null;
const reportedInterruptedIds = new Set();
const runCycle = async () => {
  try {
    const interrupted = await inspectInterruptedDeliveries();
    for (const delivery of interrupted) {
      if (reportedInterruptedIds.has(delivery.id)) continue;
      console.warn(
        "[Notification Worker] Manual review required:",
        delivery.id,
      );
      reportedInterruptedIds.add(delivery.id);
    }
    if (!started) return;
    const summary = await processPendingNotifications({
      recipient: testRecipient,
      createdAfter,
      limit: BATCH_SIZE,
      shouldContinue: () => started,
    });
    if (summary.processed > 0)
      console.log("[Notification Worker] Processing summary:", summary);
  } catch (error) {
    console.error("[Notification Worker] Processing error:", error.message);
  }
};
const executeCycle = async () => {
  timer = null;
  if (!started || activeCycle) return;
  activeCycle = runCycle();
  try {
    await activeCycle;
  } finally {
    activeCycle = null;
    if (started) timer = setTimeout(executeCycle, INTERVAL_MS);
  }
};
export const startNotificationWorker = () => {
  if (started || activeCycle) return false;
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
  if (!testRecipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testRecipient)) {
    console.error("[Notification Worker] A valid test recipient is required.");
    return false;
  }
  const cutoff = process.env.NOTIFICATION_WORKER_CREATED_AFTER?.trim();
  createdAfter = new Date(cutoff || "invalid");
  if (
    !cutoff ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(cutoff) ||
    !Number.isFinite(createdAfter.getTime())
  ) {
    console.error(
      "[Notification Worker] A valid UTC creation cutoff is required.",
    );
    return false;
  }
  started = true;
  console.log("[Notification Worker] Started.");
  console.log({
    mode: "CONTROLLED_TEST",
    intervalMs: INTERVAL_MS,
    batchSize: BATCH_SIZE,
    recipient: testRecipient,
    createdAfter: createdAfter.toISOString(),
  });
  timer = setTimeout(executeCycle, 0);
  return true;
};
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
export const getNotificationWorkerStatus = () => ({
  started,
  processing: Boolean(activeCycle),
  intervalMs: INTERVAL_MS,
  batchSize: BATCH_SIZE,
  mode: "CONTROLLED_TEST",
});
