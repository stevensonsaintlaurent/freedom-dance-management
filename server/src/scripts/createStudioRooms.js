import prisma from "../lib/prisma.js";

const rooms = [
  {
    name: "Room 1",
    description:
      "Multipurpose studio space available for private events, dance classes, private lessons, workshops, rehearsals, fitness classes, and other activities.",
  },
  {
    name: "Room 2",
    description:
      "Multipurpose studio space available for private events, dance classes, private lessons, workshops, rehearsals, fitness classes, and other activities.",
  },
];

async function main() {
  console.log("\nInitializing Freedom Dance Studio rooms...\n");

  for (const room of rooms) {
    const result = await prisma.studioRoom.upsert({
      where: {
        name: room.name,
      },
      update: {},
      create: {
        name: room.name,
        description: room.description,
        isActive: true,
      },
    });

    console.log(`Room ready: ${result.name}`);
  }

  const studioRooms = await prisma.studioRoom.findMany({
    orderBy: {
      name: "asc",
    },
  });

  console.table(
    studioRooms.map((room) => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity ?? "Not configured",
      status: room.isActive ? "ACTIVE" : "INACTIVE",
    })),
  );

  console.log("\nStudio rooms initialized successfully!");
}

main()
  .catch((error) => {
    console.error("Failed to initialize studio rooms:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
