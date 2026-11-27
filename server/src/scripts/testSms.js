import "dotenv/config";
import { sendSms } from "../services/smsService.js";

const main = async () => {
  // Enable SMS only for this test process.
  process.env.SMS_ENABLED = "true";

  const recipient = process.argv[2];

  if (!recipient) {
    throw new Error("Please provide a phone number.");
  }

  const result = await sendSms({
    to: recipient,

    body:
      "Freedom Dance Studio: This is a test of our automated " +
      "booking and reminder system. Questions? Call 725-724-0962. " +
      "Reply STOP to opt out.",
  });

  console.log("SMS result:", result);
};

main().catch((error) => {
  console.error("SMS test failed:", error.message);
  process.exitCode = 1;
});
