import "dotenv/config";
import prisma from "../lib/prisma.js";

async function main() {
  const classes = await prisma.weeklyClass.findMany({
    include: {
      instructor: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      room: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTimeMinutes: "asc" }],
  });

  console.log("\nEXISTING WEEKLY CLASSES\n");

  console.table(
    classes.map((item) => ({
      id: item.id,
      title: item.title,
      day: item.dayOfWeek,
      time: `${String(Math.floor(item.startTimeMinutes / 60)).padStart(
        2,
        "0",
      )}:${String(item.startTimeMinutes % 60).padStart(2, "0")}`,
      instructor: `${item.instructor.firstName} ${item.instructor.lastName}`,
      room: item.room?.name || "Unassigned",
      bookings: item._count.bookings,
      active: item.isActive,
    })),
  );

  console.log("Total classes:", classes.length);
  console.log(
    "Active classes:",
    classes.filter((item) => item.isActive).length,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
