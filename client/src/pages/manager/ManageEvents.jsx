import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CalendarCheck,
  Ticket,
  Wallet,
  Plus,
  Search,
  RefreshCw,
  MapPin,
  Clock,
  Users,
  Eye,
  Pencil,
  Loader2,
  AlertCircle,
  CalendarX,
  ImageOff,
} from "lucide-react";

import api from "@/api/axios";

const statusStyles = {
  PUBLISHED: "bg-green-500/10 text-green-400 border-green-500/20",
  DRAFT: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ARCHIVED: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

const formatMoney = (cents = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

const formatDate = (value) => {
  if (!value) return "To be announced";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
};

const formatDateRange = (start, end) => {
  if (!start) return "To be announced";

  if (!end || start.slice(0, 10) === end.slice(0, 10)) {
    return formatDate(start);
  }

  return `${formatDate(start)} – ${formatDate(end)}`;
};

const formatType = (type) => type?.replaceAll("_", " ") || "EVENT";

const StatCard = ({ title, value, icon: Icon, subtitle }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-zinc-400">{title}</p>

        <h3 className="mt-2 text-3xl font-bold text-white">{value}</h3>

        <p className="mt-2 text-xs text-zinc-500">{subtitle}</p>
      </div>

      <div className="rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const EventImage = ({ event }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [event.imageUrl]);

  if (!event.imageUrl || failed) {
    return (
      <div className="flex h-64 items-center justify-center bg-zinc-950 text-zinc-600">
        <div className="text-center">
          <ImageOff className="mx-auto mb-2" size={32} />
          <p className="text-xs">Event flyer unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={event.imageUrl}
      alt={event.title}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-64 w-full bg-zinc-950 ${
        event.imageFit === "cover" ? "object-cover" : "object-contain"
      }`}
    />
  );
};

const EventCard = ({ event, onView }) => {
  const tickets = event.ticketTypes || [];

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition hover:border-[#D4AF37]/40">
      <div className="relative">
        <EventImage event={event} />

        <span
          className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-xl ${
            statusStyles[event.status] || statusStyles.DRAFT
          }`}
        >
          {event.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-xs font-bold tracking-widest text-[#D4AF37]">
          {formatType(event.type)}
        </p>

        <h2 className="text-xl font-bold leading-snug text-white">
          {event.title}
        </h2>

        <p className="mt-2 text-sm text-zinc-400">
          {event.instructorName || "Instructor to be announced"}
        </p>

        <div className="mt-5 space-y-3 text-sm text-zinc-300">
          <div className="flex items-start gap-3">
            <CalendarDays size={17} className="shrink-0 text-[#D4AF37]" />
            {formatDateRange(event.startDate, event.endDate)}
          </div>

          <div className="flex items-start gap-3">
            <Clock size={17} className="shrink-0 text-[#D4AF37]" />
            {event.timeLabel || "To be announced"}
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={17} className="shrink-0 text-[#D4AF37]" />
            {event.location || "Venue to be announced"}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Ticket pricing
          </h3>

          {tickets.length ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-zinc-300">{ticket.name}</span>

                  <span className="shrink-0 font-bold text-[#D4AF37]">
                    {formatMoney(ticket.priceCents)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No tickets configured</p>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ["Sessions", event.sessionCount],
            ["Bookings", event.bookingCount],
            ["Tickets", event.totalTickets],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-zinc-950 p-3 text-center">
              <p className="text-xl font-bold text-white">{value ?? 0}</p>

              <p className="mt-1 text-xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {event.featured && (
            <span className="rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs text-[#D4AF37]">
              Featured
            </span>
          )}

          {event.showInHero && (
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
              Homepage
            </span>
          )}

          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
            {event.registrationEnabled
              ? "Registration enabled"
              : "Registration disabled"}
          </span>
        </div>

        <div className="mt-auto pt-6">
          <div className="mb-4 flex items-center justify-between border-t border-zinc-800 pt-4">
            <span className="text-sm text-zinc-400">Recorded payments</span>

            <span className="font-bold text-green-400">
              {formatMoney(event.totalRevenueCents)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onView(event)}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Eye size={17} />
              View
            </button>

            <button
              type="button"
              disabled
              title="Event editing will be enabled in the next phase"
              className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#D4AF37]/40 px-4 py-3 text-sm font-bold text-black/70"
            >
              <Pencil size={17} />
              Edit
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const EventDetails = ({ event, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-[#D4AF37]">
              EVENT DETAILS
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              {event.title}
            </h2>
          </div>

          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl">
          <EventImage event={event} />
        </div>

        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
          {event.description || "No description available."}
        </p>

        <h3 className="mt-8 text-lg font-bold text-white">Workshop schedule</h3>

        <div className="mt-4 space-y-3">
          {event.sessions?.length ? (
            event.sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <h4 className="font-semibold text-white">{session.title}</h4>

                <p className="mt-2 text-sm text-[#D4AF37]">
                  {formatDate(session.sessionDate)}
                  {" · "}
                  {session.timeLabel || "Time to be announced"}
                </p>

                <p className="mt-2 text-sm text-zinc-400">
                  {session.instructorName}
                </p>

                <p className="mt-2 text-sm text-zinc-300">
                  {session.description}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">Schedule to be announced.</p>
          )}
        </div>

        <h3 className="mt-8 text-lg font-bold text-white">Ticket types</h3>

        <div className="mt-4 space-y-3">
          {event.ticketTypes?.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
            >
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-white">{ticket.name}</span>

                <span className="font-bold text-[#D4AF37]">
                  {formatMoney(ticket.priceCents)}
                </span>
              </div>

              {ticket.salesEndAt && (
                <p className="mt-2 text-xs text-zinc-400">
                  Sales end:{" "}
                  {new Date(ticket.salesEndAt).toLocaleString("en-US", {
                    timeZone: "America/Los_Angeles",
                  })}{" "}
                  (Las Vegas time)
                </p>
              )}
            </div>
          ))}
        </div>

        {event.rehearsalInfo && (
          <div className="mt-8 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5">
            <h3 className="font-bold text-[#D4AF37]">Rehearsal information</h3>

            <p className="mt-3 text-sm text-zinc-300">
              {event.rehearsalInfo.day}
              {" · "}
              {event.rehearsalInfo.time}
            </p>

            <p className="mt-2 text-sm text-zinc-300">
              {event.rehearsalInfo.location}
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              {event.rehearsalInfo.description}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadEvents = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/events/manage", {
          signal: controller.signal,
        });

        if (!data.success || !Array.isArray(data.events)) {
          throw new Error("Invalid events response");
        }

        if (!controller.signal.aborted) {
          setEvents(data.events);
          setSummary(data.summary || {});
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err.response?.data?.message || err.message || "Unable to load events",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => controller.abort();
  }, [refreshKey]);

  const filteredEvents = events.filter((event) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      event.title,
      event.category,
      event.instructorName,
      event.location,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));

    const matchesStatus = status === "ALL" || event.status === status;

    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      title: "Total Events",
      value: summary.total ?? 0,
      icon: CalendarDays,
      subtitle: "All event records",
    },
    {
      title: "Published Events",
      value: summary.published ?? 0,
      icon: CalendarCheck,
      subtitle: "Published event records",
    },
    {
      title: "Total Reservations",
      value: summary.totalBookings ?? 0,
      icon: Users,
      subtitle: "Active event bookings",
    },
    {
      title: "Tickets Reserved",
      value: summary.totalTickets ?? 0,
      icon: Ticket,
      subtitle: "Active reserved tickets",
    },
    {
      title: "Cancelled Events",
      value: summary.cancelled ?? 0,
      icon: CalendarX,
      subtitle: "Cancelled event records",
    },
    {
      title: "Recorded Payments",
      value: formatMoney(summary.totalRevenueCents),
      icon: Wallet,
      subtitle: "Payments on active bookings",
    },
  ];

  return (
    <div className="min-h-screen space-y-8 bg-zinc-950 text-white">
      {/* HEADER */}
      <section className="rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#D4AF37]/10 p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
          Freedom Dance Studio
        </p>

        <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">
              Events Management
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Manage workshops, weekend intensives, socials, concerts, ticket
              reservations and event performance from one central dashboard.
            </p>
          </div>

          <Link
            to="/manager/events/new"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-black transition hover:bg-[#E5C65B] active:scale-[0.98]"
          >
            <Plus size={20} />
            Create Event
          </Link>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <AlertCircle size={20} />

          <p className="flex-1 text-sm">{error}</p>

          <button
            onClick={() => setRefreshKey((key) => key + 1)}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* STATISTICS */}
      {!loading && !error && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </section>
      )}

      {/* FILTERS */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, artists or categories..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-[#D4AF37]"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by event status"
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <button
            type="button"
            disabled={loading}
            onClick={() => setRefreshKey((key) => key + 1)}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-5 py-3 text-sm hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      {/* EVENT LIST */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">All Events</h2>

          {!loading && !error && (
            <span className="text-sm text-zinc-400">
              {filteredEvents.length} events
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 py-24">
            <Loader2 size={36} className="animate-spin text-[#D4AF37]" />

            <p className="mt-4 text-zinc-400">Loading events...</p>
          </div>
        ) : error ? null : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 py-20 text-center">
            <CalendarDays size={44} className="mx-auto text-zinc-600" />

            <h3 className="mt-4 text-xl font-bold">No events found</h3>

            <p className="mt-2 text-sm text-zinc-400">
              Try changing your search or status filter.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setStatus("ALL");
              }}
              className="mt-5 rounded-xl bg-[#D4AF37] px-5 py-2 font-semibold text-black"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onView={setSelectedEvent}
              />
            ))}
          </div>
        )}
      </section>

      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default ManageEvents;
