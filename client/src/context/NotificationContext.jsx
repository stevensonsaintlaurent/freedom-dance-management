import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

import { useAuth } from "../auth/AuthContext";
import api from "@/api/axios";

const NotificationContext = createContext(null);

const REFRESH_INTERVAL = 30000;
const NOTIFICATION_LIMIT = 10;

// ==========================================
// NOTIFICATION PROVIDER
// ==========================================

export function NotificationProvider({ children }) {
  const { user, isLoading } = useAuth();

  const accountKey =
    !isLoading && user ? user.id || user.userId || user.email : null;

  return (
    <NotificationSession
      key={accountKey || "guest"}
      enabled={Boolean(accountKey)}
    >
      {children}
    </NotificationSession>
  );
}

// ==========================================
// ACCOUNT-SPECIFIC NOTIFICATION SESSION
// ==========================================

function NotificationSession({ enabled, children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [busy, setBusy] = useState(false);

  const [fetchError, setFetchError] = useState("");
  const [mutationError, setMutationError] = useState("");

  const [revision, setRevision] = useState(0);

  const activeRef = useRef(false);
  const refreshRef = useRef(null);
  const mutationRef = useRef(null);

  // ==========================================
  // REFRESH NOTIFICATIONS
  // ==========================================

  const refresh = useCallback(async () => {
    if (
      !enabled ||
      !activeRef.current ||
      mutationRef.current ||
      refreshRef.current
    ) {
      return false;
    }

    const controller = new AbortController();

    refreshRef.current = controller;

    try {
      const { data } = await api.get("/notifications", {
        params: {
          limit: NOTIFICATION_LIMIT,
        },
        signal: controller.signal,
      });

      if (
        !activeRef.current ||
        controller.signal.aborted ||
        refreshRef.current !== controller
      ) {
        return false;
      }

      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : [],
      );

      setUnreadCount(Number(data.unreadCount) || 0);

      setFetchError("");

      return true;
    } catch (error) {
      if (controller.signal.aborted || !activeRef.current) {
        return false;
      }

      if (error.response?.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
      }

      setFetchError("Unable to load notifications. Please try again.");

      return false;
    } finally {
      if (refreshRef.current === controller) {
        refreshRef.current = null;

        if (activeRef.current) {
          setLoading(false);
        }
      }
    }
  }, [enabled]);

  // ==========================================
  // AUTOMATIC REFRESH
  // ==========================================

  useEffect(() => {
    activeRef.current = true;

    if (!enabled) {
      return () => {
        activeRef.current = false;
      };
    }

    refresh();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }, REFRESH_INTERVAL);

    const handleFocus = () => {
      refresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("focus", handleFocus);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      activeRef.current = false;

      window.clearInterval(timer);

      window.removeEventListener("focus", handleFocus);

      document.removeEventListener("visibilitychange", handleVisibility);

      refreshRef.current?.abort();
      refreshRef.current = null;

      mutationRef.current?.abort();
      mutationRef.current = null;
    };
  }, [enabled, refresh]);

  // ==========================================
  // MARK NOTIFICATIONS AS READ
  // ==========================================

  const mark = useCallback(
    async (id = null) => {
      if (!enabled || !activeRef.current || mutationRef.current) {
        return false;
      }

      const controller = new AbortController();

      mutationRef.current = controller;

      // Cancel outdated background requests.
      refreshRef.current?.abort();
      refreshRef.current = null;

      setBusy(true);
      setMutationError("");

      try {
        const endpoint = id
          ? `/notifications/${encodeURIComponent(id)}/read`
          : "/notifications/read-all";

        const { data } = await api.patch(
          endpoint,
          {},
          {
            signal: controller.signal,
          },
        );

        if (
          !activeRef.current ||
          controller.signal.aborted ||
          mutationRef.current !== controller
        ) {
          return false;
        }

        if (id) {
          setNotifications((previous) =>
            previous.map((notification) =>
              notification.id === id
                ? {
                    ...notification,
                    ...data.notification,
                  }
                : notification,
            ),
          );
        }

        // Use the authoritative backend unread count.
        setUnreadCount(Number(data.unreadCount) || 0);

        // Notify the history page that data has changed.
        setRevision((previous) => previous + 1);

        return true;
      } catch (error) {
        if (controller.signal.aborted || !activeRef.current) {
          return false;
        }

        if (error.response?.status === 401) {
          setNotifications([]);
          setUnreadCount(0);
        }

        setMutationError(
          error.response?.data?.message ||
            "Unable to update notifications. Please try again.",
        );

        return false;
      } finally {
        if (mutationRef.current === controller) {
          mutationRef.current = null;

          if (activeRef.current) {
            setBusy(false);

            // Retrieve authoritative notification state.
            await refresh();
          }
        }
      }
    },
    [enabled, refresh],
  );

  // ==========================================
  // PUBLIC ACTIONS
  // ==========================================

  const markAsRead = useCallback(
    (id) => {
      if (!id) return Promise.resolve(false);

      return mark(id);
    },
    [mark],
  );

  const markAllAsRead = useCallback(() => {
    return mark();
  }, [mark]);

  const clearError = useCallback(() => {
    setFetchError("");
    setMutationError("");
  }, []);

  // ==========================================
  // CONTEXT PROVIDER
  // ==========================================

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        busy,
        revision,

        error: mutationError || fetchError,
        fetchError,
        mutationError,

        refresh,
        markAsRead,
        markAllAsRead,
        clearError,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ==========================================
// CUSTOM HOOK
// ==========================================

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return context;
}
