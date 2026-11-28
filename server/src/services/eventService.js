import prisma from "../lib/prisma.js";

// ==========================================
// DATE AND PRICE UTILITIES
// ==========================================

const TIMEZONE = "America/Los_Angeles";

const getToday = () => {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return new Date(`${date}T00:00:00.000Z`);
};

const formatPrice = (cents) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};

const isTicketOnSale = (ticket, now) => {
  if (!ticket.isActive) return false;

  if (ticket.salesStartAt && now < ticket.salesStartAt) {
    return false;
  }

  if (ticket.salesEndAt && now >= ticket.salesEndAt) {
    return false;
  }

  return true;
};

// ==========================================
// PUBLIC EVENT FIELDS
// ==========================================

const publicEventSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  description: true,
  category: true,
  type: true,
  status: true,

  instructorName: true,
  level: true,

  startDate: true,
  endDate: true,
  startsAt: true,
  endsAt: true,

  timezone: true,
  timeLabel: true,
  durationLabel: true,

  location: true,
  address: true,

  imageUrl: true,
  imageFit: true,

  highlight: true,
  announcement: true,
  buttonLabel: true,

  featured: true,
  showInHero: true,
  rehearsalInfo: true,

  registrationEnabled: true,
  registrationOpensAt: true,
  registrationClosesAt: true,

  sessions: {
    where: {
      isActive: true,
    },
    orderBy: [
      { sessionDate: "asc" },
      { sortOrder: "asc" },
      { startsAt: "asc" },
    ],
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      instructorName: true,
      level: true,
      sessionDate: true,
      startsAt: true,
      endsAt: true,
      timeLabel: true,
      durationLabel: true,
      location: true,

      room: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },

  ticketTypes: {
    where: {
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      salesStartAt: true,
      salesEndAt: true,
      maxPerBooking: true,
      includesAllSessions: true,
      benefits: true,
      isActive: true,

      sessions: {
        where: {
          session: {
            isActive: true,
          },
        },
        select: {
          sessionId: true,
        },
      },
    },
  },
};

// ==========================================
// FORMAT PUBLIC EVENT
// ==========================================

const formatPublicEvent = (event) => {
  const now = new Date();

  const tickets = event.ticketTypes.map((ticket) => ({
    ...ticket,

    formattedPrice: formatPrice(ticket.priceCents),

    isOnSale: isTicketOnSale(ticket, now),

    sessionIds: ticket.includesAllSessions
      ? event.sessions.map((session) => session.id)
      : ticket.sessions.map((session) => session.sessionId),
  }));

  const currentTickets = tickets.filter((ticket) => ticket.isOnSale);

  const startingPriceCents = currentTickets.length
    ? Math.min(...currentTickets.map((ticket) => ticket.priceCents))
    : null;

  const registrationOpen =
    event.registrationEnabled &&
    event.status === "PUBLISHED" &&
    event.endDate >= getToday() &&
    (!event.endsAt || now < event.endsAt) &&
    (!event.registrationOpensAt || now >= event.registrationOpensAt) &&
    (!event.registrationClosesAt || now < event.registrationClosesAt) &&
    currentTickets.length > 0;

  return {
    ...event,

    ticketTypes: tickets,

    startingPriceCents,

    startingPrice:
      startingPriceCents !== null ? formatPrice(startingPriceCents) : null,

    registrationOpen,

    sessionCount: event.sessions.length,

    ticketTypeCount: tickets.length,
  };
};

// ==========================================
// GET PUBLIC EVENTS
// ==========================================

export const getPublicEventsService = async ({
  featured = false,
  hero = false,
} = {}) => {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",

      endDate: {
        gte: getToday(),
      },

      ...(featured ? { featured: true } : {}),
      ...(hero ? { showInHero: true } : {}),
    },

    select: publicEventSelect,

    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
  });

  return events.map(formatPublicEvent);
};

// ==========================================
// GET PUBLIC EVENT BY SLUG
// ==========================================

export const getPublicEventBySlugService = async (slug) => {
  const event = await prisma.event.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },

    select: publicEventSelect,
  });

  if (!event) {
    return null;
  }

  return formatPublicEvent(event);
};

// ==========================================
// MANAGER - GET ALL EVENTS
// ==========================================

export const getManagerEventsService = async () => {
  const events = await prisma.event.findMany({
    include: {
      sessions: {
        orderBy: [{ sessionDate: "asc" }, { sortOrder: "asc" }],
        include: {
          room: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

      ticketTypes: {
        orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
        include: {
          sessions: true,
        },
      },

      bookings: {
        where: {
          status: {
            not: "CANCELLED",
          },
        },
        select: {
          status: true,
          totalCents: true,
          paidCents: true,
          items: {
            select: {
              quantity: true,
            },
          },
        },
      },

      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },

    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
  });

  const formattedEvents = events.map((event) => {
    const { bookings, ...eventData } = event;

    const totalTickets = bookings.reduce(
      (total, booking) =>
        total + booking.items.reduce((sum, item) => sum + item.quantity, 0),
      0,
    );

    const totalRevenueCents = bookings.reduce(
      (total, booking) => total + booking.paidCents,
      0,
    );

    const totalReservedCents = bookings.reduce(
      (total, booking) => total + booking.totalCents,
      0,
    );

    return {
      ...eventData,

      sessionCount: event.sessions.length,
      ticketTypeCount: event.ticketTypes.length,

      bookingCount: bookings.length,

      confirmedBookings: bookings.filter(
        (booking) => booking.status === "CONFIRMED",
      ).length,

      pendingBookings: bookings.filter(
        (booking) => booking.status === "PENDING",
      ).length,

      totalTickets,
      totalRevenueCents,
      totalReservedCents,

      totalRevenue: formatPrice(totalRevenueCents),
      totalReserved: formatPrice(totalReservedCents),
    };
  });

  const summary = {
    total: events.length,

    published: events.filter((event) => event.status === "PUBLISHED").length,

    drafts: events.filter((event) => event.status === "DRAFT").length,

    cancelled: events.filter((event) => event.status === "CANCELLED").length,

    completed: events.filter((event) => event.status === "COMPLETED").length,

    archived: events.filter((event) => event.status === "ARCHIVED").length,

    totalBookings: formattedEvents.reduce(
      (total, event) => total + event.bookingCount,
      0,
    ),

    totalTickets: formattedEvents.reduce(
      (total, event) => total + event.totalTickets,
      0,
    ),

    totalRevenueCents: formattedEvents.reduce(
      (total, event) => total + event.totalRevenueCents,
      0,
    ),
  };

  return {
    events: formattedEvents,

    summary: {
      ...summary,
      totalRevenue: formatPrice(summary.totalRevenueCents),
    },
  };
};
