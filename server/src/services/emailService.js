import "dotenv/config";
import { Resend } from "resend";

let resendClient;
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY)
    throw new Error("RESEND_API_KEY is missing.");
  return (resendClient ||= new Resend(process.env.RESEND_API_KEY));
};

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  idempotencyKey,
}) => {
  if (process.env.EMAIL_ENABLED !== "true") {
    return {
      success: false,
      skipped: true,
      message: "Email service is disabled.",
    };
  }
  if (!to || !subject || (!html && !text))
    throw new Error("Missing required email information.");
  if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM is missing.");
  const resend = getResendClient();
  const email = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
    ...(process.env.EMAIL_REPLY_TO
      ? { replyTo: process.env.EMAIL_REPLY_TO }
      : {}),
  };
  const { data, error } = await resend.emails.send(
    email,
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) {
    const deliveryError = new Error(error.message || "Unable to send email.");
    deliveryError.provider = "RESEND";
    deliveryError.providerErrorName = error.name;
    deliveryError.statusCode = error.statusCode;
    throw deliveryError;
  }
  if (!data?.id) throw new Error("Email provider did not return a message ID.");
  return { success: true, provider: "RESEND", messageId: data.id };
};
