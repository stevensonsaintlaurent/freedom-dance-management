export const TIME_ZONE = "America/Los_Angeles";

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export const apiError = (message, statusCode = 400) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.status = statusCode;

  return error;
};

export const parseDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw apiError("Date must use YYYY-MM-DD format.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw apiError("Invalid calendar date.");
  }

  return date;
};

export const addDays = (date, days) => {
  const result = parseDate(date);

  result.setUTCDate(result.getUTCDate() + days);

  return result.toISOString().slice(0, 10);
};

export const getDayOfWeek = (date) => DAY_NAMES[parseDate(date).getUTCDay()];

const getLocalParts = (date) =>
  Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

export const getTodayInVegas = () => {
  const parts = getLocalParts(new Date());

  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const parseTime = (value) => {
  if (typeof value !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw apiError("Time must use HH:mm format.");
  }

  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
};

// Convert Las Vegas wall-clock time into a UTC instant.
// Reject ambiguous or nonexistent daylight-saving times.

export const localToUtc = (date, minutes) => {
  if (!Number.isSafeInteger(minutes) || minutes < 0) {
    throw apiError("Invalid time in minutes.");
  }

  const base = parseDate(date);

  base.setUTCMinutes(minutes);

  const target = base.toISOString().slice(0, 16);

  const matches = [];

  // Las Vegas uses UTC-7 or UTC-8.
  for (const offset of [7, 8]) {
    const candidate = new Date(base.getTime() + offset * 60 * 60 * 1000);

    const parts = getLocalParts(candidate);

    const local =
      `${parts.year}-${parts.month}-${parts.day}` +
      `T${parts.hour}:${parts.minute}`;

    if (local === target) {
      matches.push(candidate);
    }
  }

  if (matches.length !== 1) {
    throw apiError(
      "This time is ambiguous or unavailable due to daylight saving time.",
      422,
    );
  }

  return matches[0];
};

export const getDayRange = (date) => ({
  startsAt: localToUtc(date, 0),
  endsAt: localToUtc(date, 1440),
});

export const overlaps = (firstStart, firstEnd, secondStart, secondEnd) =>
  firstStart < secondEnd && firstEnd > secondStart;
