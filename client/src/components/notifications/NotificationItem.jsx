import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import NotificationItem from "./NotificationItem";
export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    busy,
    refresh,
    markAllAsRead,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    const escape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        onClick={() => {
          if (!open) refresh();
          setOpen((v) => !v);
        }}
        className="relative rounded-xl border border-white/10 p-2.5 text-amber-400 hover:bg-white/10"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-amber-400 px-1.5 text-xs font-bold text-black">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section
          aria-label="Notifications"
          className="fixed inset-x-3 top-20 z-50 rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-white">Notifications</h2>
            <button
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </button>
          </div>
          <button
            disabled={busy || !unreadCount}
            onClick={markAllAsRead}
            className="my-3 text-xs font-semibold text-amber-400 disabled:opacity-50"
          >
            Mark all as read
          </button>
          {error && (
            <p role="alert" className="mb-2 text-sm text-red-400">
              {error} <button onClick={refresh}>Retry</button>
            </p>
          )}
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {loading ? (
              <p>Loading…</p>
            ) : notifications.length ? (
              notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onNavigate={() => setOpen(false)}
                />
              ))
            ) : (
              <p className="py-6 text-center text-zinc-400">
                No notifications yet.
              </p>
            )}
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="mt-4 block text-center text-sm font-semibold text-amber-400"
          >
            View all notifications
          </Link>
        </section>
      )}
    </div>
  );
}
