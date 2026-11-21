import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "NO_SHOW", label: "No-show" },
];

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (minutes) => {
  if (!Number.isFinite(minutes)) return "—";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return new Date(Date.UTC(2026, 0, 1, hours, mins)).toLocaleTimeString(
    "en-US",
    {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
    },
  );
};

const getStatusStyle = (status) => {
  switch (status) {
    case "PRESENT":
      return "bg-green-500/15 text-green-400 border-green-500/30";
    case "ABSENT":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "NO_SHOW":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    default:
      return "bg-white/5 text-gray-400 border-white/10";
  }
};

export default function Attendance() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (selectedDate) {
        params.set("classDate", selectedDate);
      }

      if (selectedClass) {
        params.set("weeklyClassId", selectedClass);
      }

      const query = params.toString();

      const response = await fetch(
        `${API_URL}/api/attendance${query ? `?${query}` : ""}`,
        {
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load attendance.");
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedClass]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const markAttendance = async (bookingId, status) => {
    setSavingId(bookingId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/attendance/${bookingId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendanceStatus: status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update attendance.");
      }

      setBookings((previous) =>
        previous.map((booking) =>
          booking.id === bookingId ? data.booking : booking,
        ),
      );

      setMessage("Attendance updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const classes = useMemo(() => {
    const map = new Map();

    bookings.forEach((booking) => {
      const weeklyClass = booking.weeklyClass;

      if (weeklyClass) {
        map.set(weeklyClass.id, weeklyClass.title);
      }
    });

    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const name =
        `${booking.guestFirstName} ${booking.guestLastName}`.toLowerCase();

      return (
        !query ||
        name.includes(query) ||
        booking.guestEmail?.toLowerCase().includes(query) ||
        booking.bookingReference?.toLowerCase().includes(query) ||
        booking.weeklyClass?.title?.toLowerCase().includes(query)
      );
    });
  }, [bookings, search]);

  const summary = useMemo(
    () => ({
      total: filteredBookings.length,
      present: filteredBookings.filter((b) => b.attendanceStatus === "PRESENT")
        .length,
      absent: filteredBookings.filter((b) => b.attendanceStatus === "ABSENT")
        .length,
      noShow: filteredBookings.filter((b) => b.attendanceStatus === "NO_SHOW")
        .length,
      unmarked: filteredBookings.filter((b) => !b.attendanceStatus).length,
    }),
    [filteredBookings],
  );

  const stats = [
    {
      label: "Total Bookings",
      value: summary.total,
      icon: Users,
      color: "text-yellow-400",
    },
    {
      label: "Present",
      value: summary.present,
      icon: CheckCircle2,
      color: "text-green-400",
    },
    {
      label: "Absent",
      value: summary.absent,
      icon: XCircle,
      color: "text-red-400",
    },
    {
      label: "Unmarked",
      value: summary.unmarked,
      icon: Clock3,
      color: "text-gray-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090909] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-yellow-500">
              Freedom Dance Studio
            </p>

            <h1 className="text-3xl font-bold md:text-4xl">Class Attendance</h1>

            <p className="mt-2 text-gray-400">
              Manage student attendance for your classes.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAttendance}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-yellow-500/30 px-5 py-3 text-yellow-400 transition hover:bg-yellow-500/10 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-300"
          >
            {message}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-[#151515] p-5"
              >
                <Icon size={24} className={`mb-4 ${stat.color}`} />

                <p className="text-3xl font-bold">{stat.value}</p>

                <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#151515] p-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Search Student
            </label>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-3 text-gray-500"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, or reference"
                className="w-full rounded-xl border border-white/10 bg-black py-3 pl-10 pr-4 text-white outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Class Date
            </label>

            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-3 top-3 text-gray-500"
              />

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black py-3 pl-10 pr-4 text-white outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Dance Class
            </label>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black p-3 text-white outline-none focus:border-yellow-500"
            >
              <option value="">All Classes</option>

              {classes.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#151515]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
            <h2 className="text-xl font-semibold">Student Attendance</h2>

            <span className="text-sm text-gray-400">
              {filteredBookings.length} reservations
              {" · "}
              {summary.noShow} no-shows
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">
              Loading attendance...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No student reservations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Class</th>
                    <th className="p-4">Date / Time</th>
                    <th className="p-4">Booking</th>
                    <th className="p-4">Attendance</th>
                    <th className="p-4">Mark Attendance</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-t border-white/10 transition hover:bg-white/[0.03]"
                    >
                      <td className="p-4">
                        <p className="font-semibold">
                          {booking.guestFirstName} {booking.guestLastName}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {booking.guestEmail}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-medium">
                          {booking.weeklyClass?.title || "—"}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {booking.weeklyClass?.instructor
                            ? `${booking.weeklyClass.instructor.firstName} ${booking.weeklyClass.instructor.lastName}`
                            : "No instructor"}
                        </p>
                      </td>

                      <td className="p-4">
                        <p>{formatDate(booking.classDate)}</p>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatTime(booking.weeklyClass?.startTimeMinutes)}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="text-sm text-gray-300">
                          {booking.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            booking.attendanceStatus,
                          )}`}
                        >
                          {booking.attendanceStatus?.replace("_", " ") ||
                            "NOT MARKED"}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={booking.attendanceStatus || ""}
                            disabled={savingId === booking.id}
                            onChange={(e) =>
                              markAttendance(booking.id, e.target.value || null)
                            }
                            className="rounded-lg border border-yellow-500/30 bg-black px-3 py-2 text-sm text-yellow-400 outline-none disabled:opacity-50"
                          >
                            <option value="">Not Marked</option>

                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          {savingId === booking.id && (
                            <RefreshCw
                              size={16}
                              className="animate-spin text-yellow-400"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
