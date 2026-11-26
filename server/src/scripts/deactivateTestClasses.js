import "dotenv/config";
import prisma from "../lib/prisma.js";

const APPLY = process.argv.includes("--apply");

const TEST_CLASSES = [
  {
    id: "1a0ee23e-0331-4236-829d-3aa36f1d99e6",
    title: "Bachata",
  },
  {
    id: "86b8c7d7-f53d-471f-9ab3-6430996bd5cc",
    title: "bachata",
  },
  {
    id: "4e231388-4fe5-4d31-a9a3-a409bcd21af3",
    title: "salsa on 2",
  },
];

async function main() {
  console.log("\n======================================");
  console.log("FREEDOM DANCE STUDIO");
  console.log("DEACTIVATE TEST CLASSES");
  console.log("======================================");

  console.log("MODE:", APPLY ? "APPLY CHANGES" : "PREVIEW ONLY");

  const result = await prisma.$transaction(
    async (tx) => {
      const classes = await tx.weeklyClass.findMany({
        where: {
          id: {
            in: TEST_CLASSES.map((item) => item.id),
          },
        },
        include: {
          instructor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          bookings: {
            select: {
              id: true,
              status: true,
              classDate: true,
              paidAt: true,
            },
          },
        },
      });

      if (classes.length !== TEST_CLASSES.length) {
        throw new Error(
          "Some test classes could not be found. No changes made.",
        );
      }

      for (const expected of TEST_CLASSES) {
        const existing = classes.find((item) => item.id === expected.id);

        if (existing.title !== expected.title) {
          throw new Error(
            `Class title changed: ${expected.title}. Manual review required.`,
          );
        }
      }

      console.log("\nTEST CLASSES\n");

      console.table(
        classes.map((item) => ({
          title: item.title,
          instructor: `${item.instructor.firstName} ${item.instructor.lastName}`,
          bookings: item.bookings.length,
          active: item.isActive,
          action: item.isActive ? "DEACTIVATE" : "ALREADY INACTIVE",
        })),
      );

      console.log("\nASSOCIATED BOOKINGS\n");

      const bookings = classes.flatMap((item) =>
        item.bookings.map((booking) => ({
          class: item.title,
          bookingId: booking.id,
          date: booking.classDate.toISOString().slice(0, 10),
          status: booking.status,
          paid: Boolean(booking.paidAt),
        })),
      );

      console.table(bookings);

      if (bookings.some((booking) => booking.paid)) {
        throw new Error("Paid bookings found. Manual review required.");
      }

      if (!APPLY) {
        return {
          deactivated: 0,
          bookingsPreserved: bookings.length,
        };
      }

      const updated = await tx.weeklyClass.updateMany({
        where: {
          id: {
            in: TEST_CLASSES.map((item) => item.id),
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      return {
        deactivated: updated.count,
        bookingsPreserved: bookings.length,
      };
    },
    {
      isolationLevel: "Serializable",
      maxWait: 10000,
      timeout: 20000,
    },
  );

  console.log("\nSUMMARY\n");

  console.table([result]);

  if (!APPLY) {
    console.log("\nPreview completed. No database changes made.");
  } else {
    console.log("\nTest classes successfully deactivated.");
  }
}

main()
  .catch((error) => {
    console.error("\nERROR:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
