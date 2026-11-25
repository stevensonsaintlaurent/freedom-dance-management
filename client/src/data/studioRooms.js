export const studioRooms = [
  {
    id: "f5b33239-2d64-44dc-a466-d0efc8b508c2",
    name: "Room 1",
    displayName: "Large Studio",
    areaSquareFeet: 720,
    minimumGuests: 1,
    recommendedCapacity: 20,
    approvedCapacity: null,
    startingPrice: 20,

    description:
      "A spacious and stylish multipurpose studio featuring a large mirrored wall, wood-look flooring, lounge seating, speakers, and natural lighting. Perfect for dance classes, workshops, private events, rehearsals, and social dancing.",

    amenities: [
      "Large wall mirrors",
      "Wood-look flooring",
      "Sound system",
      "Air conditioning",
      "Chairs and seating",
      "Lounge area",
      "Television",
      "Bar counter",
      "Natural lighting",
      "Acoustic wall panels",
    ],

    photos: [
      "/images/rooms/large-room/large-room-01.jpg",
      "/images/rooms/large-room/large-room-02.jpg",
      "/images/rooms/large-room/large-room-03.jpg",
      "/images/rooms/large-room/large-room-04.jpg",
      "/images/rooms/large-room/large-room-05.jpg",
    ],
  },

  {
    id: "ca895f83-b4a3-47b6-9c69-0becc3bf50e9",
    name: "Room 2",
    displayName: "Small Studio",
    areaSquareFeet: 639,
    minimumGuests: 1,
    recommendedCapacity: 16,
    approvedCapacity: null,
    startingPrice: 20,

    description:
      "A comfortable and versatile dance studio featuring large wall mirrors, wood-look flooring, speakers, and seating. Ideal for private lessons, group classes, rehearsals, independent instructors, personal practice, and workshops.",

    amenities: [
      "Large wall mirrors",
      "Wood-look flooring",
      "Sound system",
      "Chairs and seating",
      "Ceiling lighting",
      "Acoustic wall panels",
    ],

    photos: [
      "/images/rooms/small-room/small-room-01.jpg",
      "/images/rooms/small-room/small-room-02.jpg",
      "/images/rooms/small-room/small-room-03.jpg",
    ],
  },
];

export const entireStudio = {
  name: "Entire Studio",
  areaSquareFeet: 1359,
  minimumGuests: 1,
  recommendedCapacity: 36,
  approvedCapacity: null,
  startingPrice: 120,

  description:
    "Exclusive access to both studio rooms. Perfect for private events, dance intensives, celebrations, workshops, rehearsals, and community gatherings.",
};

export const rentalRates = [
  {
    period: "Morning",
    time: "9:00 AM – 12:00 PM",
    weekday: 20,
    weekend: 30,
  },
  {
    period: "Afternoon",
    time: "12:00 PM – 6:00 PM",
    weekday: 30,
    weekend: 40,
  },
  {
    period: "Evening",
    time: "6:00 PM – 9:00 PM",
    weekday: 50,
    weekend: 70,
  },
  {
    period: "After Hours",
    time: "9:00 PM – Midnight",
    weekday: null,
    weekend: null,
  },
];

export const rentalPolicies = {
  minimumHours: 1,
  billingIncrementHours: 1,
  depositPercentage: 50,
  depositRefundable: false,
  entireStudioHourlyRate: 120,
  largeGroupHourlyRate: 120,
  largeGroupCleaningFee: 120,
};
