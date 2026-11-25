import { useEffect, useMemo, useState } from "react";

import {
  Building2,
  DoorOpen,
  Users,
  CalendarDays,
  Clock,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  MapPin,
  Phone,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Music,
  Camera,
  Sparkles,
  Info,
} from "lucide-react";

import api from "@/api/axios";
import { studioRooms } from "@/data/studioRooms";

// ======================================================
// CONFIGURATION
// ======================================================

const GOLD = "text-[#d4af37]";

const panel = "rounded-2xl border border-zinc-800 bg-zinc-900/60";

const field =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3.5 text-sm text-white outline-none focus:border-[#d4af37]";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-6 py-3.5 font-semibold text-black transition hover:bg-[#e5c45b] disabled:cursor-not-allowed disabled:opacity-50";

const money = (cents) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

const todayInVegas = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const formatTime = (minutes) => {
  if (minutes === 1440) return "Midnight";

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${hour % 12 || 12}:${String(minute).padStart(
    2,
    "0",
  )} ${hour >= 12 ? "PM" : "AM"}`;
};

const toMinutes = (time) => {
  if (!time) return NaN;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const getDayType = (date) => {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();

  return day === 0 || day === 6 ? "WEEKEND" : "WEEKDAY";
};

// ======================================================
// PHOTO GALLERY
// ======================================================

const PhotoGallery = ({ photos = [], name }) => {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const changePhoto = (direction) => {
    setIndex(
      (current) => (current + direction + photos.length) % photos.length,
    );
  };

  useEffect(() => {
    if (!fullscreen || !photos.length) return;

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setFullscreen(false);
      }

      if (event.key === "ArrowRight") {
        setIndex((current) => (current + 1) % photos.length);
      }

      if (event.key === "ArrowLeft") {
        setIndex((current) => (current - 1 + photos.length) % photos.length);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [fullscreen, photos.length]);

  if (!photos.length) {
    return (
      <div className="flex aspect-video items-center justify-center bg-zinc-800">
        <Camera size={42} className="text-zinc-600" />
      </div>
    );
  }

  return (
    <>
      <div className="relative aspect-video overflow-hidden bg-black">
        <img
          src={photos[index]}
          alt={`${name} — photograph ${index + 1}`}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photograph"
              onClick={() => changePhoto(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white hover:bg-black"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              aria-label="Next photograph"
              onClick={() => changePhoto(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white hover:bg-black"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-xs">
          {index + 1} / {photos.length}
        </span>

        <button
          type="button"
          aria-label="Open fullscreen gallery"
          onClick={() => setFullscreen(true)}
          className="absolute bottom-4 right-4 rounded-lg bg-black/60 p-2.5 hover:bg-black"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto p-3">
        {photos.map((photo, photoIndex) => (
          <button
            type="button"
            key={photo}
            aria-label={`View photograph ${photoIndex + 1}`}
            aria-pressed={index === photoIndex}
            onClick={() => setIndex(photoIndex)}
            className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
              index === photoIndex
                ? "border-[#d4af37]"
                : "border-transparent opacity-60"
            }`}
          >
            <img
              src={photo}
              alt={`${name} thumbnail ${photoIndex + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo gallery`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-5"
        >
          <button
            type="button"
            autoFocus
            aria-label="Close gallery"
            onClick={() => setFullscreen(false)}
            className="absolute right-5 top-5 rounded-full bg-zinc-800 p-3"
          >
            <X size={24} />
          </button>

          <button
            type="button"
            aria-label="Previous photograph"
            onClick={() => changePhoto(-1)}
            className="absolute left-3 z-10 rounded-full bg-zinc-800/80 p-3"
          >
            <ChevronLeft size={28} />
          </button>

          <img
            src={photos[index]}
            alt={`${name} — photograph ${index + 1}`}
            className="max-h-[85vh] max-w-full object-contain"
          />

          <button
            type="button"
            aria-label="Next photograph"
            onClick={() => changePhoto(1)}
            className="absolute right-3 z-10 rounded-full bg-zinc-800/80 p-3"
          >
            <ChevronRight size={28} />
          </button>

          <p className="absolute bottom-5 text-sm text-zinc-400">
            {name} · {index + 1} of {photos.length}
          </p>
        </div>
      )}
    </>
  );
};

// ======================================================
// ROOM CARD
// ======================================================

const RoomCard = ({ room, selected, onSelect, startingRate }) => (
  <article
    className={`overflow-hidden rounded-2xl border bg-zinc-900/60 transition ${
      selected ? "border-[#d4af37]" : "border-zinc-800 hover:border-zinc-600"
    }`}
  >
    <PhotoGallery photos={room.photos} name={room.displayName || room.name} />

    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">
            {room.displayName || room.name}
          </h3>

          <p className="mt-2 text-sm text-zinc-400">
            {room.areaSquareFeet
              ? `${room.areaSquareFeet} sq. ft.`
              : "Multipurpose studio"}
          </p>
        </div>

        {startingRate != null && (
          <div className="text-right">
            <p className="text-xs text-zinc-500">Starting from</p>

            <p className="mt-1 text-xl font-bold text-[#d4af37]">
              {money(startingRate)}
              <span className="text-xs font-normal text-zinc-400">/hr</span>
            </p>
          </div>
        )}
      </div>

      <p className="mt-5 text-sm leading-7 text-zinc-400">{room.description}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(room.amenities || []).map((amenity) => (
          <div
            key={amenity}
            className="flex items-center gap-2 text-xs text-zinc-300"
          >
            <CheckCircle2 size={15} className="shrink-0 text-[#d4af37]" />

            {amenity}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSelect(room.id)}
        className={`${primaryButton} mt-7 w-full`}
      >
        {selected ? (
          <>
            <CheckCircle2 size={18} />
            Selected Studio
          </>
        ) : (
          <>
            Select This Studio
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </div>
  </article>
);

// ======================================================
// ESTIMATE CALCULATOR
// ======================================================

const calculateEstimate = ({ rules, scope, date, startTime, duration }) => {
  if (!date || !startTime || !duration) {
    return {
      message: "Select a date, start time and duration.",
    };
  }

  if (date < todayInVegas()) {
    return {
      message: "Please select today or a future date.",
    };
  }

  const start = toMinutes(startTime);
  const requestedMinutes = Number(duration);

  if (
    !Number.isFinite(start) ||
    !Number.isSafeInteger(requestedMinutes) ||
    requestedMinutes <= 0
  ) {
    return { message: "Enter a valid rental duration." };
  }

  const dayType = getDayType(date);

  const rule = rules.find(
    (item) =>
      item.isActive &&
      item.scope === scope &&
      (item.dayType === dayType || item.dayType === "EVERY_DAY") &&
      start >= item.startTimeMinutes &&
      start < item.endTimeMinutes,
  );

  if (!rule) {
    return {
      message:
        "No standard pricing is configured for this time. Contact the studio for a quote.",
    };
  }

  if (rule.requiresQuote) {
    return {
      message: "This rental requires a custom quote from management.",
    };
  }

  if (rule.hourlyRateCents == null || rule.billingIncrementMinutes <= 0) {
    return {
      message: "Pricing is currently unavailable.",
    };
  }

  if (requestedMinutes < rule.minimumMinutes) {
    return {
      message: `Minimum rental duration is ${rule.minimumMinutes} minutes.`,
    };
  }

  const billedMinutes =
    Math.ceil(requestedMinutes / rule.billingIncrementMinutes) *
    rule.billingIncrementMinutes;

  const requestedEnd = start + requestedMinutes;
  const billedEnd = start + billedMinutes;

  if (billedEnd > rule.endTimeMinutes) {
    return {
      message:
        "Your rental crosses a pricing period. Contact the studio for a combined quote.",
    };
  }

  const subtotalCents = Math.round((rule.hourlyRateCents * billedMinutes) / 60);

  const cleaningFeeCents = rule.cleaningFeeCents ?? 0;

  const totalCents = subtotalCents + cleaningFeeCents;

  const depositCents = Math.round(
    (totalCents * rule.depositBasisPoints) / 10000,
  );

  return {
    rule,
    requestedMinutes,
    billedMinutes,
    requestedEnd,
    billedEnd,
    subtotalCents,
    cleaningFeeCents,
    totalCents,
    depositCents,
    balanceCents: totalCents - depositCents,
  };
};

// ======================================================
// MAIN PUBLIC RENTAL PAGE
// ======================================================

const Rental = () => {
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRoom, setSelectedRoom] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [guests, setGuests] = useState("1");
  const [largeGroup, setLargeGroup] = useState(false);

  // ====================================================
  // FETCH PUBLIC RENTAL DATA
  // ====================================================

  const fetchRentalData = async () => {
    try {
      setLoading(true);
      setError("");

      const [roomResponse, categoryResponse, pricingResponse] =
        await Promise.all([
          api.get("/rooms/public"),
          api.get("/rental-categories/public"),
          api.get("/rental-pricing/public"),
        ]);

      const roomData = roomResponse.data;
      const categoryData = categoryResponse.data;
      const pricingData = pricingResponse.data;

      if (
        !roomData.success ||
        !categoryData.success ||
        !pricingData.success ||
        !Array.isArray(roomData.rooms) ||
        !Array.isArray(categoryData.categories) ||
        !Array.isArray(pricingData.rules)
      ) {
        throw new Error("Invalid studio rental response.");
      }

      const mergedRooms = roomData.rooms.map((room) => {
        const localRoom = studioRooms.find((item) => item.id === room.id);

        return {
          ...room,
          displayName: localRoom?.displayName || room.name,
          description: localRoom?.description || room.description,
          areaSquareFeet: localRoom?.areaSquareFeet || room.areaSquareFeet,
          amenities: localRoom?.amenities || room.amenities || [],
          photos: localRoom?.photos?.length
            ? localRoom.photos
            : room.photoUrls || [],
        };
      });

      setRooms(mergedRooms);
      setCategories(categoryData.categories);
      setRules(pricingData.rules);

      setSelectedRoom((current) => {
        if (current === "ENTIRE_STUDIO" && mergedRooms.length === 2) {
          return current;
        }

        return mergedRooms.some((room) => room.id === current)
          ? current
          : mergedRooms[0]?.id || "";
      });

      setCategoryId((current) =>
        categoryData.categories.some((category) => category.id === current)
          ? current
          : "",
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load studio rental information.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentalData();
  }, []);

  // ====================================================
  // DERIVED INFORMATION
  // ====================================================

  const entireStudioAvailable = rooms.length === 2;

  const scope = largeGroup
    ? "LARGE_GROUP"
    : selectedRoom === "ENTIRE_STUDIO"
      ? "ENTIRE_STUDIO"
      : "SINGLE_ROOM";

  const selectedRoomName =
    selectedRoom === "ENTIRE_STUDIO"
      ? "Entire Studio — Both Rooms"
      : rooms.find((room) => room.id === selectedRoom)?.displayName ||
        "Select a studio";

  const selectedCategory = categories.find(
    (category) => category.id === categoryId,
  );

  const getStartingRate = (rentalScope) => {
    const rates = rules
      .filter(
        (rule) =>
          rule.isActive &&
          rule.scope === rentalScope &&
          !rule.requiresQuote &&
          rule.hourlyRateCents != null,
      )
      .map((rule) => rule.hourlyRateCents);

    return rates.length ? Math.min(...rates) : null;
  };

  const startingRate = getStartingRate("SINGLE_ROOM");
  const entireRate = getStartingRate("ENTIRE_STUDIO");

  const estimate = useMemo(
    () =>
      calculateEstimate({
        rules,
        scope,
        date,
        startTime,
        duration,
      }),
    [rules, scope, date, startTime, duration],
  );

  const guestCount = Number(guests);

  const validGuests =
    guests.trim() !== "" && Number.isSafeInteger(guestCount) && guestCount > 0;

  const selectRoom = (roomId) => {
    setSelectedRoom(roomId);

    document
      .getElementById("rental-planner")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // ====================================================
  // WHATSAPP INQUIRY
  // ====================================================

  const inquiryMessage = [
    "Hello Freedom Dance Studio!",
    "",
    "I am interested in renting your studio.",
    "",
    `Studio: ${selectedRoomName}`,
    `Activity: ${selectedCategory?.name || "Not selected"}`,
    `Date: ${date || "Not selected"}`,
    `Start time: ${startTime ? formatTime(toMinutes(startTime)) : "Not selected"}`,
    `Duration: ${duration} minutes`,
    `Guests: ${guests}`,
    `Large group inquiry: ${largeGroup ? "Yes" : "No"}`,
    "",
    estimate.totalCents != null
      ? `Estimated rental total: ${money(estimate.totalCents)}`
      : "Please provide a rental quote.",
    "",
    "Please confirm availability and final pricing. Thank you!",
  ].join("\n");

  const whatsappUrl = `https://wa.me/17257240962?text=${encodeURIComponent(
    inquiryMessage,
  )}`;

  const canInquire =
    !loading &&
    !error &&
    Boolean(selectedRoom) &&
    Boolean(selectedCategory) &&
    Boolean(date) &&
    date >= todayInVegas() &&
    Boolean(startTime) &&
    Number.isSafeInteger(Number(duration)) &&
    Number(duration) > 0 &&
    validGuests;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* HERO */}

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/images/rooms/large-room/large-room-01.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
            <Sparkles size={16} />
            Freedom Dance Studio · Las Vegas
          </p>

          <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Your Space.
            <span className="block text-[#d4af37]">Your Vision.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
            Professional and versatile studio spaces for dance classes, private
            lessons, workshops, rehearsals, celebrations and special events.
          </p>

          {!loading && !error && startingRate != null && (
            <p className="mt-6 text-xl font-semibold text-[#d4af37]">
              Rentals starting at {money(startingRate)}/hour
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#studio-spaces" className={primaryButton}>
              Explore Our Studios
              <ArrowRight size={18} />
            </a>

            <a
              href="tel:+17257240962"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-500 px-6 py-3.5 font-semibold hover:border-[#d4af37]"
            >
              <Phone size={18} />
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* STUDIO HIGHLIGHTS */}

      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 lg:grid-cols-4">
          {[
            [Building2, "2 Studio Rooms"],
            [DoorOpen, "1,359 sq. ft. Combined"],
            [Music, "Multipurpose Spaces"],
            [Clock, "Flexible Rental Options"],
          ].map(([Icon, title]) => (
            <div key={title} className="flex items-center gap-3">
              <Icon size={25} className="shrink-0 text-[#d4af37]" />

              <span className="text-sm font-medium">{title}</span>
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6">
        {/* ERROR AND LOADING */}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={22} />

              {error}
            </div>

            <button
              type="button"
              onClick={fetchRentalData}
              className="mt-4 flex items-center gap-2 text-sm text-[#d4af37]"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-zinc-400">
            <RefreshCw size={22} className="animate-spin text-[#d4af37]" />
            Loading studio rental information...
          </div>
        )}

        {/* STUDIO SPACES */}

        {!loading && !error && (
          <section id="studio-spaces" className="scroll-mt-28">
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
                Explore Our Spaces
              </p>

              <h2 className="mt-4 text-3xl font-bold sm:text-5xl">
                Find Your Perfect Studio
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                Choose the space that best fits your activity, group and rental
                requirements.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  selected={selectedRoom === room.id}
                  onSelect={selectRoom}
                  startingRate={startingRate}
                />
              ))}
            </div>

            {rooms.length === 0 && (
              <p className="text-center text-zinc-400">
                No studio rooms are currently listed. Please contact us.
              </p>
            )}

            {/* ENTIRE STUDIO */}

            {entireStudioAvailable && (
              <article
                className={`mt-6 rounded-2xl border bg-gradient-to-br from-[#d4af37]/10 via-zinc-900 to-black p-6 sm:p-9 ${
                  selectedRoom === "ENTIRE_STUDIO"
                    ? "border-[#d4af37]"
                    : "border-zinc-800"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <Building2 size={38} className="shrink-0 text-[#d4af37]" />

                    <div>
                      <h3 className="text-2xl font-bold">Entire Studio</h3>

                      <p className="mt-2 text-sm text-zinc-400">
                        Both rooms · 1,359 sq. ft.
                      </p>

                      <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">
                        Exclusive use of both studio rooms for workshops,
                        intensives, private events and special occasions.
                      </p>
                    </div>
                  </div>

                  <div>
                    {entireRate != null && (
                      <p className="mb-4 text-3xl font-bold text-[#d4af37]">
                        {money(entireRate)}
                        <span className="text-sm text-zinc-400">/hr</span>
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => selectRoom("ENTIRE_STUDIO")}
                      className={primaryButton}
                    >
                      {selectedRoom === "ENTIRE_STUDIO"
                        ? "Entire Studio Selected"
                        : "Select Entire Studio"}

                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </article>
            )}
          </section>
        )}

        {/* RENTAL ACTIVITIES */}

        {!loading && !error && (
          <section>
            <div className="mb-8 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                Endless Possibilities
              </p>

              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                What Are You Planning?
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  aria-pressed={categoryId === category.id}
                  onClick={() => setCategoryId(category.id)}
                  className={`rounded-xl border p-4 text-center transition ${
                    categoryId === category.id
                      ? "border-[#d4af37] bg-[#d4af37]/10"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
                  }`}
                >
                  <Sparkles size={22} className="mx-auto mb-3 text-[#d4af37]" />

                  <p className="text-sm font-medium">{category.name}</p>
                </button>
              ))}
            </div>

            {selectedCategory?.description && (
              <p className="mt-5 text-center text-sm text-zinc-400">
                {selectedCategory.description}
              </p>
            )}
          </section>
        )}

        {/* RENTAL PRICING */}

        {!loading && !error && (
          <section>
            <div className="mb-8 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                Transparent Pricing
              </p>

              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Studio Rental Rates
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {[
                ["SINGLE_ROOM", "Single Room", DoorOpen],
                ["ENTIRE_STUDIO", "Entire Studio", Building2],
                ["LARGE_GROUP", "Large Group", Users],
              ].map(([type, title, Icon]) => (
                <article key={type} className={`${panel} p-5`}>
                  <Icon size={28} className={GOLD} />

                  <h3 className="mt-4 text-xl font-bold">{title}</h3>

                  <div className="mt-5 space-y-3">
                    {rules
                      .filter((rule) => rule.isActive && rule.scope === type)
                      .sort(
                        (a, b) =>
                          a.dayType.localeCompare(b.dayType) ||
                          a.startTimeMinutes - b.startTimeMinutes,
                      )
                      .map((rule) => (
                        <div
                          key={rule.id}
                          className="rounded-xl border border-zinc-800 bg-black/30 p-3"
                        >
                          <p className="text-xs text-zinc-400">
                            {rule.dayType === "EVERY_DAY"
                              ? "Every day"
                              : rule.dayType === "WEEKDAY"
                                ? "Weekdays"
                                : "Weekends"}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {formatTime(rule.startTimeMinutes)}
                            {" – "}
                            {formatTime(rule.endTimeMinutes)}
                          </p>

                          <p className="mt-2 text-lg font-bold text-[#d4af37]">
                            {rule.requiresQuote
                              ? "Custom quote"
                              : rule.hourlyRateCents == null
                                ? "Contact us"
                                : `${money(rule.hourlyRateCents)}/hr`}
                          </p>

                          {rule.cleaningFeeCents > 0 && (
                            <p className="mt-2 text-xs text-zinc-400">
                              + {money(rule.cleaningFeeCents)} cleaning fee
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* RENTAL PLANNER */}

        {!loading && !error && (
          <section id="rental-planner" className="scroll-mt-28">
            <div className="mb-8 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">
                Plan Your Experience
              </p>

              <h2 className="mt-4 text-3xl font-bold sm:text-5xl">
                Plan Your Studio Rental
              </h2>

              <p className="mt-4 text-sm text-zinc-400">
                Customize your rental and request availability from our team.
              </p>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
              {/* RENTAL DETAILS */}

              <div className={`${panel} space-y-6 p-5 sm:p-7`}>
                <h3 className="flex items-center gap-3 text-xl font-bold">
                  <CalendarDays className={GOLD} />
                  Rental Details
                </h3>

                <div>
                  <label
                    htmlFor="studio-room"
                    className="mb-2 block text-sm text-zinc-300"
                  >
                    Studio Space
                  </label>

                  <select
                    id="studio-room"
                    value={selectedRoom}
                    onChange={(event) => setSelectedRoom(event.target.value)}
                    className={field}
                  >
                    <option value="">Select a studio</option>

                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.displayName}
                      </option>
                    ))}

                    {entireStudioAvailable && (
                      <option value="ENTIRE_STUDIO">
                        Entire Studio — Both Rooms
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="rental-activity"
                    className="mb-2 block text-sm text-zinc-300"
                  >
                    Rental Activity
                  </label>

                  <select
                    id="rental-activity"
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className={field}
                  >
                    <option value="">Select your activity</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="rental-date"
                      className="mb-2 block text-sm text-zinc-300"
                    >
                      Rental Date
                    </label>

                    <input
                      id="rental-date"
                      type="date"
                      min={todayInVegas()}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className={`${field} [color-scheme:dark]`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="rental-start"
                      className="mb-2 block text-sm text-zinc-300"
                    >
                      Start Time
                    </label>

                    <input
                      id="rental-start"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className={`${field} [color-scheme:dark]`}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="rental-duration"
                      className="mb-2 block text-sm text-zinc-300"
                    >
                      Duration
                    </label>

                    <select
                      id="rental-duration"
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      className={field}
                    >
                      {[
                        60, 90, 120, 150, 180, 240, 300, 360, 480, 600, 720,
                      ].map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes / 60} hours
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="rental-guests"
                      className="mb-2 block text-sm text-zinc-300"
                    >
                      Number of Guests
                    </label>

                    <input
                      id="rental-guests"
                      type="number"
                      min="1"
                      step="1"
                      value={guests}
                      onChange={(event) => setGuests(event.target.value)}
                      className={field}
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-black/30 p-4">
                  <input
                    type="checkbox"
                    checked={largeGroup}
                    onChange={(event) => setLargeGroup(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#d4af37]"
                  />

                  <div>
                    <p className="text-sm font-medium">
                      Request Large Group Pricing
                    </p>

                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Large group classification and cleaning requirements are
                      subject to management approval.
                    </p>
                  </div>
                </label>

                <div className="flex items-start gap-3 rounded-xl bg-[#d4af37]/5 p-4">
                  <Info size={18} className="shrink-0 text-[#d4af37]" />

                  <p className="text-xs leading-6 text-zinc-400">
                    All dates and times are in Las Vegas local time. Guest
                    capacity and room availability must be confirmed by our
                    team.
                  </p>
                </div>
              </div>

              {/* RENTAL SUMMARY */}

              <aside className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/10 via-zinc-900 to-black p-5 sm:p-7 lg:sticky lg:top-24">
                <h3 className="flex items-center gap-3 text-xl font-bold">
                  <Calculator className={GOLD} />
                  Rental Summary
                </h3>

                <div className="mt-6 space-y-4 text-sm">
                  {[
                    ["Studio", selectedRoomName],
                    ["Activity", selectedCategory?.name || "Not selected"],
                    ["Date", date || "Not selected"],
                    [
                      "Start time",
                      startTime
                        ? formatTime(toMinutes(startTime))
                        : "Not selected",
                    ],
                    ["Duration", `${Number(duration) / 60} hours`],
                    ["Guests", guests || "Not entered"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-zinc-400">{label}</span>

                      <span className="text-right font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="my-6 border-t border-zinc-700" />

                {estimate.message ? (
                  <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 p-4 text-sm leading-6 text-amber-300">
                    <AlertCircle size={19} className="mt-1 shrink-0" />

                    {estimate.message}
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 text-sm">
                      {[
                        [
                          "Hourly rate",
                          `${money(estimate.rule.hourlyRateCents)}/hr`,
                        ],
                        ["Requested end", formatTime(estimate.requestedEnd)],
                        [
                          "Billable duration",
                          `${estimate.billedMinutes / 60} hours`,
                        ],
                        ["Rental subtotal", money(estimate.subtotalCents)],
                        ["Cleaning fee", money(estimate.cleaningFeeCents)],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4">
                          <span className="text-zinc-400">{label}</span>

                          <span>{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 border-t border-zinc-700 pt-6">
                      <p className="text-sm text-zinc-400">Estimated Total</p>

                      <p className="mt-2 text-4xl font-bold text-[#d4af37]">
                        {money(estimate.totalCents)}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                        <p className="text-xs text-zinc-400">
                          Deposit ({estimate.rule.depositBasisPoints / 100}%)
                        </p>

                        <p className="mt-2 text-xl font-bold text-[#d4af37]">
                          {money(estimate.depositCents)}
                        </p>

                        <p className="mt-2 text-xs text-zinc-500">
                          {estimate.rule.depositRefundable
                            ? "Refundable"
                            : "Non-refundable"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                        <p className="text-xs text-zinc-400">
                          Remaining Balance
                        </p>

                        <p className="mt-2 text-xl font-bold">
                          {money(estimate.balanceCents)}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {canInquire ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${primaryButton} mt-6 w-full`}
                  >
                    <Phone size={18} />
                    Inquire via WhatsApp
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className={`${primaryButton} mt-6 w-full`}
                  >
                    Complete Rental Details
                  </button>
                )}

                <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
                  This is a rental inquiry, not a confirmed reservation. No
                  payment will be collected. Final pricing, occupancy and
                  availability require studio approval.
                </p>
              </aside>
            </div>
          </section>
        )}

        {/* RENTAL POLICIES */}

        <section>
          <div className="mb-8 text-center">
            <ShieldCheck size={36} className="mx-auto text-[#d4af37]" />

            <h2 className="mt-4 text-3xl font-bold">Studio Rental Policies</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              [
                Clock,
                "Minimum Rental",
                "Standard rentals require a minimum of one hour. Billing is rounded up to whole-hour increments under current standard pricing.",
              ],
              [
                ShieldCheck,
                "Deposit",
                "Standard rentals require a 50% non-refundable deposit. Final terms will be provided before confirmation.",
              ],
              [
                Users,
                "Guest Capacity",
                "All activities must comply with approved occupancy limits and studio safety requirements.",
              ],
              [
                Building2,
                "Studio Access",
                "Access instructions will be provided after your rental is approved and the required deposit is received.",
              ],
              [
                Camera,
                "Studio Security",
                "Security cameras are installed in the studio for safety and property protection.",
              ],
              [
                Sparkles,
                "Cleaning",
                "Renters must leave the studio clean and organized. Additional cleaning fees apply to large group rentals.",
              ],
            ].map(([Icon, title, description]) => (
              <article key={title} className={`${panel} p-6`}>
                <Icon size={26} className={GOLD} />

                <h3 className="mt-4 font-bold">{title}</h3>

                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* CONTACT */}

        <section className="rounded-3xl border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/10 via-zinc-900 to-black p-8 text-center sm:p-12">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Let's Bring Your Vision to Life
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-400">
            Whether you are an instructor, dancer, musician, event organizer or
            community member, we would love to welcome you.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 text-sm text-zinc-300">
            <div className="flex items-center gap-3">
              <MapPin size={20} className={GOLD} />

              <span>3110 E Sunset Rd, Suite C, Las Vegas, NV 89120</span>
            </div>

            <a
              href="tel:+17257240962"
              className="flex items-center gap-3 hover:text-[#d4af37]"
            >
              <Phone size={20} className={GOLD} />
              (725) 724-0962
            </a>

            <a
              href="https://vegasfreedomdancestudio.com"
              className="text-[#d4af37] hover:underline"
            >
              vegasfreedomdancestudio.com
            </a>
          </div>

          <a
            href="https://wa.me/17257240962"
            target="_blank"
            rel="noopener noreferrer"
            className={`${primaryButton} mt-8`}
          >
            Contact Freedom Dance Studio
            <ArrowRight size={18} />
          </a>
        </section>
      </main>
    </div>
  );
};

export default Rental;
