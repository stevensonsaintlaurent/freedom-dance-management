import "dotenv/config";
import { sendEmail } from "../services/emailService.js";

const main = async () => {
  process.env.EMAIL_ENABLED = "true";

  const recipient = process.argv[2];

  if (!recipient) {
    throw new Error("Please provide an email address.");
  }

  const result = await sendEmail({
    to: recipient,
    subject: "Freedom Dance Studio - Email Test",

    html: `
      <div style="
        background:#111111;
        color:#ffffff;
        padding:30px;
        border-radius:12px;
        font-family:Arial,sans-serif;
      ">
        <h1 style="color:#D4AF37;">
          Freedom Dance Studio
        </h1>

        <h2>Congratulations!</h2>

        <p>Our automated email system is working.</p>

        <p>
          3110 E Sunset Rd, Suite C<br/>
          Las Vegas, NV 89120
        </p>
      </div>
    `,

    text: "Freedom Dance Studio email system test.",
  });

  console.log("Email result:", result);
};

main().catch((error) => {
  console.error("Email test failed:", error.message);
  process.exitCode = 1;
});
