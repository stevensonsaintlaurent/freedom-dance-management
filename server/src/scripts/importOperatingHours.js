import prisma from "../lib/prisma.js";

const weeklyOperatingHours = [
  {
    dayOfWeek: "MONDAY",
    opensAtMinutes: 540,
    closesAtMinutes: 1260,
  },
  {
    dayOfWeek: "TUESDAY",
    opensAtMinutes: 540,
    closesAtMinutes: 1260,
  },
  {
    dayOfWeek: "WEDNESDAY",
    opensAtMinutes: 540,
    closesAtMinutes: 1260,
  },
  {
    dayOfWeek: "THURSDAY",
    opensAtMinutes: 540,
    closesAtMinutes: 1260,
  },
  {
    dayOfWeek: "FRIDAY",
    opensAtMinutes: 540,
    closesAtMinutes: 1260,
  },
  {
    dayOfWeek: "SATURDAY",
    opensAtMinutes: 540,
    closesAtMinutes: 1140,
  },
];

// Sunday is closed, so no operating window is created.

const formatTime = (minutes) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const importOperatingHours = async () => {
  try {
    console.log("\nInitializing studio operating hours...\n");

    const rooms = await prisma.studioRoom.findMany({
      where: {
        isActive: true,
      },
      include: {
        operatingHours: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    if (rooms.length !== 2) {
      throw new Error("Expected exactly two active studio rooms.");
    }

    let created = 0;
    let skipped = 0;

    for (const room of rooms) {
      console.log(`\n${room.name}`);
      console.log("--------------------------------");

      // Preserve any existing custom schedule.
      if (room.operatingHours.length > 0) {
        console.log("Operating hours already configured. Skipping.");

        skipped++;
        continue;
      }

      const result = await prisma.roomOperatingHours.createMany({
        data: weeklyOperatingHours.map((hours) => ({
          roomId: room.id,
          ...hours,
        })),
        skipDuplicates: true,
      });

      created += result.count;

      for (const hours of weeklyOperatingHours) {
        console.log(
          `${hours.dayOfWeek.padEnd(12)} ` +
            `${formatTime(hours.opensAtMinutes)} - ` +
            `${formatTime(hours.closesAtMinutes)}`,
        );
      }

      console.log("SUNDAY       CLOSED");
    }

    console.log("\n================================");
    console.log("OPERATING HOURS IMPORT SUMMARY");
    console.log("================================");

    console.log(`Active rooms: ${rooms.length}`);
    console.log(`Operating windows created: ${created}`);
    console.log(`Existing schedules skipped: ${skipped}`);

    console.log("\nOperating hours initialized successfully!");
  } catch (error) {
    console.error("\nOperating hours import failed:", error);

    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

importOperatingHours();
