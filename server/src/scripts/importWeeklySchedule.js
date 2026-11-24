import "dotenv/config";
import prisma from "../lib/prisma.js";
import { weeklySchedule } from "../data/weeklySchedule.js";

const apply = process.argv.includes("--apply");
const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
// Optional: enter exact account emails if a name is ambiguous or different.
const instructorEmails = {
  Stevenson: "saintlaurentstevenson@gmail.com",
  Luna: "luna@gmail.com",
  Zagir: "zagir@gmail.com",
  Desmond: "desmon@gmail.com",
};
const aliases = { Stevenson: ["stevenson", "steven"] };

async function main() {
  const result = await prisma.$transaction(
    async (tx) => {
      const users = await tx.user.findMany({
        where: {
          isActive: true,
          role: { in: ["INSTRUCTOR", "MANAGER", "ADMIN"] },
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
      for (const name of new Set(weeklySchedule.map((c) => c.instructor))) {
        const email = normalize(instructorEmails[name]);
        const names = aliases[name] ?? [normalize(name)];
        const matches = users.filter((u) =>
          email
            ? normalize(u.email) === email
            : names.includes(normalize(u.firstName)) ||
              names.includes(normalize(`${u.firstName} ${u.lastName}`)),
        );
        if (matches.length !== 1)
          throw new Error(
            `${name}: found ${matches.length} matching active staff accounts. Set the exact email in instructorEmails and retry.`,
          );
        ids.set(name, matches[0].id);
        console.log(
          `Matched ${name}: ${matches[0].firstName} ${matches[0].lastName} (${matches[0].role})`,
        );
      }
      const existing = await tx.weeklyClass.findMany();
      const planned = [];
      const report = [];
      for (const { legacyId, instructor, ...fields } of weeklySchedule) {
        const data = { ...fields, instructorId: ids.get(instructor) };
        const sameSlot = existing.filter(
          (c) =>
            c.dayOfWeek === data.dayOfWeek &&
            c.startTimeMinutes === data.startTimeMinutes,
        );
        const matches = sameSlot.filter(
          (c) => normalize(c.title) === normalize(data.title),
        );
        if (matches.length > 1)
          throw new Error(
            `Multiple existing matches for ${data.title} on ${data.dayOfWeek}. Review manually.`,
          );
        let action = "CREATE";
        if (matches.length === 1) {
          const c = matches[0];
          action =
            c.isActive &&
            ["instructorId", "durationMinutes", "priceCents", "level"].every(
              (k) => c[k] === data[k],
            )
              ? "SKIP (existing)"
              : "REVIEW (existing differs)";
        } else if (sameSlot.some((c) => c.instructorId === data.instructorId)) {
          action = "REVIEW (instructor already scheduled)";
        } else {
          planned.push(data);
        }
        report.push({
          day: data.dayOfWeek,
          time: `${Math.floor(data.startTimeMinutes / 60)}:${String(data.startTimeMinutes % 60).padStart(2, "0")}`,
          class: data.title,
          instructor,
          action,
        });
      }
      console.table(report);
      if (report.some((r) => r.action.startsWith("REVIEW")))
        throw new Error(
          "Schedule conflicts require manual review. No changes made.",
        );
      if (apply && planned.length)
        await tx.weeklyClass.createMany({ data: planned });
      return {
        missing: planned.length,
        existing: report.length - planned.length,
      };
    },
    { isolationLevel: "Serializable", timeout: 30000 },
  );
  console.log(
    apply
      ? `Imported ${result.missing} classes; preserved ${result.existing} existing classes.`
      : `Preview only: ${result.missing} to import, ${result.existing} already exist. No changes made.`,
  );
}
main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
