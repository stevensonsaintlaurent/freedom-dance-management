import prisma from "../lib/prisma.js";

const categories = [
  {
    name: "Private Event",
    description: "Private celebrations and special events.",
  },
  {
    name: "Birthday Party",
    description: "Birthday celebrations for children and adults.",
  },
  {
    name: "Wedding Event",
    description: "Wedding celebrations and wedding rehearsals.",
  },
  {
    name: "Dance Class",
    description: "Group dance classes of any dance style.",
  },
  {
    name: "Private Lesson",
    description: "Individual and couples private lessons.",
  },
  {
    name: "Independent Instructor",
    description: "Studio rental for independent instructors.",
  },
  {
    name: "Workshop",
    description: "Dance, fitness, and educational workshops.",
  },
  {
    name: "Dance Social",
    description: "Social dancing and community dance events.",
  },
  {
    name: "Personal Practice",
    description: "Individual or group dance practice.",
  },
  {
    name: "Music Rehearsal",
    description: "Band rehearsals and musical activities.",
  },
  {
    name: "Fitness Class",
    description: "Fitness, yoga, Zumba, and wellness activities.",
  },
  {
    name: "Photography and Video",
    description: "Photography, filming, and content creation.",
  },
  {
    name: "Business Meeting",
    description: "Professional meetings and team activities.",
  },
  {
    name: "Corporate Event",
    description: "Corporate gatherings and private functions.",
  },
  {
    name: "Community Event",
    description: "Community gatherings and nonprofit activities.",
  },
  {
    name: "Audition",
    description: "Dance, music, acting, and performance auditions.",
  },
  {
    name: "Performance",
    description: "Live music, dance, and artistic performances.",
  },
  {
    name: "Other",
    description: "Other activities subject to studio approval.",
  },
];

async function main() {
  console.log("\nImporting Freedom Dance Studio rental categories...\n");

  // Insert all categories in a bulk operation.
  const result = await prisma.rentalCategory.createMany({
    data: categories.map((category) => ({
      ...category,
      isActive: true,
    })),

    // Preserve existing categories and manager configurations.
    skipDuplicates: true,
  });

  console.log(`New categories created: ${result.count}`);

  console.log(
    `Existing categories skipped: ${categories.length - result.count}`,
  );

  // Retrieve all categories from the database.
  const rentalCategories = await prisma.rentalCategory.findMany({
    orderBy: {
      name: "asc",
    },
  });

  console.table(
    rentalCategories.map((category) => ({
      id: category.id,
      name: category.name,
      status: category.isActive ? "ACTIVE" : "INACTIVE",
    })),
  );

  const activeCount = rentalCategories.filter(
    (category) => category.isActive,
  ).length;

  const inactiveCount = rentalCategories.length - activeCount;

  const existingNames = new Set(
    rentalCategories.map((category) => category.name),
  );

  const missingCategories = categories.filter(
    (category) => !existingNames.has(category.name),
  );

  console.log("\n========== IMPORT SUMMARY ==========");
  console.log(`Total categories: ${rentalCategories.length}`);
  console.log(`Active categories: ${activeCount}`);
  console.log(`Inactive categories: ${inactiveCount}`);
  console.log(`Missing categories: ${missingCategories.length}`);
  console.log("====================================\n");

  if (missingCategories.length > 0) {
    throw new Error(
      `Missing categories: ${missingCategories
        .map((category) => category.name)
        .join(", ")}`,
    );
  }

  console.log("Rental categories initialized successfully!\n");
}

main()
  .catch((error) => {
    console.error("Rental category import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
