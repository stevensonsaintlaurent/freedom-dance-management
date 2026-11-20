import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";

const API = `${(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "")}/api/weekly-bookings`;
const money = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (Number(value) || 0) / 100,
  );
const dateText = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
};
const timeText = (value) => {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const n = ((Number(value) % 1440) + 1440) % 1440;
  const h = Math.floor(n / 60);
  return `${h % 12 || 12}:${String(n % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
const statusColors = {
  PENDING: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  CONFIRMED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  CANCELLED: "border-red-400/30 bg-red-400/10 text-red-300",
};
const inputClass =
  "w-full rounded-xl border border-white/15 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-400";

// Pass the authenticated role from your existing AuthProvider / protected route.
// This prop controls buttons only; the backend must enforce authorization and instructor scoping.
export default function WeeklyBookings({ role = "INSTRUCTOR" }) {
  const normalizedRole = String(role).toUpperCase();
  const canManage = normalizedRole === "MANAGER" || normalizedRole === "ADMIN";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const loadBookings = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(API, { credentials: "include", signal });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to load reservations.");
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (err) {
      if (err.name !== "AbortError")
        setError(err.message || "Unable to load reservations.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadBookings(controller.signal);
    return () => controller.abort();
  }, [loadBookings]);

  const updateStatus = async (booking, status) => {
    if (!canManage || savingId) return;
    if (
      !window.confirm(
        `${status === "CANCELLED" ? "Cancel" : "Confirm"} the booking for ${booking.guestFirstName} ${booking.guestLastName}?`,
      )
    )
      return;
    try {
      setSavingId(booking.id);
      setError("");
      setNotice("");
      const response = await fetch(
        `${API}/${encodeURIComponent(booking.id)}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to update reservation.");
      // Refresh from the database, regardless of the PATCH response shape.
      await loadBookings();
      setNotice(`Reservation ${status.toLowerCase()} successfully.`);
    } catch (err) {
      setError(err.message || "Unable to update reservation.");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const haystack = [
        booking.guestFirstName,
        booking.guestLastName,
        booking.guestEmail,
        booking.guestPhone,
        booking.bookingReference,
        booking.weeklyClass?.title,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!query || haystack.includes(query)) &&
        (statusFilter === "ALL" || booking.status === statusFilter) &&
        (!dateFilter ||
          String(booking.classDate || "").slice(0, 10) === dateFilter)
      );
    });
  }, [bookings, search, statusFilter, dateFilter]);

  const stats = [
    { label: "Reservations", value: bookings.length, icon: Users },
    {
      label: "Pending",
      value: bookings.filter((b) => b.status === "PENDING").length,
      icon: Clock3,
    },
    {
      label: "Confirmed",
      value: bookings.filter((b) => b.status === "CONFIRMED").length,
      icon: CheckCircle2,
    },
    {
      label: "Cancelled",
      value: bookings.filter((b) => b.status === "CANCELLED").length,
      icon: XCircle,
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              Freedom Dance Studio
            </p>
            <h1 className="text-3xl font-black sm:text-4xl">
              {normalizedRole === "INSTRUCTOR"
                ? "My Class Reservations"
                : "Class Reservations"}
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              {normalizedRole === "INSTRUCTOR"
                ? "Students booked into your classes."
                : "View and manage class reservations."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadBookings()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold hover:border-amber-400 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-zinc-900 p-5"
            >
              <Icon size={22} className="text-amber-400" />
              <p className="mt-4 text-sm text-zinc-400">{label}</p>
              <p className="mt-1 text-3xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className="mb-7 rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-xs font-bold text-zinc-400">
                Search Student or Class
              </span>
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-3.5 text-zinc-500"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, email, phone, class..."
                  className={`${inputClass} pl-10`}
                />
              </div>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold text-zinc-400">
                Booking Status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={inputClass}
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold text-zinc-400">
                Attendance Date
              </span>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          {(search || dateFilter || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDateFilter("");
                setStatusFilter("ALL");
              }}
              className="mt-4 text-sm font-bold text-amber-400"
            >
              Clear filters
            </button>
          )}
        </section>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            {notice}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
            <h2 className="text-lg font-black">Student Reservations</h2>
            <span className="text-sm text-zinc-400">
              {filtered.length} shown
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-zinc-400">
              <RefreshCw className="animate-spin text-amber-400" /> Loading
              reservations...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <CalendarDays size={40} className="mx-auto mb-4 text-amber-400" />
              <h3 className="font-bold">No reservations found</h3>
              <p className="mt-2 text-sm text-zinc-400">
                New student bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-zinc-950/80 text-xs uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">Attendance</th>
                    <th className="px-5 py-4">Reference</th>
                    <th className="px-5 py-4">Price</th>
                    <th className="px-5 py-4">Status</th>
                    {canManage && <th className="px-5 py-4">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((booking) => {
                    const weeklyClass = booking.weeklyClass || {};
                    const busy = savingId !== null;
                    return (
                      <tr key={booking.id} className="hover:bg-white/5">
                        <td className="px-5 py-5 align-top">
                          <p className="font-bold">
                            {booking.guestFirstName} {booking.guestLastName}
                          </p>
                          {booking.guestEmail && (
                            <a
                              href={`mailto:${booking.guestEmail}`}
                              className="mt-2 flex items-center gap-2 text-xs text-zinc-400 hover:text-amber-400"
                            >
                              <Mail size={13} />
                              {booking.guestEmail}
                            </a>
                          )}
                          {booking.guestPhone && (
                            <a
                              href={`tel:${booking.guestPhone}`}
                              className="mt-2 flex items-center gap-2 text-xs text-zinc-400 hover:text-amber-400"
                            >
                              <Phone size={13} />
                              {booking.guestPhone}
                            </a>
                          )}
                        </td>
                        <td className="px-5 py-5 align-top">
                          <p className="font-semibold">
                            {weeklyClass.title || "Dance Class"}
                          </p>
                          <p className="mt-2 text-xs text-zinc-400">
                            {weeklyClass.level?.replaceAll("_", " ") || ""}
                          </p>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <p className="font-semibold">
                            {dateText(booking.classDate)}
                          </p>
                          <p className="mt-2 text-xs text-zinc-400">
                            {timeText(weeklyClass.startTimeMinutes)}
                          </p>
                        </td>
                        <td className="px-5 py-5 align-top">
                          <span className="text-xs font-semibold text-amber-400">
                            {booking.bookingReference}
                          </span>
                        </td>
                        <td className="px-5 py-5 align-top font-semibold">
                          {money(booking.priceCents)}
                        </td>
                        <td className="px-5 py-5 align-top">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusColors[booking.status] || ""}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-5 py-5 align-top">
                            <div className="flex flex-wrap gap-2">
                              {booking.status === "PENDING" && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    updateStatus(booking, "CONFIRMED")
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                                >
                                  <CheckCircle2 size={14} />
                                  Confirm
                                </button>
                              )}
                              {booking.status !== "CANCELLED" && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    updateStatus(booking, "CANCELLED")
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                                >
                                  <XCircle size={14} />
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="mt-4 text-xs text-zinc-500">
          Showing up to 100 reservations returned by the server. Student
          information is available only to authorized staff.
        </p>
      </div>
    </main>
  );
}
