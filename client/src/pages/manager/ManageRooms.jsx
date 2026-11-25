import { useEffect, useState } from "react";

import {
  Building2,
  DoorOpen,
  Users,
  Ruler,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  RefreshCw,
  AlertCircle,
  Clock,
  DollarSign,
  ShieldCheck,
  CalendarDays,
  LayoutGrid,
  Info,
  Check,
  X,
  Expand,
} from "lucide-react";

import api from "@/api/axios";

import {
  studioRooms,
  entireStudio,
  rentalRates,
  rentalPolicies,
} from "@/data/studioRooms";

const GOLD = "text-[#d4af37]";

const panel = "rounded-2xl border border-zinc-800 bg-zinc-900/60";

const formatPrice = (price) => (price === null ? "Custom quote" : `$${price}`);

// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({ icon: Icon, label, value, subtitle }) => {
  return (
    <div className={`${panel} p-5`}>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10">
        <Icon className={GOLD} size={22} />
      </div>

      <p className="text-sm text-zinc-400">{label}</p>

      <h3 className="mt-1 text-3xl font-bold text-white">{value}</h3>

      {subtitle && <p className="mt-2 text-xs text-zinc-500">{subtitle}</p>}
    </div>
  );
};

// ==========================================
// PHOTO GALLERY
// ==========================================

const PhotoGallery = ({ photos = [], name }) => {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState({});

  const previous = () => {
    setIndex((current) => (current === 0 ? photos.length - 1 : current - 1));
  };

  const next = () => {
    setIndex((current) => (current === photos.length - 1 ? 0 : current + 1));
  };

  useEffect(() => {
    if (!expanded) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setExpanded(false);

      if (event.key === "ArrowRight") {
        setIndex((current) => (current + 1) % photos.length);
      }

      if (event.key === "ArrowLeft") {
        setIndex((current) => (current - 1 + photos.length) % photos.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expanded, photos.length]);

  if (!photos.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 bg-zinc-800">
        <ImageIcon size={42} className="text-zinc-600" />
        <p className="text-sm text-zinc-500">No photographs configured</p>
      </div>
    );
  }

  const currentPhoto = photos[index];

  return (
    <>
      <div className="group relative h-64 overflow-hidden bg-zinc-800 sm:h-80">
        {failed[currentPhoto] ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500">
            <ImageIcon size={40} />
            <p>Photograph unavailable</p>
          </div>
        ) : (
          <img
            src={currentPhoto}
            alt={`${name} — view ${index + 1}`}
            className="h-full w-full object-cover"
            onError={() =>
              setFailed((old) => ({
                ...old,
                [currentPhoto]: true,
              }))
            }
          />
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label="Previous photograph"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Next photograph"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setExpanded(true)}
          disabled={failed[currentPhoto]}
          aria-label="Expand photograph"
          className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 text-white hover:bg-black disabled:opacity-40"
        >
          <Expand size={18} />
        </button>

        <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-3 py-1 text-xs text-white">
          {index + 1} / {photos.length}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 p-3">
        {photos.map((photo, photoIndex) => (
          <button
            type="button"
            key={photo}
            onClick={() => setIndex(photoIndex)}
            aria-label={`View photograph ${photoIndex + 1}`}
            aria-pressed={index === photoIndex}
            className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
              index === photoIndex
                ? "border-[#d4af37]"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <img
              src={photo}
              alt={`${name} thumbnail ${photoIndex + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photograph gallery`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-5"
          onClick={() => setExpanded(false)}
        >
          <button
            type="button"
            autoFocus
            aria-label="Close gallery"
            onClick={() => setExpanded(false)}
            className="absolute right-5 top-5 rounded-full bg-zinc-800 p-3 text-white"
          >
            <X size={24} />
          </button>

          <button
            type="button"
            aria-label="Previous photograph"
            onClick={(event) => {
              event.stopPropagation();
              previous();
            }}
            className="absolute left-3 z-10 rounded-full bg-zinc-800/80 p-3 text-white"
          >
            <ChevronLeft size={26} />
          </button>

          <img
            src={currentPhoto}
            alt={`${name} — view ${index + 1}`}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
          />

          <button
            type="button"
            aria-label="Next photograph"
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
            className="absolute right-3 z-10 rounded-full bg-zinc-800/80 p-3 text-white"
          >
            <ChevronRight size={26} />
          </button>

          <p className="absolute bottom-5 text-sm text-zinc-300">
            {name} · {index + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
};

// ==========================================
// ROOM CARD
// ==========================================

const RoomCard = ({ room }) => {
  return (
    <article className={`${panel} overflow-hidden`}>
      <PhotoGallery photos={room.photos} name={room.displayName} />

      <div className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
              {room.name}
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              {room.displayName}
            </h2>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              room.isActive === true
                ? "bg-emerald-500/10 text-emerald-400"
                : room.isActive === false
                  ? "bg-red-500/10 text-red-400"
                  : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {room.isActive === true ? (
              <CheckCircle2 size={14} />
            ) : room.isActive === false ? (
              <XCircle size={14} />
            ) : (
              <Info size={14} />
            )}

            {room.isActive === true
              ? "Active"
              : room.isActive === false
                ? "Inactive"
                : "Status unavailable"}
          </span>
        </div>

        <p className="text-sm leading-7 text-zinc-400">{room.description}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
            <Ruler size={20} className={GOLD} />

            <p className="mt-3 text-xs text-zinc-400">Room size</p>

            <p className="mt-1 text-xl font-bold text-white">
              {room.areaSquareFeet.toLocaleString()} sq. ft.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
            <Users size={20} className={GOLD} />

            <p className="mt-3 text-xs text-zinc-400">Suggested group size</p>

            <p className="mt-1 text-xl font-bold text-white">
              {room.minimumGuests}–{room.recommendedCapacity}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Provisional planning estimate
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
            <DollarSign size={20} className={GOLD} />

            <p className="mt-3 text-xs text-zinc-400">Starting rate</p>

            <p className="mt-1 text-xl font-bold text-white">
              ${room.startingPrice}
              <span className="text-sm font-normal text-zinc-500">/hr</span>
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
            <ShieldCheck size={20} className={GOLD} />

            <p className="mt-3 text-xs text-zinc-400">Approved occupancy</p>

            <p className="mt-1 text-sm font-semibold text-amber-400">
              {room.approvedCapacity ?? "Pending verification"}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Room amenities
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {room.amenities.map((amenity) => (
              <div
                key={amenity}
                className="flex items-center gap-2 text-sm text-zinc-300"
              >
                <Check size={16} className="shrink-0 text-[#d4af37]" />

                {amenity}
              </div>
            ))}
          </div>
        </div>

        {room._count && (
          <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-5 text-center">
            <div>
              <p className="text-xl font-bold text-white">
                {room._count.weeklyClasses ?? 0}
              </p>
              <p className="text-xs text-zinc-500">Weekly classes</p>
            </div>

            <div>
              <p className="text-xl font-bold text-white">
                {room._count.danceClasses ?? 0}
              </p>
              <p className="text-xs text-zinc-500">Class records</p>
            </div>

            <div>
              <p className="text-xl font-bold text-white">
                {room._count.rentals ?? 0}
              </p>
              <p className="text-xs text-zinc-500">Rental records</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

const ManageRooms = () => {
  const [databaseRooms, setDatabaseRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/rooms");

      if (!data.success || !Array.isArray(data.rooms)) {
        throw new Error("Invalid room API response.");
      }

      setDatabaseRooms(data.rooms);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to retrieve live room information.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Combine database records with local room details.
  // No database updates are performed.

  const rooms = studioRooms.map((localRoom) => {
    const databaseRoom = databaseRooms.find((room) => room.id === localRoom.id);

    return {
      ...localRoom,
      isActive: databaseRoom?.isActive ?? null,
      approvedCapacity: databaseRoom?.capacity ?? null,
      _count: databaseRoom?._count ?? null,
    };
  });

  const activeRooms = rooms.filter((room) => room.isActive === true).length;

  const inactiveRooms = rooms.filter((room) => room.isActive === false).length;

  const totalArea = rooms.reduce(
    (total, room) => total + room.areaSquareFeet,
    0,
  );

  const filteredRooms = rooms.filter((room) => {
    if (filter === "ACTIVE") return room.isActive === true;
    if (filter === "INACTIVE") return room.isActive === false;
    return true;
  });

  return (
    <div className="min-h-screen space-y-8 bg-[#09090b] p-4 text-white sm:p-6 lg:p-8">
      {/* PAGE HEADER */}

      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
            <Building2 size={16} />
            Freedom Dance Studio
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Studio Rooms
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Explore studio spaces, photographs, amenities, rental pricing, and
            room information.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRooms}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition hover:border-[#d4af37] hover:text-[#d4af37] disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh rooms"}
        </button>
      </header>

      {/* API STATUS */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300"
        >
          <AlertCircle size={20} className="shrink-0" />

          <div>
            <p>{error}</p>

            <p className="mt-1 text-xs text-zinc-400">
              Local room information remains visible. Live status may be
              unavailable or outdated.
            </p>
          </div>
        </div>
      )}

      {/* STATISTICS */}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          icon={DoorOpen}
          label="Studio rooms"
          value={rooms.length}
          subtitle="Two multipurpose spaces"
        />

        <StatCard
          icon={CheckCircle2}
          label="Active rooms"
          value={loading || error ? "—" : activeRooms}
          subtitle="Enabled in the database"
        />

        <StatCard
          icon={XCircle}
          label="Inactive rooms"
          value={loading || error ? "—" : inactiveRooms}
          subtitle="Disabled room records"
        />

        <StatCard
          icon={Ruler}
          label="Combined room area"
          value={totalArea.toLocaleString()}
          subtitle="Square feet"
        />
      </section>

      {/* ROOM FILTER */}

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LayoutGrid size={22} className={GOLD} />

          <h2 className="text-xl font-semibold">Our Studio Spaces</h2>
        </div>

        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {["ALL", "ACTIVE", "INACTIVE"].map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => setFilter(option)}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                filter === option
                  ? "bg-[#d4af37] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {option === "ALL"
                ? "All rooms"
                : option === "ACTIVE"
                  ? "Active"
                  : "Inactive"}
            </button>
          ))}
        </div>
      </section>

      {/* ROOM CARDS */}

      {filteredRooms.length ? (
        <section className="grid gap-6 xl:grid-cols-2">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </section>
      ) : (
        <div className={`${panel} p-10 text-center`}>
          <DoorOpen size={40} className="mx-auto mb-4 text-zinc-600" />

          <p className="text-zinc-400">No rooms match this filter.</p>
        </div>
      )}

      {/* ENTIRE STUDIO */}

      <section className="overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/10 via-zinc-900 to-black p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#d4af37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
              <Building2 size={15} />
              Exclusive rental
            </div>

            <h2 className="text-3xl font-bold">Entire Studio</h2>

            <p className="mt-4 text-sm leading-7 text-zinc-400">
              {entireStudio.description}
            </p>
          </div>

          <div>
            <p className="text-sm text-zinc-400">Starting from</p>

            <p className="mt-1 text-4xl font-bold text-[#d4af37]">
              ${entireStudio.startingPrice}
              <span className="text-base font-normal text-zinc-400">/hr</span>
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Studio rooms", "2"],
            ["Combined area", "1,359 sq. ft."],
            ["Minimum rental", "1 hour"],
            ["Approved occupancy", "Pending"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-700/60 bg-black/30 p-4"
            >
              <p className="text-xs text-zinc-400">{label}</p>

              <p className="mt-2 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RENTAL PRICING */}

      <section className={`${panel} p-5 sm:p-7`}>
        <div className="mb-6 flex items-center gap-3">
          <DollarSign size={25} className={GOLD} />

          <div>
            <h2 className="text-xl font-bold">Standard Rental Pricing</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Same standard hourly rates for both rooms.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="border-b border-zinc-700 text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-4">Period</th>
                <th className="px-4 py-4">Time</th>
                <th className="px-4 py-4">Weekdays</th>
                <th className="px-4 py-4">Weekends</th>
              </tr>
            </thead>

            <tbody>
              {rentalRates.map((rate) => (
                <tr
                  key={rate.period}
                  className="border-b border-zinc-800 transition hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-5 font-medium">{rate.period}</td>

                  <td className="px-4 py-5 text-zinc-400">{rate.time}</td>

                  <td className="px-4 py-5 font-semibold text-[#d4af37]">
                    {formatPrice(rate.weekday)}
                    {rate.weekday !== null && "/hr"}
                  </td>

                  <td className="px-4 py-5 font-semibold text-[#d4af37]">
                    {formatPrice(rate.weekend)}
                    {rate.weekend !== null && "/hr"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Rates are displayed in USD and use Las Vegas local time. Pricing
          before 9 AM and after midnight has not been configured.
        </p>
      </section>

      {/* RENTAL POLICIES */}

      <section className={`${panel} p-5 sm:p-7`}>
        <h2 className="mb-6 text-xl font-bold">Rental Policies</h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              icon: Clock,
              label: "Minimum rental",
              value: `${rentalPolicies.minimumHours} hour`,
              detail: "Minimum reservation duration.",
            },
            {
              icon: Clock,
              label: "Billing increment",
              value: "1 hour",
              detail: "90 minutes is billed as 2 hours.",
            },
            {
              icon: ShieldCheck,
              label: "Required deposit",
              value: `${rentalPolicies.depositPercentage}%`,
              detail: "Non-refundable deposit.",
            },
            {
              icon: Building2,
              label: "Entire studio",
              value: "$120/hr",
              detail: "Exclusive access to both rooms.",
            },
            {
              icon: Users,
              label: "Large group rental",
              value: "$120/hr",
              detail: "Group classification requires approval.",
            },
            {
              icon: CheckCircle2,
              label: "Large group cleaning fee",
              value: "$120",
              detail: "One-time cleaning fee.",
            },
          ].map(({ icon: Icon, label, value, detail }) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-800 bg-black/30 p-5"
            >
              <Icon size={21} className={GOLD} />

              <p className="mt-4 text-sm text-zinc-400">{label}</p>

              <p className="mt-1 text-2xl font-bold">{value}</p>

              <p className="mt-2 text-xs leading-5 text-zinc-500">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OCCUPANCY NOTICE */}

      <section className="flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <ShieldCheck size={25} className="shrink-0 text-amber-400" />

        <div>
          <h3 className="font-semibold text-amber-300">Occupancy and Safety</h3>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Suggested group sizes are provisional planning estimates, not
            legally approved occupancy limits. Actual permitted occupancy
            depends on the approved use, floor layout, exits, and applicable
            building and fire regulations. Official limits must be verified
            before accepting reservations.
          </p>
        </div>
      </section>

      {/* FUTURE AVAILABILITY */}

      <section className={`${panel} flex items-start gap-4 p-6`}>
        <CalendarDays size={28} className="shrink-0 text-[#d4af37]" />

        <div>
          <h3 className="font-semibold">Room Availability Calendar</h3>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            The availability calendar will display scheduled classes, private
            lessons, studio rentals, and blocked periods once the reservation
            system is implemented.
          </p>

          <span className="mt-3 inline-block rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
            Coming soon
          </span>
        </div>
      </section>

      <footer className="border-t border-zinc-800 pt-5 text-center text-xs text-zinc-600">
        Freedom Dance Studio Management Platform
        <p className="mt-2">
          Room descriptions, photographs, dimensions and displayed prices are
          currently configured in the frontend.
        </p>
      </footer>
    </div>
  );
};

export default ManageRooms;
