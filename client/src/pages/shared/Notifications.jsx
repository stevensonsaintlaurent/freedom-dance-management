import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  Bell,
  BellRing,
  CheckCheck,
  Check,
  CalendarCheck,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  AlertCircle,
} from "lucide-react";

import api from "@/api/axios";

import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../auth/AuthContext";

// ==========================================
// HELPERS
// ==========================================

const PAGE_SIZE = 10;

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getBookingPath = (role) => {
  switch (String(role || "").toLowerCase()) {
    case "admin":
      return "/admin/bookings";

    case "manager":
      return "/manager/bookings";

    case "instructor":
      return "/instructor/bookings";

    default:
      return "/dancer/bookings";
  }
};

// ==========================================
// STAT CARD
// ==========================================

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-amber-500/10 p-3">
          <Icon className="size-5 text-amber-400" />
        </div>
      </div>

      <p className="text-sm font-medium text-zinc-400">{label}</p>

      <h2 className="mt-2 text-3xl font-bold text-white">{value ?? "—"}</h2>

      <p className="mt-2 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

// ==========================================
// NOTIFICATION CARD
// ==========================================

function NotificationCard({ item, busy, markAsRead, bookingPath }) {
  const isUnread = !item.readAt;

  const isBooking = String(item.type || "").startsWith("BOOKING_");

  return (
    <article
      className={`rounded-2xl border p-4 transition-colors sm:p-6 ${
        isUnread
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-white/10 bg-zinc-900/60"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-xl bg-amber-500/10 p-3">
          {isBooking ? (
            <CalendarCheck className="size-6 text-amber-400" />
          ) : (
            <Bell className="size-6 text-amber-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-white sm:text-lg">
              {item.title || "Notification"}
            </h3>

            {isUnread ? (
              <span className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                <span className="size-2 rounded-full bg-amber-400" />
                Unread
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <CheckCheck className="size-4" />
                Read
              </span>
            )}
          </div>

          <p className="mt-3 break-words text-sm leading-relaxed text-zinc-300 sm:text-base">
            {item.message}
          </p>

          <p className="mt-3 text-xs text-zinc-500">
            {formatDate(item.createdAt)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {isUnread && (
              <button
                type="button"
                disabled={busy}
                onClick={() => markAsRead(item.id)}
                className="flex items-center gap-2 rounded-lg border border-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
              >
                <Check className="size-4" />
                Mark as read
              </button>
            )}

            {isBooking && (
              <Link
                to={bookingPath}
                className="flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300"
              >
                View bookings
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ==========================================
// MAIN NOTIFICATIONS PAGE
// ==========================================

export default function Notifications() {
  const { user } = useAuth();

  const {
    unreadCount,
    busy,
    revision,
    markAsRead,
    markAllAsRead,
    refresh,
    error: notificationError,
  } = useNotifications();

  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState(null);
  const [totalCount, setTotalCount] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const bookingPath = getBookingPath(user?.role);

  const notifications = Array.isArray(result?.notifications)
    ? result.notifications
    : [];

  const pagination = result?.pagination;

  const readCount =
    totalCount === null ? null : Math.max(0, totalCount - unreadCount);

  // ==========================================
  // LOAD NOTIFICATION HISTORY
  // ==========================================

  useEffect(() => {
    const controller = new AbortController();

    const loadNotifications = async () => {
      setLoading(true);
      setError("");
      setResult(null);

      try {
        const { data } = await api.get("/notifications", {
          params: {
            page,
            filter,
            limit: PAGE_SIZE,
          },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const totalPages = Math.max(1, data.pagination.totalPages);

        if (filter === "all") {
          setTotalCount(data.pagination.total);
        }

        if (page > totalPages) {
          setPage(totalPages);
          return;
        }

        setResult(data);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err.response?.data?.message || "Unable to load notification history.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => controller.abort();
  }, [page, filter, revision, retry, unreadCount]);

  // ==========================================
  // LOAD TOTAL COUNT IN FILTERED VIEWS
  // ==========================================

  useEffect(() => {
    if (filter === "all") return;

    const controller = new AbortController();

    api
      .get("/notifications", {
        params: {
          page: 1,
          limit: 1,
          filter: "all",
        },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setTotalCount(data.pagination.total);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setTotalCount(null);
        }
      });

    return () => controller.abort();
  }, [filter, revision, retry, unreadCount]);

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    refresh();
    setRetry((previous) => previous + 1);
  };

  // ==========================================
  // CHANGE FILTER
  // ==========================================

  const handleFilter = (value) => {
    if (value === filter) return;

    setFilter(value);
    setPage(1);
    setResult(null);
    setLoading(true);
  };

  const filters = [
    {
      label: "All notifications",
      value: "all",
      count: totalCount,
    },
    {
      label: "Unread",
      value: "unread",
      count: unreadCount,
    },
    {
      label: "Read",
      value: "read",
      count: readCount,
    },
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <section className="mx-auto max-w-6xl space-y-8 text-white">
      {/* PAGE HEADER */}

      <header className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            <Bell className="size-4" />
            Your dashboard
          </div>

          <h1 className="text-3xl font-black sm:text-4xl">Notifications</h1>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Stay up to date with your class bookings, reminders, studio
            announcements and important updates.
          </p>
        </div>

        <button
          type="button"
          disabled={busy || unreadCount === 0}
          onClick={markAllAsRead}
          className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCheck className="size-5" />
          Mark all as read
        </button>
      </header>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Bell}
          label="Total notifications"
          value={totalCount}
          description="All your notification history"
        />

        <StatCard
          icon={BellRing}
          label="Unread"
          value={unreadCount}
          description="Notifications awaiting your attention"
        />

        <StatCard
          icon={CheckCheck}
          label="Read"
          value={readCount}
          description="Previously reviewed notifications"
        />
      </div>

      {/* FILTERS */}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => handleFilter(item.value)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                filter === item.value
                  ? "bg-amber-400 text-zinc-950"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}

              {item.count !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    filter === item.value ? "bg-black/10" : "bg-white/10"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || busy}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* CONTEXT ERRORS */}

      {notificationError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          <AlertCircle className="size-5 shrink-0" />
          {notificationError}
        </div>
      )}

      {/* REQUEST ERROR */}

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"
        >
          <AlertCircle className="mx-auto size-10 text-red-400" />

          <h3 className="mt-4 font-bold">Unable to load notifications</h3>

          <p className="mt-2 text-sm text-zinc-400">{error}</p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-5 rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-black"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        /* LOADING STATE */

        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/40 py-20">
          <Loader2 className="size-9 animate-spin text-amber-400" />

          <p className="mt-4 text-sm text-zinc-400">
            Loading your notifications...
          </p>
        </div>
      ) : notifications.length > 0 ? (
        /* NOTIFICATION LIST */

        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            Showing {notifications.length} of{" "}
            {pagination?.total ?? notifications.length} notifications
          </p>

          {notifications.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              busy={busy}
              markAsRead={markAsRead}
              bookingPath={bookingPath}
            />
          ))}
        </div>
      ) : (
        /* EMPTY STATE */

        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-amber-500/10">
            {filter === "unread" ? (
              <CheckCheck className="size-10 text-amber-400" />
            ) : (
              <Inbox className="size-10 text-amber-400" />
            )}
          </div>

          <h3 className="text-xl font-bold">
            {filter === "unread"
              ? "You're all caught up!"
              : filter === "read"
                ? "No read notifications"
                : "No notifications yet"}
          </h3>

          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
            {filter === "unread"
              ? "You don't have any unread notifications."
              : filter === "read"
                ? "Notifications you mark as read will appear here."
                : "Your bookings, reminders and important studio updates will appear here."}
          </p>

          {filter !== "all" && (
            <button
              type="button"
              onClick={() => handleFilter("all")}
              className="mt-6 rounded-xl border border-amber-500/30 px-5 py-3 text-sm font-semibold text-amber-400 hover:bg-amber-500/10"
            >
              View all notifications
            </button>
          )}
        </div>
      )}

      {/* PAGINATION */}

      {!loading && !error && pagination && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-white/5 disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>

          <span className="text-sm text-zinc-400">
            Page <strong className="text-white">{page}</strong> of{" "}
            {Math.max(1, pagination.totalPages)}
          </span>

          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-white/5 disabled:opacity-30"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* FOOTER */}

      <footer className="border-t border-white/10 pt-6 text-center text-xs text-zinc-500">
        Freedom Dance Studio · Notification Center
      </footer>
    </section>
  );
}
