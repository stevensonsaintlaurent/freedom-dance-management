import "dotenv/config";
import prisma from "../lib/prisma.js";

const apply = process.argv.includes("--apply");

const date = (value) => new Date(value);
const earlyBirdEnd = date("2026-12-04T00:00:00-08:00");

const common = {
  status: "PUBLISHED",
  featured: true,
  showInHero: true,
  registrationEnabled: false,
  timezone: "America/Los_Angeles",
  imageFit: "contain",
};

const events = [
  {
    ...common,

    slug: "weekend",
    title: "Las Vegas BachaZouk Weekender",
    subtitle: "Last Weekender for 2026 at Freedom Dance Studio!",
    type: "WEEKEND_INTENSIVE",
    category: "BachaZouk",
    instructorName: "Guest BachaZouk Artists",
    level: "To Be Announced",

    startDate: date("2026-12-05"),
    endDate: date("2026-12-06"),

    timeLabel: "December 5–6, 2026",
    durationLabel: "2 Days",

    location: "Freedom Dance Studio",
    address: "3110 E. Sunset Rd., Suite C, Las Vegas, NV 89120",

    imageUrl: "/events/bachazouk.webp",

    highlight: "LAST WEEKENDER OF 2026!",

    announcement:
      "Our final dance weekender of 2026 at Freedom Dance Studio. Don't miss it!",

    description:
      "Get ready for the LAS VEGAS BACHAZOUK WEEKENDER, December 5–6, 2026! Freedom Dance Company proudly presents the LAST WEEKENDER OF 2026 at Freedom Dance Studio! Join us for two exciting days dedicated exclusively to BachaZouk. Experience connection, creativity, musicality, technique, and partnerwork while learning from our guest artists. This is your final opportunity to experience a Freedom Dance Studio weekender in 2026! Take advantage of our Early Bird Full Pass for only $99 before December 3 at 11:59 PM. Regular Full Pass: $129. Workshop schedules and additional details will be announced soon. DON'T MISS IT!",

    buttonLabel: "Get Your Pass",

    sessions: [],

    tickets: [
      {
        name: "Early Bird Full Pass",
        priceCents: 9900,
        salesEndAt: earlyBirdEnd,
        includesAllSessions: true,
        sortOrder: 1,
      },
      {
        name: "Regular Full Pass",
        priceCents: 12900,
        salesStartAt: earlyBirdEnd,
        includesAllSessions: true,
        sortOrder: 2,
      },
    ],
  },

  {
    ...common,

    slug: "traditional-bachata",
    title: "Traditional Bachata Workshop with Anya",
    type: "DANCE_WORKSHOP",
    category: "Traditional Bachata / Dominican Bachata",
    instructorName: "Anya",
    level: "Beginner Friendly",

    startDate: date("2026-12-13"),
    endDate: date("2026-12-13"),

    startsAt: date("2026-12-13T15:00:00-08:00"),
    endsAt: date("2026-12-13T17:00:00-08:00"),

    timeLabel: "3:00 PM – 5:00 PM",
    durationLabel: "2 Hours",

    location: "Freedom Dance Studio",
    address: "3110 E Sunset Rd, Suite C, Las Vegas, NV 89120",

    imageUrl: "/events/ana.jpeg",

    description:
      "Discover the roots of Bachata at Freedom Dance Studio! Join Anya on Sunday, December 13, 2026, for an exciting two-hour Traditional Bachata Workshop. Explore the fundamentals, basic movements, rhythm, footwork, and partner work of Dominican Bachata. This beginner-friendly experience is perfect for anyone looking to start their dance journey or strengthen their traditional Bachata foundations. Take advantage of our early sign-up special and enjoy both workshops for only $35, or attend a single workshop for $20. Come learn, connect, and experience the beauty and culture of traditional Bachata with us!",

    buttonLabel: "Register Now",

    sessions: [
      {
        title: "Fundamentals and Basic Movements",
        type: "WORKSHOP",
        instructorName: "Anya",
        level: "Beginner Friendly",
        sessionDate: date("2026-12-13"),
        startsAt: date("2026-12-13T15:00:00-08:00"),
        endsAt: date("2026-12-13T16:00:00-08:00"),
        timeLabel: "3:00 PM – 4:00 PM",
        durationLabel: "1 Hour",
        sortOrder: 1,

        description:
          "Learn the foundations of traditional Dominican Bachata, including basic steps, rhythm, footwork, and fundamental movements.",
      },
      {
        title: "Traditional Bachata Partner Work",
        type: "WORKSHOP",
        instructorName: "Anya",
        level: "Beginner Friendly",
        sessionDate: date("2026-12-13"),
        startsAt: date("2026-12-13T16:00:00-08:00"),
        endsAt: date("2026-12-13T17:00:00-08:00"),
        timeLabel: "4:00 PM – 5:00 PM",
        durationLabel: "1 Hour",
        sortOrder: 2,

        description:
          "Develop your partner dancing skills through traditional Bachata movements, connection, and lead and follow techniques.",
      },
    ],

    tickets: [
      {
        name: "Early Sign-Up — Both Workshops",
        priceCents: 3500,
        includesAllSessions: true,
        sessionIndexes: [0, 1],
        sortOrder: 1,
      },
      {
        name: "Fundamentals and Basic Movements",
        priceCents: 2000,
        sessionIndexes: [0],
        sortOrder: 2,
      },
      {
        name: "Traditional Bachata Partner Work",
        priceCents: 2000,
        sessionIndexes: [1],
        sortOrder: 3,
      },
    ],
  },

  {
    ...common,

    slug: "band",
    title: "Freedom Live Band Concert",
    type: "LIVE_CONCERT",
    category: "Live Music / Jazz / Latin / Big Band",
    instructorName: "Freedom Live Band",
    level: "Open to Everyone",

    startDate: date("2026-12-20"),
    endDate: date("2026-12-20"),

    timeLabel: "To Be Announced",
    durationLabel: "Live Concert",

    location: "Venue To Be Announced",

    imageUrl: "/events/freedom.webp",

    rehearsalInfo: {
      day: "Every Saturday",
      time: "6:00 PM – 7:30 PM",
      location: "Freedom Dance Studio",
      description:
        "Weekly rehearsals for participating musicians. Musicians should contact Steven to receive their printed music for their respective instruments.",
    },

    description:
      "Join us on Sunday, December 20, 2026, for an unforgettable evening of live music with the Freedom Live Band! Experience an exciting performance featuring talented musicians bringing Jazz, Latin, Swing, Big Band, and timeless classics to life. Celebrate music, culture, and community with family and friends. Advance tickets are only $20 per person! Secure your tickets early and enjoy an incredible live concert experience. The concert venue and starting time will be announced soon. Don't miss this special end-of-year musical celebration!",

    buttonLabel: "Get Your Tickets",

    sessions: [],

    tickets: [
      {
        name: "Advance Ticket",
        priceCents: 2000,
        sortOrder: 1,
      },
    ],
  },
];

// ==========================================
// IMPORT PREVIEW
// ==========================================

async function previewEvents() {
  const summary = [];

  for (const event of events) {
    const existing = await prisma.event.findUnique({
      where: { slug: event.slug },
      select: { id: true },
    });

    summary.push({
      event: event.title,
      action: existing ? "SKIP EXISTING" : "CREATE",
      sessions: event.sessions.length,
      tickets: event.tickets.length,
    });
  }

  console.table(summary);
}

// ==========================================
// DATABASE IMPORT
// ==========================================

async function importEvents() {
  return prisma.$transaction(
    async (tx) => {
      const summary = [];

      for (const source of events) {
        const { sessions, tickets, ...eventData } = source;

        const existing = await tx.event.findUnique({
          where: { slug: eventData.slug },
        });

        // Preserve events already imported or edited.
        if (existing) {
          summary.push({
            event: existing.title,
            action: "SKIPPED",
          });

          continue;
        }

        const event = await tx.event.create({
          data: {
            ...eventData,
            publishedAt: new Date(),
          },
        });

        const createdSessions = [];

        for (const session of sessions) {
          const created = await tx.eventSession.create({
            data: {
              ...session,
              eventId: event.id,
            },
          });

          createdSessions.push(created);
        }

        for (const sourceTicket of tickets) {
          const { sessionIndexes = [], ...ticketData } = sourceTicket;

          const ticket = await tx.eventTicketType.create({
            data: {
              ...ticketData,
              eventId: event.id,
            },
          });

          for (const index of sessionIndexes) {
            const session = createdSessions[index];

            if (!session) {
              throw new Error("Invalid ticket session reference");
            }

            await tx.eventTicketSession.create({
              data: {
                eventId: event.id,
                ticketTypeId: ticket.id,
                sessionId: session.id,
              },
            });
          }
        }

        summary.push({
          event: event.title,
          action: "CREATED",
          sessions: sessions.length,
          tickets: tickets.length,
        });
      }

      return summary;
    },
    {
      isolationLevel: "Serializable",
      timeout: 30000,
    },
  );
}

// ==========================================
// RUN SCRIPT
// ==========================================

async function main() {
  console.log("\nFREEDOM DANCE STUDIO");
  console.log("EVENTS IMPORT");
  console.log("============================");

  if (!apply) {
    console.log("\nPREVIEW MODE\n");

    await previewEvents();

    console.log("\nNo database changes were made.");
    console.log("PREVIEW COMPLETED SUCCESSFULLY");

    return;
  }

  const summary = await importEvents();

  console.table(summary);

  console.log("\nIMPORT COMPLETED SUCCESSFULLY");
}

main()
  .catch((error) => {
    console.error("\nIMPORT ERROR:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
