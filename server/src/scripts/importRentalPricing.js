import prisma from "../lib/prisma.js";

const defaultPolicies = {
  minimumMinutes: 60,
  billingIncrementMinutes: 60,
  depositBasisPoints: 5000,
  depositRefundable: false,
  cleaningFeeCents: 0,
  requiresQuote: false,
  isActive: true,
};

const pricingRules = [
  // ==========================================
  // WEEKDAY PRICING
  // ==========================================

  {
    name: "Weekday Morning",
    scope: "SINGLE_ROOM",
    dayType: "WEEKDAY",
    startTimeMinutes: 540,
    endTimeMinutes: 720,
    hourlyRateCents: 2000,
  },
  {
    name: "Weekday Afternoon",
    scope: "SINGLE_ROOM",
    dayType: "WEEKDAY",
    startTimeMinutes: 720,
    endTimeMinutes: 1080,
    hourlyRateCents: 3000,
  },
  {
    name: "Weekday Evening",
    scope: "SINGLE_ROOM",
    dayType: "WEEKDAY",
    startTimeMinutes: 1080,
    endTimeMinutes: 1260,
    hourlyRateCents: 5000,
  },

  // ==========================================
  // WEEKEND PRICING
  // ==========================================

  {
    name: "Weekend Morning",
    scope: "SINGLE_ROOM",
    dayType: "WEEKEND",
    startTimeMinutes: 540,
    endTimeMinutes: 720,
    hourlyRateCents: 3000,
  },
  {
    name: "Weekend Afternoon",
    scope: "SINGLE_ROOM",
    dayType: "WEEKEND",
    startTimeMinutes: 720,
    endTimeMinutes: 1080,
    hourlyRateCents: 4000,
  },
  {
    name: "Weekend Evening",
    scope: "SINGLE_ROOM",
    dayType: "WEEKEND",
    startTimeMinutes: 1080,
    endTimeMinutes: 1260,
    hourlyRateCents: 7000,
  },

  // ==========================================
  // ENTIRE STUDIO
  // ==========================================

  {
    name: "Entire Studio Rental",
    description: "Exclusive access to both studio rooms.",
    scope: "ENTIRE_STUDIO",
    dayType: "EVERY_DAY",
    startTimeMinutes: 540,
    endTimeMinutes: 1260,
    hourlyRateCents: 12000,
  },

  // ==========================================
  // LARGE GROUP RENTAL
  // ==========================================

  {
    name: "Large Group Rental",
    description: "Large group rental with a mandatory one-time cleaning fee.",
    scope: "LARGE_GROUP",
    dayType: "EVERY_DAY",
    startTimeMinutes: 540,
    endTimeMinutes: 1260,
    hourlyRateCents: 12000,
    cleaningFeeCents: 12000,
    minimumGuestCount: null,
  },

  // ==========================================
  // AFTER-HOURS RENTALS
  // ==========================================

  {
    name: "Single Room After Hours",
    scope: "SINGLE_ROOM",
    dayType: "EVERY_DAY",
    startTimeMinutes: 1260,
    endTimeMinutes: 1440,
    hourlyRateCents: null,
    requiresQuote: true,
  },
  {
    name: "Entire Studio After Hours",
    scope: "ENTIRE_STUDIO",
    dayType: "EVERY_DAY",
    startTimeMinutes: 1260,
    endTimeMinutes: 1440,
    hourlyRateCents: null,
    requiresQuote: true,
  },
  {
    name: "Large Group After Hours",
    scope: "LARGE_GROUP",
    dayType: "EVERY_DAY",
    startTimeMinutes: 1260,
    endTimeMinutes: 1440,
    hourlyRateCents: null,
    requiresQuote: true,
    cleaningFeeCents: 12000,
    minimumGuestCount: null,
  },
];

const formatTime = (minutes) => {
  if (minutes === 1440) return "12:00 AM (+1 day)";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours % 12 || 12}:${String(mins).padStart(
    2,
    "0",
  )} ${hours >= 12 ? "PM" : "AM"}`;
};

async function main() {
  console.log("\nImporting Freedom Dance Studio rental pricing...\n");

  await prisma.$transaction(
    pricingRules.map((rule) =>
      prisma.rentalPricingRule.upsert({
        where: {
          scope_dayType_startTimeMinutes_endTimeMinutes: {
            scope: rule.scope,
            dayType: rule.dayType,
            startTimeMinutes: rule.startTimeMinutes,
            endTimeMinutes: rule.endTimeMinutes,
          },
        },

        // Preserve existing manager-configured pricing.
        update: {},

        create: {
          ...defaultPolicies,
          ...rule,
        },
      }),
    ),
  );

  const rules = await prisma.rentalPricingRule.findMany({
    orderBy: [
      { scope: "asc" },
      { dayType: "asc" },
      { startTimeMinutes: "asc" },
    ],
  });

  console.table(
    rules.map((rule) => ({
      name: rule.name,
      day: rule.dayType,
      from: formatTime(rule.startTimeMinutes),
      to: formatTime(rule.endTimeMinutes),
      rate: rule.requiresQuote
        ? "Custom Quote"
        : rule.hourlyRateCents === null
          ? "Not configured"
          : `$${(rule.hourlyRateCents / 100).toFixed(2)}/hr`,
      cleaning: `$${(rule.cleaningFeeCents / 100).toFixed(2)}`,
      deposit: `${rule.depositBasisPoints / 100}%`,
      status: rule.isActive ? "ACTIVE" : "INACTIVE",
    })),
  );

  console.log(`\nTotal pricing rules in database: ${rules.length}`);
  console.log("Rental pricing initialized successfully!\n");
}

main()
  .catch((error) => {
    console.error("Rental pricing import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
