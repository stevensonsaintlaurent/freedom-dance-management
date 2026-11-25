import { useEffect, useState } from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building2,
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  Clock,
  Lock,
  AlertCircle,
  Info,
} from "lucide-react";

import api from "@/api/axios";
import { studioRooms } from "@/data/studioRooms";

// ======================================================
// CONFIGURATION
// ======================================================

const TIME_ZONE = "America/Los_Angeles";

const GOLD = "text-[#d4af37]";

const panel = "rounded-2xl border border-zinc-800 bg-zinc-900/60";

const button =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm transition hover:border-[#d4af37] disabled:opacity-50";

const EVENT_TYPES = {
  WEEKLY_CLASS: {
    label: "Weekly Class",
    style: "border-blue-500/40 bg-blue-500/20 text-blue-200",
    dot: "bg-blue-500",
  },

  DANCE_CLASS: {
    label: "Special Class",
    style: "border-cyan-500/40 bg-cyan-500/20 text-cyan-200",
    dot: "bg-cyan-500",
  },

  RENTAL: {
    label: "Studio Rental",
    style: "border-amber-500/40 bg-amber-500/20 text-amber-200",
    dot: "bg-amber-500",
  },

  ROOM_BLOCK: {
    label: "Room Block",
    style: "border-red-500/40 bg-red-500/20 text-red-200",
    dot: "bg-red-500",
  },

  UNASSIGNED: {
    label: "Unassigned",
    style: "border-purple-500/40 bg-purple-500/20 text-purple-200",
    dot: "bg-purple-500",
  },
};

// ======================================================
// DATE UTILITIES
// ======================================================

const todayInVegas = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const addDays = (date, amount) => {
  const value = new Date(`${date}T12:00:00Z`);

  value.setUTCDate(value.getUTCDate() + amount);

  return value.toISOString().slice(0, 10);
};

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));

const formatTime = (value) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const formatMinutes = (minutes) => {
  if (minutes === 1440) return "Midnight";

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${hour % 12 || 12}:${String(minute).padStart(
    2,
    "0",
  )} ${hour >= 12 ? "PM" : "AM"}`;
};

const getLocalMinutes = (value) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return Number(values.hour) * 60 + Number(values.minute);
};

const getRoomName = (room) =>
  studioRooms.find((item) => item.id === room.id)?.displayName || room.name;

const getEventType = (event) =>
  EVENT_TYPES[event.unassigned ? "UNASSIGNED" : event.type] ||
  EVENT_TYPES.ROOM_BLOCK;

// ======================================================
// STAT CARD
// ======================================================

const StatCard = ({ icon: Icon, label, value }) => (
  <div className={`${panel} p-5`}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-zinc-400">{label}</p>

      <div className="rounded-xl bg-[#d4af37]/10 p-3">
        <Icon size={21} className={GOLD} />
      </div>
    </div>

    <p className="mt-4 text-3xl font-bold">{value}</p>
  </div>
);

// ======================================================
// EVENT CARD
// ======================================================

const EventCard = ({ event, onSelect }) => {
  const config = getEventType(event);

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className={`w-full rounded-xl border p-4 text-left transition hover:brightness-125 ${config.style}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium">{config.label}</span>

        {event.status && (
          <span className="rounded-full bg-black/20 px-2 py-1 text-[10px]">
            {event.status}
          </span>
        )}
      </div>

      <h4 className="mt-2 font-semibold">{event.title}</h4>

      <div className="mt-2 flex items-center gap-2 text-xs">
        <Clock size={14} />

        {formatTime(event.startsAt)}
        {" – "}
        {formatTime(event.endsAt)}
      </div>

      {event.unassigned && (
        <p className="mt-3 text-xs">Room assignment required</p>
      )}
    </button>
  );
};

// ======================================================
// DAILY TIMELINE
// ======================================================

const DailyTimeline = ({ calendar, onSelect }) => {
  const hourHeight = 72;
  const dayHeight = 24 * hourHeight;

  const dayStart = new Date(calendar.startsAt).getTime();

  const dayEnd = new Date(calendar.endsAt).getTime();

  const hours = Array.from({ length: 24 }, (_, index) => index);

  // A wall-clock timeline cannot accurately represent
  // repeated or missing hours during DST transitions.

  const isDstTransition = dayEnd - dayStart !== 24 * 60 * 60 * 1000;

  if (isDstTransition) {
    return (
      <div className="rounded-xl border border-amber-500/30 p-5 text-sm text-amber-300">
        This date contains a daylight-saving time transition. Please use List
        View for accurate event times.
      </div>
    );
  }

  const getPosition = (event) => {
    const start = Math.max(dayStart, new Date(event.startsAt).getTime());

    const end = Math.min(dayEnd, new Date(event.endsAt).getTime());

    const startMinutes = start === dayStart ? 0 : getLocalMinutes(start);

    const endMinutes = end === dayEnd ? 1440 : getLocalMinutes(end);

    return {
      top: (startMinutes / 60) * hourHeight,
      height: Math.max(20, ((endMinutes - startMinutes) / 60) * hourHeight),
    };
  };

  // Assign overlapping events to separate columns
  // so that existing conflicts remain visible.

  const layoutEvents = (events) => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
    );

    const lanes = [];

    const positioned = sorted.map((event) => {
      const start = new Date(event.startsAt).getTime();
      const end = new Date(event.endsAt).getTime();

      let lane = lanes.findIndex((laneEnd) => laneEnd <= start);

      if (lane === -1) {
        lane = lanes.length;
        lanes.push(end);
      } else {
        lanes[lane] = end;
      }

      return { event, lane };
    });

    return {
      events: positioned,
      laneCount: Math.max(1, lanes.length),
    };
  };

  return (
    <div className="overflow-x-auto">
      <div
        className="min-w-[650px]"
        style={{
          display: "grid",
          gridTemplateColumns: `85px repeat(${calendar.rooms.length}, minmax(240px, 1fr))`,
        }}
      >
        {/* HEADER */}

        <div className="border-b border-zinc-800 p-4 text-xs text-zinc-500">
          Time
        </div>

        {calendar.rooms.map((room) => (
          <div key={room.id} className="border-b border-l border-zinc-800 p-4">
            <h3 className="font-bold text-[#d4af37]">{getRoomName(room)}</h3>

            <p className="mt-1 text-xs text-zinc-500">
              {room.events.length} scheduled activities
            </p>
          </div>
        ))}

        {/* TIME LABELS */}

        <div className="relative">
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: hourHeight }}
              className="border-b border-zinc-800 px-2 pt-2 text-xs text-zinc-500"
            >
              {formatMinutes(hour * 60)}
            </div>
          ))}
        </div>

        {/* ROOM COLUMNS */}

        {calendar.rooms.map((room) => {
          const layout = layoutEvents(room.events);

          return (
            <div
              key={room.id}
              className="relative border-l border-zinc-800 bg-zinc-950/40"
              style={{ height: dayHeight }}
            >
              {/* HOUR GRID */}

              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-b border-zinc-800"
                  style={{
                    top: hour * hourHeight,
                    height: hourHeight,
                  }}
                />
              ))}

              {/* CONFIGURED OPERATING HOURS */}

              {room.operatingHours?.configured &&
                room.operatingHours.windows.map((window, index) => (
                  <div
                    key={index}
                    className="pointer-events-none absolute inset-x-0 bg-emerald-500/5"
                    style={{
                      top: (window.opensAtMinutes / 60) * hourHeight,

                      height:
                        ((window.closesAtMinutes - window.opensAtMinutes) /
                          60) *
                        hourHeight,
                    }}
                  />
                ))}

              {/* SCHEDULED EVENTS */}

              {layout.events.map(({ event, lane }) => {
                const position = getPosition(event);
                const config = getEventType(event);

                const width = 100 / layout.laneCount;

                return (
                  <button
                    type="button"
                    key={`${event.type}-${event.id}`}
                    onClick={() => onSelect(event)}
                    title={`${event.title} — ${formatTime(
                      event.startsAt,
                    )} to ${formatTime(event.endsAt)}`}
                    className={`absolute z-10 overflow-hidden rounded-lg border px-2 py-1 text-left hover:brightness-125 ${config.style}`}
                    style={{
                      top: position.top + 2,
                      height: Math.max(18, position.height - 4),
                      left: `calc(${lane * width}% + 3px)`,
                      width: `calc(${width}% - 6px)`,
                    }}
                  >
                    <p className="truncate text-xs font-semibold">
                      {event.title}
                    </p>

                    {position.height >= 40 && (
                      <p className="mt-1 truncate text-[10px]">
                        {formatTime(event.startsAt)}
                        {" – "}
                        {formatTime(event.endsAt)}
                      </p>
                    )}

                    {position.height >= 65 && (
                      <p className="mt-1 truncate text-[10px] opacity-70">
                        {config.label}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ======================================================
// LIST VIEW
// ======================================================

const ListView = ({ rooms, onSelect }) => (
  <div className="grid gap-5 lg:grid-cols-2">
    {rooms.map((room) => (
      <section key={room.id} className={`${panel} p-5`}>
        <div className="flex items-center gap-3">
          <Building2 className={GOLD} />

          <div>
            <h3 className="text-xl font-bold">{getRoomName(room)}</h3>

            <p className="mt-1 text-xs text-zinc-500">
              {room.events.length} scheduled activities
            </p>
          </div>
        </div>

        <div className="my-5 rounded-xl bg-black/30 p-4 text-xs">
          <p className="font-medium text-zinc-300">Operating Hours</p>

          {!room.operatingHours?.configured ? (
            <p className="mt-2 text-amber-300">
              Not configured — management review required
            </p>
          ) : room.operatingHours.windows.length === 0 ? (
            <p className="mt-2 text-red-300">Closed on this day</p>
          ) : (
            room.operatingHours.windows.map((window, index) => (
              <p key={index} className="mt-2 text-emerald-300">
                {formatMinutes(window.opensAtMinutes)}
                {" – "}
                {formatMinutes(window.closesAtMinutes)}
              </p>
            ))
          )}
        </div>

        <div className="space-y-3">
          {room.events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <CalendarCheck size={32} className="mx-auto text-zinc-500" />

              <p className="mt-3 text-sm text-zinc-400">
                No scheduled activities found
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Confirm operating hours before booking.
              </p>
            </div>
          ) : (
            room.events.map((event) => (
              <EventCard
                key={`${event.type}-${event.id}`}
                event={event}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </section>
    ))}
  </div>
);

// ======================================================
// MAIN COMPONENT
// ======================================================

const ManageAvailability = () => {
  const [date, setDate] = useState(todayInVegas);
  const [calendar, setCalendar] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [view, setView] = useState("timeline");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // ====================================================
  // FETCH CALENDAR
  // ====================================================

  useEffect(() => {
    const controller = new AbortController();

    const fetchCalendar = async () => {
      try {
        setLoading(true);
        setError("");
        setCalendar(null);
        setSelectedEvent(null);

        const { data } = await api.get("/availability/calendar", {
          params: { date },
          signal: controller.signal,
        });

        if (
          !data.success ||
          !Array.isArray(data.rooms) ||
          !data.summary ||
          data.date !== date
        ) {
          throw new Error("Invalid availability calendar response.");
        }

        if (!controller.signal.aborted) {
          setCalendar(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error.response?.data?.message ||
              error.message ||
              "Unable to load studio availability.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCalendar();

    return () => controller.abort();
  }, [date, refreshKey]);

  const summary = calendar?.summary;

  const changeDate = (amount) => {
    setDate((current) => addDays(current, amount));
  };

  const refresh = () => setRefreshKey((current) => current + 1);

  const ready = !loading && !error && calendar?.date === date;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-h-screen space-y-7 text-white">
      {/* PAGE HEADER */}

      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
            Studio Rental Management
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Studio Availability
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Monitor studio rooms, recurring classes, rentals and blocked periods
            from one centralized calendar.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className={button}
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh Calendar
        </button>
      </header>

      {/* STATISTICS */}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Active Rooms"
          value={ready ? summary.totalRooms : "—"}
        />

        <StatCard
          icon={GraduationCap}
          label="Dance Classes"
          value={ready ? summary.weeklyClasses + summary.danceClasses : "—"}
        />

        <StatCard
          icon={CalendarCheck}
          label="Studio Rentals"
          value={ready ? summary.rentals : "—"}
        />

        <StatCard
          icon={AlertTriangle}
          label="Unassigned Activities"
          value={ready ? summary.unassignedEvents : "—"}
        />
      </section>

      {/* DATE NAVIGATION */}

      <section className={`${panel} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => changeDate(-1)}
              className={button}
            >
              <ChevronLeft size={18} />
            </button>

            <input
              type="date"
              aria-label="Calendar date"
              value={date}
              onChange={(event) => {
                if (event.target.value) {
                  setDate(event.target.value);
                }
              }}
              className="rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm text-white outline-none [color-scheme:dark] focus:border-[#d4af37]"
            />

            <button
              type="button"
              aria-label="Next day"
              onClick={() => changeDate(1)}
              className={button}
            >
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => setDate(todayInVegas())}
              className={button}
            >
              Today
            </button>
          </div>

          <div className="flex rounded-xl border border-zinc-700 bg-black p-1">
            {[
              ["timeline", "Timeline"],
              ["list", "List View"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  view === value
                    ? "bg-[#d4af37] text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <CalendarDays className={GOLD} />

          <h2 className="text-xl font-bold">{formatDate(date)}</h2>
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          All times are displayed in Las Vegas local time.
        </p>
      </section>

      {/* ERROR */}

      {error && (
        <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <div className="flex items-center gap-3 text-red-300">
            <AlertCircle size={21} />

            {error}
          </div>

          <button type="button" onClick={refresh} className={`${button} mt-4`}>
            Try Again
          </button>
        </section>
      )}

      {/* LOADING */}

      {loading && (
        <section
          className={`${panel} flex items-center justify-center gap-3 p-16`}
        >
          <RefreshCw className="animate-spin text-[#d4af37]" />

          <p className="text-sm text-zinc-400">Loading room availability...</p>
        </section>
      )}

      {/* CALENDAR CONTENT */}

      {ready && (
        <>
          {/* UNASSIGNED EVENTS WARNING */}

          {summary.unassignedEvents > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <AlertTriangle size={22} className="shrink-0 text-amber-400" />

              <div>
                <h3 className="font-semibold text-amber-300">
                  Room Assignment Required
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {summary.unassignedEvents} scheduled activities have no
                  assigned room. These activities temporarily block both studios
                  to prevent conflicting reservations.
                </p>
              </div>
            </div>
          )}

          {/* OPERATING HOURS WARNING */}

          {calendar.rooms.some((room) => !room.operatingHours?.configured) && (
            <div className="flex items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-900/50 p-5">
              <Info size={21} className="shrink-0 text-[#d4af37]" />

              <div>
                <h3 className="font-semibold">
                  Operating Hours Not Configured
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Empty calendar periods do not automatically mean a room is
                  available for rental. Operating hours must be confirmed.
                </p>
              </div>
            </div>
          )}

          {/* LEGEND */}

          <div className={`${panel} flex flex-wrap gap-5 p-4`}>
            {Object.entries(EVENT_TYPES).map(([key, item]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${item.dot}`} />

                <span className="text-xs text-zinc-400">{item.label}</span>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500/30" />

              <span className="text-xs text-zinc-400">
                Configured operating hours
              </span>
            </div>
          </div>

          {/* TIMELINE OR LIST */}

          {calendar.rooms.length === 0 ? (
            <div className={`${panel} p-10 text-center text-zinc-400`}>
              No active studio rooms found.
            </div>
          ) : view === "timeline" ? (
            <section className={`${panel} overflow-hidden`}>
              <DailyTimeline calendar={calendar} onSelect={setSelectedEvent} />
            </section>
          ) : (
            <ListView rooms={calendar.rooms} onSelect={setSelectedEvent} />
          )}

          {/* DAILY SUMMARY */}

          <section className={`${panel} p-6`}>
            <h3 className="flex items-center gap-3 text-lg font-bold">
              <CalendarCheck className={GOLD} />
              Daily Activity Summary
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                ["Weekly Classes", summary.weeklyClasses],
                ["Special Classes", summary.danceClasses],
                ["Rentals", summary.rentals],
                ["Room Blocks", summary.roomBlocks],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-zinc-800 bg-black/30 p-4"
                >
                  <p className="text-xs text-zinc-400">{label}</p>

                  <p className="mt-2 text-2xl font-bold text-[#d4af37]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* SELECTED EVENT DETAILS */}

      {selectedEvent && ready && (
        <section className="rounded-2xl border border-[#d4af37]/40 bg-zinc-900 p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold">Activity Details</h3>

            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className={button}
            >
              Close
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {[
              ["Activity", selectedEvent.title],

              ["Type", getEventType(selectedEvent).label],

              [
                "Start",
                new Date(selectedEvent.startsAt).toLocaleString("en-US", {
                  timeZone: TIME_ZONE,
                }),
              ],

              [
                "End",
                new Date(selectedEvent.endsAt).toLocaleString("en-US", {
                  timeZone: TIME_ZONE,
                }),
              ],

              [
                "Studio Rooms",
                selectedEvent.roomIds
                  .map((id) => {
                    const room = calendar.rooms.find((item) => item.id === id);

                    return room ? getRoomName(room) : id;
                  })
                  .join(", "),
              ],

              ["Status", selectedEvent.status || "Scheduled"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-zinc-800 pb-3 text-sm"
              >
                <span className="text-zinc-400">{label}</span>

                <span className="text-right font-medium">{value}</span>
              </div>
            ))}
          </div>

          {selectedEvent.unassigned && (
            <p className="mt-5 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-300">
              This activity requires a room assignment.
            </p>
          )}
        </section>
      )}

      {/* FOOTER NOTICE */}

      <div className="flex items-start gap-3 rounded-xl border border-zinc-800 p-4">
        <Lock size={18} className="shrink-0 text-zinc-500" />

        <p className="text-xs leading-6 text-zinc-500">
          This calendar is currently read-only. Creating reservations, assigning
          rooms, blocking periods and managing operating hours will be
          implemented in the next stages.
        </p>
      </div>
    </div>
  );
};

export default ManageAvailability;
