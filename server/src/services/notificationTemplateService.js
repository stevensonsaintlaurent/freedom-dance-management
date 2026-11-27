const STUDIO = {
  name: "Freedom Dance Studio",
  website: "https://vegasfreedomdancestudio.com",
  phone: "725-724-0962",
  whatsapp: "https://wa.me/17257240962",
  address: "3110 E Sunset Rd, Suite C, Las Vegas, NV 89120",
  gold: "#D4AF37",
  black: "#111111",
};

// ==========================================
// SECURITY — ESCAPE DYNAMIC HTML
// ==========================================

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatPrice = (cents) => {
  if (cents == null || !Number.isFinite(Number(cents))) {
    return "Not specified";
  }

  if (Number(cents) === 0) {
    return "FREE";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(cents) / 100);
};

// ==========================================
// NOTIFICATION CONTENT
// ==========================================

const getContent = (type, payload) => {
  const firstName = payload.firstName || "Dancer";
  const classTitle = payload.classTitle || "Dance class";
  const isStaff = payload.audience === "STAFF";

  switch (type) {
    case "BOOKING_RECEIVED":
      return isStaff
        ? {
            heading: "New class booking",
            banner: "NEW RESERVATION",
            subject: `New booking — ${classTitle}`,
            message:
              `${firstName} ${payload.lastName || ""} ` +
              `has submitted a reservation for ${classTitle}.`,
            instruction:
              "Please review this reservation in your management dashboard.",
          }
        : {
            heading: "We received your reservation!",
            banner: "BOOKING RECEIVED",
            subject: `Booking received — ${classTitle}`,
            message:
              `Hi ${firstName}! Thank you for choosing ` +
              `${STUDIO.name}. Your reservation has been received ` +
              "and is pending confirmation.",
            instruction:
              "We will notify you when your reservation is confirmed.",
          };

    case "BOOKING_CONFIRMED":
      return {
        heading: "You're ready to dance!",
        banner: "BOOKING CONFIRMED",
        subject: `Booking confirmed — ${classTitle}`,
        message:
          `Hi ${firstName}! Your reservation for ` +
          `${classTitle} has been confirmed.`,
        instruction:
          "Please arrive 10 minutes before your class. " +
          "We look forward to dancing with you!",
      };

    case "BOOKING_CANCELLED":
      return {
        heading: "Reservation cancelled",
        banner: "BOOKING CANCELLED",
        subject: `Booking cancelled — ${classTitle}`,
        message:
          `Hi ${firstName}, your reservation for ` +
          `${classTitle} has been cancelled.`,
        instruction: "Please visit our website to reserve another class.",
      };

    case "CLASS_CANCELLED":
      return {
        heading: "Important class update",
        banner: "CLASS CANCELLED",
        subject: `Class cancelled — ${classTitle}`,
        message:
          `Hi ${firstName}, unfortunately, your scheduled ` +
          `${classTitle} session has been cancelled.`,
        instruction:
          payload.publicMessage ||
          "We apologize for the inconvenience. Please contact us for assistance.",
      };

    case "CLASS_RESTORED":
      return {
        heading: "Your class is back!",
        banner: "CLASS RESTORED",
        subject: `Class restored — ${classTitle}`,
        message:
          `Hi ${firstName}, the previously cancelled ` +
          `${classTitle} session has been restored.`,
        instruction:
          "Please contact us if you need to verify your reservation.",
      };

    case "CLASS_REMINDER": {
      const pending = payload.status === "PENDING";

      return {
        heading: "Your dance class is coming up!",
        banner: "CLASS REMINDER",
        subject: `Reminder — ${classTitle}`,
        message:
          `Hi ${firstName}! This is a reminder about your ` +
          `upcoming ${classTitle} class.`,
        instruction: pending
          ? "Your reservation is still pending confirmation. Please contact us to verify it."
          : "Please arrive 10 minutes before class and bring your dancing energy!",
      };
    }

    case "CLASS_RESCHEDULED":
      return {
        heading: "Your class schedule has changed",
        banner: "CLASS RESCHEDULED",
        subject: `Schedule update — ${classTitle}`,
        message:
          `Hi ${firstName}, the schedule for ` + `${classTitle} has changed.`,
        instruction: "Please review the updated class details below.",
      };

    default:
      throw new Error(`Unsupported notification type: ${type}`);
  }
};

// ==========================================
// CLASS DETAILS
// ==========================================

const getDetails = (payload) =>
  [
    ["Class", payload.classTitle],
    ["Date", payload.classDate],
    ["Time", [payload.startTime, payload.endTime].filter(Boolean).join(" – ")],
    ["Instructor", payload.instructor],
    ["Room", payload.room],
    ["Class price", formatPrice(payload.priceCents)],
    ["Booking reference", payload.bookingReference],
    ["Booking status", payload.status],
  ].filter(([, value]) => value != null && value !== "");

// ==========================================
// EMAIL TEMPLATE
// ==========================================

export const buildEmailTemplate = ({ type, payload = {}, subject }) => {
  const content = getContent(type, payload);
  const details = getDetails(payload);

  const detailRows = details
    .map(
      ([label, value]) => `
        <tr>
          <td style="
            padding:12px;
            border-bottom:1px solid #dddddd;
            color:#666666;
            font-size:13px;
          ">
            ${escapeHtml(label)}
          </td>

          <td style="
            padding:12px;
            border-bottom:1px solid #dddddd;
            color:#111111;
            font-size:14px;
            font-weight:bold;
          ">
            ${escapeHtml(value)}
          </td>
        </tr>
      `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(content.subject)}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#eeeeee;
  font-family:Arial,Helvetica,sans-serif;
  color:#111111;
">

  <table role="presentation" width="100%"
         cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding:24px 10px;">

        <table role="presentation" width="100%"
               cellspacing="0" cellpadding="0"
               style="
                 max-width:600px;
                 background:#ffffff;
                 border:1px solid #dddddd;
               ">

          <!-- HEADER -->

          <tr>
            <td align="center" style="
              background:${STUDIO.black};
              padding:35px 20px;
            ">
              <div style="
                color:${STUDIO.gold};
                font-size:30px;
                font-weight:bold;
                letter-spacing:4px;
              ">
                FDS
              </div>

              <h1 style="
                color:${STUDIO.gold};
                font-size:24px;
                margin:12px 0;
              ">
                FREEDOM DANCE STUDIO
              </h1>

              <p style="
                color:#ffffff;
                font-size:12px;
                letter-spacing:2px;
                margin:0;
              ">
                DANCE &bull; CONNECT &bull; GROW
              </p>
            </td>
          </tr>

          <!-- STATUS BANNER -->

          <tr>
            <td align="center" style="
              background:${STUDIO.gold};
              color:#111111;
              font-size:14px;
              font-weight:bold;
              padding:15px;
              letter-spacing:1px;
            ">
              ${escapeHtml(content.banner)}
            </td>
          </tr>

          <!-- MAIN CONTENT -->

          <tr>
            <td style="padding:30px 24px;">

              <h2 style="
                margin:0 0 18px;
                font-size:25px;
                color:#111111;
              ">
                ${escapeHtml(content.heading)}
              </h2>

              <p style="
                font-size:16px;
                line-height:1.7;
                color:#333333;
              ">
                ${escapeHtml(content.message)}
              </p>

              <table width="100%"
                     cellspacing="0" cellpadding="0"
                     style="
                       background:#f5f5f5;
                       border:1px solid #dddddd;
                       margin:25px 0;
                     ">
                ${detailRows}
              </table>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#333333;
              ">
                ${escapeHtml(content.instruction)}
              </p>

              <table role="presentation"
                     width="100%"
                     cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center"
                      style="padding:20px 0;">

                    <a href="${STUDIO.website}"
                       style="
                         display:inline-block;
                         background:${STUDIO.black};
                         color:${STUDIO.gold};
                         padding:16px 24px;
                         text-decoration:none;
                         font-size:15px;
                         font-weight:bold;
                         border-radius:6px;
                       ">
                      Explore Freedom Dance Studio
                    </a>

                  </td>
                </tr>
              </table>

              <p style="
                font-size:14px;
                line-height:1.6;
                color:#555555;
              ">
                Have questions?
                Call us at ${STUDIO.phone}
                or contact us on
                <a href="${STUDIO.whatsapp}"
                   style="color:#806515;">
                  WhatsApp
                </a>.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->

          <tr>
            <td align="center" style="
              background:${STUDIO.black};
              padding:30px 20px;
            ">
              <h3 style="
                color:${STUDIO.gold};
                margin:0 0 15px;
              ">
                ${STUDIO.name}
              </h3>

              <p style="
                color:#ffffff;
                font-size:13px;
                line-height:1.7;
                margin:0;
              ">
                ${STUDIO.address}<br>
                ${STUDIO.phone}
              </p>

              <p>
                <a href="${STUDIO.website}"
                   style="
                     color:${STUDIO.gold};
                     font-size:13px;
                   ">
                  vegasfreedomdancestudio.com
                </a>
              </p>

              <p style="
                color:#bbbbbb;
                font-size:11px;
                line-height:1.6;
              ">
                This is an automated notification
                regarding a Freedom Dance Studio reservation.
              </p>

              <p style="color:#999999;font-size:11px;">
                &copy; ${new Date().getFullYear()}
                Freedom Dance Studio.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  const text = [
    STUDIO.name,
    content.banner,
    "",
    content.message,
    "",
    ...details.map(([label, value]) => `${label}: ${value}`),
    "",
    content.instruction,
    "",
    STUDIO.address,
    `Phone: ${STUDIO.phone}`,
    STUDIO.website,
  ].join("\n");

  return {
    subject: subject || content.subject,
    html,
    text,
  };
};

// ==========================================
// SMS TEMPLATE
// ==========================================

export const buildSmsTemplate = ({ type, payload = {} }) => {
  const content = getContent(type, payload);

  const body = [
    `${STUDIO.name}:`,
    content.message,
    payload.classDate ? `Date: ${payload.classDate}.` : "",
    payload.startTime ? `Time: ${payload.startTime}.` : "",
    content.instruction,
    `Questions? ${STUDIO.phone}.`,
    "Reply STOP to opt out.",
  ]
    .filter(Boolean)
    .join(" ");

  return { body };
};
