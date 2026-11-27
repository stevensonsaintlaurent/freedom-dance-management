import { useEffect, useRef, useState } from "react";
import {
  Bell,
  X,
  CalendarCheck,
  CheckCheck,
  Check,
  RefreshCw,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";

import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../auth/AuthContext";

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    busy,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const { user } = useAuth();

  const [open, setOpen] = useState(false);

  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const location = useLocation();

  const items = Array.isArray(notifications) ? notifications : [];

  const role = String(user?.role || "").toLowerCase();

  const bookingPath =
    role === "admin"
      ? "/admin/bookings"
      : role === "manager"
        ? "/manager/bookings"
        : role === "instructor"
          ? "/instructor/bookings"
          : "/dancer/bookings";

  // ==========================================
  // CLOSE ON NAVIGATION
  // ==========================================

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // ==========================================
  // OUTSIDE CLICK AND ESCAPE
  // ==========================================

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event) => {
      const insideButton = buttonRef.current?.contains(event.target);

      const insidePanel = panelRef.current?.contains(event.target);

      if (!insideButton && !insidePanel) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handleOutside);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);

      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // ==========================================
  // TOGGLE NOTIFICATIONS
  // ==========================================

  const handleToggle = () => {
    if (!open) {
      refresh();
    }

    setOpen((previous) => !previous);
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  // ==========================================
  // NOTIFICATION PANEL
  // ==========================================

  const notificationPanel = (
    <section
      ref={panelRef}
      aria-label="Notifications"
      className="
        fixed left-3 right-3 top-[88px]
        z-[9999] flex max-h-[calc(100dvh-100px)]
        flex-col overflow-hidden rounded-2xl
        border border-amber-500/20
        bg-zinc-950 text-white shadow-2xl
        shadow-black/60
        sm:left-auto sm:right-6 sm:w-[420px]
      "
    >
      {/* HEADER */}

      <div className="border-b border-white/10 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-3">
              <Bell className="size-5 text-amber-400" />
            </div>

            <div>
              <h2 className="text-lg font-bold">Notifications</h2>

              <p className="text-xs text-zinc-400">
                {unreadCount} unread · {items.length} recent
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="
              rounded-lg p-2 text-zinc-400
              hover:bg-white/10 hover:text-white
            "
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ACTIONS */}

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={busy || unreadCount === 0}
            onClick={markAllAsRead}
            className="
              flex items-center gap-2 text-xs
              font-semibold text-amber-400
              hover:text-amber-300
              disabled:opacity-40
            "
          >
            <CheckCheck className="size-4" />
            Mark all as read
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={refresh}
            className="
              flex items-center gap-2
              text-xs text-zinc-400
              hover:text-white
            "
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="
            mx-4 mt-3 rounded-lg border
            border-red-500/20 bg-red-500/10
            p-3 text-sm text-red-400
          "
        >
          {error}
        </div>
      )}

      {/* NOTIFICATION LIST */}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {items.length > 0 ? (
          items.map((item) => {
            const isUnread = !item.readAt;

            const isBooking = String(item.type || "").startsWith("BOOKING_");

            return (
              <article
                key={item.id}
                className={`
                  rounded-xl border p-4
                  transition-colors
                  ${
                    isUnread
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-white/10 bg-zinc-900"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      shrink-0 rounded-xl
                      bg-amber-500/10 p-2.5
                    "
                  >
                    <CalendarCheck className="size-5 text-amber-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {item.title || "Notification"}
                      </h3>

                      {isUnread && (
                        <span className="size-2 shrink-0 rounded-full bg-amber-400" />
                      )}
                    </div>

                    <p className="mt-2 break-words text-sm leading-relaxed text-zinc-300">
                      {item.message}
                    </p>

                    <p className="mt-2 text-xs text-zinc-500">
                      {formatDate(item.createdAt)}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {isUnread ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => markAsRead(item.id)}
                          className="
                            flex items-center gap-1
                            text-xs font-semibold
                            text-amber-400
                            disabled:opacity-50
                          "
                        >
                          <Check className="size-3.5" />
                          Mark as read
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <CheckCheck className="size-3.5" />
                          Read
                        </span>
                      )}

                      {isBooking && (
                        <Link
                          to={bookingPath}
                          onClick={() => setOpen(false)}
                          className="
                            flex items-center gap-1
                            text-xs font-medium
                            text-amber-400
                            hover:text-amber-300
                          "
                        >
                          View bookings
                          <ArrowRight className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="size-7 animate-spin text-amber-400" />

            <p className="text-sm text-zinc-400">Loading notifications...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-4 rounded-full bg-white/5 p-5">
              <Bell className="size-8 text-zinc-500" />
            </div>

            <h3 className="font-semibold">
              {error ? "Notifications unavailable" : "No notifications yet"}
            </h3>

            <p className="mt-2 text-sm text-zinc-500">
              {error
                ? "Try refreshing your notifications."
                : "Your latest updates will appear here."}
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}

      <div className="border-t border-white/10 p-4">
        <Link
          to="/notifications"
          onClick={() => setOpen(false)}
          className="
            flex w-full items-center justify-center
            gap-2 rounded-xl bg-amber-400
            px-4 py-3 text-sm font-bold
            text-zinc-950 transition-colors
            hover:bg-amber-300
          "
        >
          View all notifications
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );

  // ==========================================
  // NOTIFICATION BELL
  // ==========================================

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        onClick={handleToggle}
        className={`
          relative flex size-11 items-center
          justify-center rounded-xl border
          transition-all
          ${
            open
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-white/10 hover:bg-white/10"
          }
        `}
      >
        <Bell className="size-5 text-amber-400" />

        {unreadCount > 0 && (
          <span
            className="
              absolute -right-1 -top-1
              flex min-h-5 min-w-5
              items-center justify-center
              rounded-full bg-amber-400
              px-1 text-[10px] font-black
              text-zinc-950
            "
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(notificationPanel, document.body)}
    </div>
  );
}
