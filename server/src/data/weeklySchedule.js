const ROOMS = {
  LARGE: "f5b33239-2d64-44dc-a466-d0efc8b508c2",
  SMALL: "ca895f83-b4a3-47b6-9c69-0becc3bf50e9",
};

export const weeklySchedule = [
  // ====================================================
  // MONDAY
  // ====================================================

  [
    1,
    "MONDAY",
    1080,
    "Beginner Kizomba",
    "Stevenson",
    0,
    "BEGINNER",
    60,
    ROOMS.LARGE,
  ],
  [
    2,
    "MONDAY",
    1080,
    "Ladies Styling Bachata",
    "Luna",
    1500,
    "BEGINNER",
    60,
    ROOMS.SMALL,
  ],
  [
    3,
    "MONDAY",
    1140,
    "Beginner Bachata",
    "Stevenson",
    1500,
    "BEGINNER",
    60,
    ROOMS.LARGE,
  ],
  [
    13,
    "MONDAY",
    1200,
    "Beginner Bachata Man Styling",
    "Stevenson",
    1500,
    "BEGINNER",
    90,
    ROOMS.LARGE,
  ],

  // ====================================================
  // TUESDAY
  // ====================================================

  [
    4,
    "TUESDAY",
    1080,
    "Beginner Salsa",
    "Stevenson",
    1500,
    "BEGINNER",
    60,
    ROOMS.LARGE,
  ],
  [
    5,
    "TUESDAY",
    1140,
    "Beginner Bachata",
    "Stevenson",
    1500,
    "BEGINNER",
    60,
    ROOMS.LARGE,
  ],
  [
    6,
    "TUESDAY",
    1200,
    "Konpa",
    "Stevenson",
    1500,
    "OPEN_LEVEL",
    60,
    ROOMS.LARGE,
  ],

  // ====================================================
  // WEDNESDAY
  // ====================================================

  [
    7,
    "WEDNESDAY",
    1080,
    "Intermediate & Beyond Kizomba",
    "Stevenson",
    1500,
    "INTERMEDIATE",
    60,
    ROOMS.LARGE,
  ],
  [
    8,
    "WEDNESDAY",
    1140,
    "Intermediate & Beyond Bachata Sensual",
    "Stevenson",
    1500,
    "INTERMEDIATE",
    60,
    ROOMS.LARGE,
  ],

  // ====================================================
  // THURSDAY
  // ====================================================

  [
    9,
    "THURSDAY",
    1110,
    "Ladies Styling Bachata",
    "Zagir",
    1500,
    "BEGINNER",
    60,
    ROOMS.LARGE,
  ],

  // ====================================================
  // SATURDAY
  // ====================================================

  [
    10,
    "SATURDAY",
    840,
    "Open Level Kizomba",
    "Stevenson",
    1500,
    "OPEN_LEVEL",
    60,
    ROOMS.LARGE,
  ],
  [
    11,
    "SATURDAY",
    900,
    "Open Level Bachata",
    "Stevenson",
    1500,
    "OPEN_LEVEL",
    60,
    ROOMS.LARGE,
  ],
  [
    12,
    "SATURDAY",
    960,
    "Beginner Salsa",
    "Desmond",
    1500,
    "BEGINNER",
    60,
    ROOMS.LARGE,
  ],
  [
    15,
    "SATURDAY",
    1020,
    "Intermediate & Beyond Salsa",
    "Desmond",
    1500,
    "INTERMEDIATE",
    60,
    ROOMS.LARGE,
  ],
  [
    14,
    "SATURDAY",
    1080,
    "Jazz Band",
    "Stevenson",
    0,
    "OPEN_LEVEL",
    90,
    ROOMS.LARGE,
  ],
].map(
  ([
    legacyId,
    dayOfWeek,
    startTimeMinutes,
    title,
    instructor,
    priceCents,
    level,
    durationMinutes,
    roomId,
  ]) => ({
    legacyId,
    dayOfWeek,
    startTimeMinutes,
    title,
    instructor,
    priceCents,
    level,
    durationMinutes,
    roomId,
  }),
);
