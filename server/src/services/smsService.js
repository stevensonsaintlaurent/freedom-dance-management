import "dotenv/config";
import twilio from "twilio";

let twilioClient;

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are missing.");
  }

  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
};

// ==========================================
// NORMALIZE PHONE NUMBER
// ==========================================

export const normalizePhoneNumber = (phone) => {
  const cleaned = String(phone || "")
    .trim()
    .replace(/[\s().-]/g, "");

  if (/^\d{10}$/.test(cleaned)) {
    return `+1${cleaned}`;
  }

  if (/^1\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return cleaned;
  }

  throw new Error("Invalid phone number.");
};

// ==========================================
// SEND SMS
// ==========================================

export const sendSms = async ({ to, body }) => {
  if (process.env.SMS_ENABLED !== "true") {
    return {
      success: false,
      skipped: true,
      message: "SMS service is disabled.",
    };
  }

  if (!to || typeof body !== "string" || !body.trim()) {
    throw new Error("Phone number and message are required.");
  }

  if (!process.env.TWILIO_PHONE_NUMBER) {
    throw new Error("TWILIO_PHONE_NUMBER is missing.");
  }

  const client = getTwilioClient();

  const message = await client.messages.create({
    from: normalizePhoneNumber(process.env.TWILIO_PHONE_NUMBER),
    to: normalizePhoneNumber(to),
    body: body.trim(),
  });

  return {
    success: true,
    provider: "TWILIO",
    messageId: message.sid,
    status: message.status,
  };
};
