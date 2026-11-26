import "dotenv/config";
import prisma from "../lib/prisma.js";
import { weeklySchedule } from "../data/weeklySchedule.js";
import { validateWeeklyScheduleImport } from "../services/weeklyClassService.js";

// ======================================================
// CONFIGURATION
// ======================================================

const apply = process.argv.includes("--apply");

const PREVIEW_ROLLBACK = new Error("PREVIEW_ROLLBACK");

let previewResult = null;

const instructorEmails = {
  Stevenson: "saintlaurentstevenson@gmail.com",
  Luna: "luna@gmail.com",
  Zagir: "zagir@gmail.com",
  Desmond: "desmon@gmail.com",
};

const aliases = {
  Stevenson: ["stevenson", "steven"],
};

const DEFAULT_CAPACITY = 20;

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

// ======================================================
// UTILITIES
// ======================================================

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const formatTime = (minutes) => {
  if (minutes === 1440) return "12:00 AM";

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return `${hours % 12 || 12}:${String(remaining).padStart(
    2,
    "0",
  )} ${hours >= 12 ? "PM" : "AM"}`;
};

const formatSchedule = (item) =>
  `${formatTime(item.startTimeMinutes)} - ${formatTime(
    item.startTimeMinutes + item.durationMinutes,
  )}`;

const overlaps = (first, second) => {
  if (first.dayOfWeek !== second.dayOfWeek) {
    return false;
  }

  const firstEnd = first.startTimeMinutes + first.durationMinutes;

  const secondEnd = second.startTimeMinutes + second.durationMinutes;

  return (
    first.startTimeMinutes < secondEnd && firstEnd > second.startTimeMinutes
  );
};

// ======================================================
// VALIDATE SOURCE SCHEDULE
// ======================================================

function validateScheduleItem(item) {
  if (!DAYS.includes(item.dayOfWeek)) {
    throw new Error(`Invalid day for "${item.title}".`);
  }

  if (
    !Number.isInteger(item.startTimeMinutes) ||
    item.startTimeMinutes < 0 ||
    item.startTimeMinutes >= 1440
  ) {
    throw new Error(`Invalid starting time for "${item.title}".`);
  }

  if (
    !Number.isInteger(item.durationMinutes) ||
    item.durationMinutes < 15 ||
    item.durationMinutes > 720 ||
    item.startTimeMinutes + item.durationMinutes > 1440
  ) {
    throw new Error(`Invalid duration for "${item.title}".`);
  }

  if (!Number.isInteger(item.priceCents) || item.priceCents < 0) {
    throw new Error(`Invalid price for "${item.title}".`);
  }

  if (!item.roomId) {
    throw new Error(`No studio room configured for "${item.title}".`);
  }
}

// ======================================================
// OPERATING HOURS
// ======================================================

function getOperatingHoursWarning(room, item) {
  if (!room.operatingHours.length) {
    return "Operating hours not configured";
  }

  const windows = room.operatingHours
    .filter((window) => window.dayOfWeek === item.dayOfWeek)
    .sort((a, b) => a.opensAtMinutes - b.opensAtMinutes);

  const end = item.startTimeMinutes + item.durationMinutes;

  let coveredUntil = item.startTimeMinutes;

  for (const window of windows) {
    if (window.closesAtMinutes <= coveredUntil) {
      continue;
    }

    if (window.opensAtMinutes > coveredUntil) {
      break;
    }

    coveredUntil = Math.max(coveredUntil, window.closesAtMinutes);

    if (coveredUntil >= end) {
      return "";
    }
  }

  return "Outside regular operating hours";
}

// ======================================================
// MATCH EXISTING INSTRUCTORS
// ======================================================

async function getInstructorIds(tx) {
  const users = await tx.user.findMany({
    where: {
      isActive: true,
      role: {
        in: ["INSTRUCTOR", "MANAGER", "ADMIN"],
      },
    },

    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  });

  const ids = new Map();

  const names = new Set(weeklySchedule.map((item) => item.instructor));

  for (const name of names) {
    const email = normalize(instructorEmails[name]);

    const acceptedNames = aliases[name] ?? [normalize(name)];

    const matches = users.filter((user) =>
      email
        ? normalize(user.email) === email
        : acceptedNames.includes(normalize(user.firstName)) ||
          acceptedNames.includes(
            normalize(`${user.firstName} ${user.lastName}`),
          ),
    );

    if (matches.length !== 1) {
      throw new Error(
        `${name}: found ${matches.length} matching ` +
          "active staff accounts. " +
          "Check instructorEmails and retry.",
      );
    }

    const instructor = matches[0];

    ids.set(name, instructor.id);

    console.log(
      `Matched ${name}: ` +
        `${instructor.firstName} ` +
        `${instructor.lastName} ` +
        `(${instructor.role})`,
    );
  }

  return ids;
}

// ======================================================
// MAIN IMPORT
// ======================================================

async function main() {
  console.log("\n======================================");
  console.log("FREEDOM DANCE STUDIO");
  console.log("WEEKLY SCHEDULE IMPORT");
  console.log("======================================");

  console.log(apply ? "MODE: APPLY" : "MODE: PREVIEW ONLY");

  console.log(`Source activities: ${weeklySchedule.length}\n`);

  weeklySchedule.forEach(validateScheduleItem);

  const result = await prisma
    .$transaction(
      async (tx) => {
        // ==============================================
        // LOAD EXISTING DATA
        // ==============================================

        const instructorIds = await getInstructorIds(tx);

        const rooms = await tx.studioRoom.findMany({
          where: {
            isActive: true,
          },

          include: {
            operatingHours: true,
          },
        });

        const roomMap = new Map(rooms.map((room) => [room.id, room]));

        const existing = await tx.weeklyClass.findMany({
          include: {
            instructor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },

            room: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        const plannedCreates = [];
        const plannedUpdates = [];
        const report = [];
        const review = [];
        const warnings = [];

        const matchedIds = new Set();
        const sourceKeys = new Set();

        // ==============================================
        // PREPARE SCHEDULE ENTRIES
        // ==============================================

        for (const item of weeklySchedule) {
          const { legacyId, instructor, ...fields } = item;

          const sourceKey = JSON.stringify([
            fields.dayOfWeek,
            fields.startTimeMinutes,
            normalize(fields.title),
          ]);

          if (sourceKeys.has(sourceKey)) {
            throw new Error(`Duplicate source entry: "${fields.title}".`);
          }

          sourceKeys.add(sourceKey);

          const room = roomMap.get(fields.roomId);

          if (!room) {
            throw new Error(
              `Room not found or inactive for ` + `"${item.title}".`,
            );
          }

          const data = {
            ...fields,
            instructorId: instructorIds.get(instructor),
          };

          const matches = existing.filter(
            (weeklyClass) =>
              weeklyClass.dayOfWeek === data.dayOfWeek &&
              weeklyClass.startTimeMinutes === data.startTimeMinutes &&
              normalize(weeklyClass.title) === normalize(data.title),
          );

          let action = "";
          let capacity = DEFAULT_CAPACITY;

          // ============================================
          // EXISTING CLASS MATCHES
          // ============================================

          if (matches.length > 1) {
            action = "REVIEW";

            review.push(
              `Multiple existing matches for ` +
                `"${data.title}" on ${data.dayOfWeek}.`,
            );
          } else if (matches.length === 1) {
            const current = matches[0];

            capacity = current.capacity;

            if (matchedIds.has(current.id)) {
              throw new Error(
                `Duplicate source entry for ` + `"${data.title}".`,
              );
            }

            matchedIds.add(current.id);

            const sameDetails = [
              "instructorId",
              "durationMinutes",
              "priceCents",
              "level",
            ].every((key) => current[key] === data[key]);

            if (!current.isActive || !sameDetails) {
              action = "REVIEW";

              review.push(
                `"${data.title}" exists but its ` +
                  "details differ. Existing record " +
                  "will not be overwritten.",
              );
            } else if (current.roomId === data.roomId) {
              action = "SKIP";
            } else if (!current.roomId) {
              action = "ASSIGN ROOM";

              plannedUpdates.push({
                id: current.id,
                roomId: data.roomId,
              });
            } else {
              action = "REVIEW";

              review.push(
                `"${data.title}" already has room ` +
                  `"${current.room?.name || current.roomId}". ` +
                  `Source proposes "${room.name}".`,
              );
            }
          } else {
            action = "CREATE";

            plannedCreates.push({
              ...data,
              capacity: DEFAULT_CAPACITY,
              isActive: true,
            });
          }

          // ============================================
          // CAPACITY VALIDATION
          // ============================================

          if (room.capacity != null && capacity > room.capacity) {
            action = "REVIEW";

            review.push(
              `"${data.title}" capacity (${capacity}) ` +
                `exceeds ${room.name} capacity ` +
                `(${room.capacity}).`,
            );
          }

          // ============================================
          // OPERATING HOURS WARNINGS
          // ============================================

          const operatingWarning = getOperatingHoursWarning(room, data);

          if (operatingWarning) {
            warnings.push({
              class: data.title,
              day: data.dayOfWeek,
              time: formatSchedule(data),
              room: room.name,
              warning: operatingWarning,
            });
          }

          if (room.capacity == null) {
            warnings.push({
              class: data.title,
              day: data.dayOfWeek,
              time: formatSchedule(data),
              room: room.name,
              warning: "Room capacity not configured",
            });
          }

          report.push({
            legacyId,
            day: data.dayOfWeek,
            time: formatSchedule(data),
            class: data.title,
            instructor,
            room: room.name,
            action,
          });
        }

        // ==============================================
        // BUILD PROPOSED FINAL SCHEDULE
        // ==============================================

        const updateMap = new Map(
          plannedUpdates.map((item) => [item.id, item.roomId]),
        );

        const finalSchedule = [
          ...existing
            .filter((item) => item.isActive)
            .map((item) => ({
              ...item,

              roomId: updateMap.has(item.id)
                ? updateMap.get(item.id)
                : item.roomId,

              affected: updateMap.has(item.id),
            })),

          ...plannedCreates.map((item, index) => ({
            ...item,
            id: `planned-${index}`,
            affected: true,
          })),
        ];

        // ==============================================
        // CHECK WEEKLY SCHEDULING CONFLICTS
        // ==============================================

        const conflicts = [];

        for (let i = 0; i < finalSchedule.length; i++) {
          for (let j = i + 1; j < finalSchedule.length; j++) {
            const first = finalSchedule[i];
            const second = finalSchedule[j];

            if (!first.affected && !second.affected) {
              continue;
            }

            if (!overlaps(first, second)) {
              continue;
            }

            if (first.instructorId === second.instructorId) {
              conflicts.push({
                type: "INSTRUCTOR",
                day: first.dayOfWeek,
                first: first.title,
                second: second.title,
                reason: "Instructor double-booking",
              });
            }

            if (
              !first.roomId ||
              !second.roomId ||
              first.roomId === second.roomId
            ) {
              conflicts.push({
                type: "ROOM",
                day: first.dayOfWeek,
                first: first.title,
                second: second.title,

                reason:
                  !first.roomId || !second.roomId
                    ? "Unassigned class blocks both rooms"
                    : "Same room at overlapping times",
              });
            }
          }
        }

        // ==============================================
        // PRINT IMPORT REPORT
        // ==============================================

        console.log("\nWEEKLY SCHEDULE\n");

        console.table(report);

        if (warnings.length) {
          console.log("\nSCHEDULING WARNINGS\n");
          console.table(warnings);
        }

        if (review.length) {
          console.log("\nMANUAL REVIEW REQUIRED\n");

          review.forEach((message) => {
            console.log(`- ${message}`);
          });
        }

        if (conflicts.length) {
          console.log("\nSCHEDULING CONFLICTS\n");
          console.table(conflicts);
        }

        const summary = {
          sourceActivities: weeklySchedule.length,
          create: plannedCreates.length,
          assignRooms: plannedUpdates.length,

          preserved: report.filter((item) => item.action === "SKIP").length,

          review: review.length,
          conflicts: conflicts.length,
          warnings: warnings.length,
        };

        console.log("\nIMPORT SUMMARY\n");

        console.table([summary]);

        if (review.length || conflicts.length) {
          throw new Error(
            "Manual review required. " + "No database changes made.",
          );
        }

        // ==============================================
        // STAGE DATABASE CHANGES
        // ==============================================

        const affectedClasses = [];

        for (const data of plannedCreates) {
          const created = await tx.weeklyClass.create({
            data,
          });

          affectedClasses.push(created);
        }

        for (const update of plannedUpdates) {
          const updated = await tx.weeklyClass.update({
            where: {
              id: update.id,
            },

            data: {
              roomId: update.roomId,
            },
          });

          affectedClasses.push(updated);
        }

        // ==============================================
        // FINAL DATABASE CONFLICT VALIDATION
        // ==============================================

        console.log("\nFINAL CONFLICT VALIDATION\n");

        for (const weeklyClass of affectedClasses) {
          try {
            await validateWeeklyScheduleImport(tx, weeklyClass, weeklyClass.id);

            console.log(
              `PASS: ${weeklyClass.dayOfWeek} - ` + `${weeklyClass.title}`,
            );
          } catch (error) {
            throw new Error(
              `${weeklyClass.dayOfWeek} - ` +
                `${weeklyClass.title}: ` +
                error.message,
            );
          }
        }

        const finalResult = {
          ...summary,
          validated: affectedClasses.length,
        };

        // ==============================================
        // PREVIEW MODE: ROLLBACK
        // ==============================================

        if (!apply) {
          previewResult = finalResult;

          throw PREVIEW_ROLLBACK;
        }

        // ==============================================
        // APPLY MODE: COMMIT
        // ==============================================

        return finalResult;
      },

      {
        isolationLevel: "Serializable",
        maxWait: 10000,
        timeout: 120000,
      },
    )
    .catch((error) => {
      if (error === PREVIEW_ROLLBACK && !apply && previewResult) {
        return previewResult;
      }

      throw error;
    });

  // ====================================================
  // FINAL RESULTS
  // ====================================================

  console.log(
    apply
      ? "\nIMPORT COMPLETED SUCCESSFULLY"
      : "\nPREVIEW COMPLETED SUCCESSFULLY",
  );

  console.table([result]);

  console.log(
    `${result.create} new activities ${
      apply ? "imported" : "ready to import"
    }.`,
  );

  console.log(
    `${result.assignRooms} existing activities ${
      apply ? "updated" : "ready for room assignments"
    }.`,
  );

  console.log(`${result.preserved} existing activities preserved.`);

  console.log(`Final validation passed: ` + `${result.validated} activities.`);

  if (apply) {
    console.log("\nDatabase changes committed successfully.");
  } else {
    console.log("\nPreview rolled back. " + "No database changes committed.");
  }
}

// ======================================================
// EXECUTE SCRIPT
// ======================================================

main()
  .catch((error) => {
    console.error(`\nERROR: ${error.message}`);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
