import { useEffect, useState } from "react";

import {
  Clock,
  Building2,
  CalendarDays,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Globe,
  RotateCcw,
  Loader2,
} from "lucide-react";

import api from "@/api/axios";
import { studioRooms } from "@/data/studioRooms";

// ======================================================
// CONFIGURATION
// ======================================================

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const panel = "rounded-2xl border border-white/10 bg-zinc-900/70";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl " +
  "bg-[#D4AF37] px-5 py-3 font-semibold text-black " +
  "transition hover:bg-[#e6c65b] disabled:opacity-40 " +
  "disabled:cursor-not-allowed";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl " +
  "border border-white/10 bg-white/5 px-4 py-3 text-sm " +
  "font-medium text-zinc-200 transition hover:bg-white/10 " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

const inputStyle =
  "w-full rounded-xl border border-white/10 bg-zinc-950 " +
  "px-4 py-3 text-sm text-white outline-none " +
  "focus:border-[#D4AF37] [color-scheme:dark]";

// ======================================================
// UTILITIES
// ======================================================

const cloneSchedule = (schedule) =>
  schedule.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    isOpen: day.isOpen,
    windows: day.windows.map((window) => ({
      opensAtMinutes: window.opensAtMinutes,
      closesAtMinutes: window.closesAtMinutes,
    })),
  }));

const googleSchedule = () =>
  DAYS.map((dayOfWeek) => ({
    dayOfWeek,
    isOpen: dayOfWeek !== "SUNDAY",
    windows:
      dayOfWeek === "SUNDAY"
        ? []
        : [
            {
              opensAtMinutes: 540,
              closesAtMinutes: dayOfWeek === "SATURDAY" ? 1140 : 1260,
            },
          ],
  }));

const formatDay = (day) => day.charAt(0) + day.slice(1).toLowerCase();

const formatTime = (minutes) => {
  if (minutes === 1440) return "12:00 AM (next day)";

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${hour % 12 || 12}:${String(minute).padStart(
    2,
    "0",
  )} ${hour >= 12 ? "PM" : "AM"}`;
};

const getRoomName = (room) => {
  const localRoom = studioRooms.find((item) => item.id === room.id);

  return localRoom?.displayName || room.name;
};

const getWeeklyHours = (schedule) =>
  schedule.reduce(
    (total, day) =>
      total +
      day.windows.reduce(
        (sum, window) =>
          sum + Math.max(0, window.closesAtMinutes - window.opensAtMinutes),
        0,
      ),
    0,
  ) / 60;

const formatHours = (hours) => Number(hours.toFixed(2)).toString();

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";

// ======================================================
// VALIDATION
// ======================================================

const validateSchedule = (schedule) => {
  const errors = [];

  if (!schedule.some((day) => day.isOpen)) {
    errors.push(
      "At least one day must be open. Use room blocks " +
        "for temporary full-week closures.",
    );
  }

  schedule.forEach((day) => {
    if (!day.isOpen) return;

    if (!day.windows.length) {
      errors.push(`${formatDay(day.dayOfWeek)} requires operating hours.`);

      return;
    }

    if (day.windows.length > 24) {
      errors.push(`${formatDay(day.dayOfWeek)} has too many periods.`);
    }

    const sorted = [...day.windows].sort(
      (a, b) => a.opensAtMinutes - b.opensAtMinutes,
    );

    sorted.forEach((window, index) => {
      const { opensAtMinutes, closesAtMinutes } = window;

      if (
        !Number.isInteger(opensAtMinutes) ||
        !Number.isInteger(closesAtMinutes) ||
        opensAtMinutes < 0 ||
        opensAtMinutes >= 1440 ||
        closesAtMinutes > 1440 ||
        closesAtMinutes <= opensAtMinutes
      ) {
        errors.push(`${formatDay(day.dayOfWeek)}: invalid operating period.`);
      }

      if (index > 0 && opensAtMinutes < sorted[index - 1].closesAtMinutes) {
        errors.push(`${formatDay(day.dayOfWeek)}: operating periods overlap.`);
      }
    });
  });

  return [...new Set(errors)];
};

// ======================================================
// TIME SELECT
// ======================================================

const TimeSelect = ({ value, onChange, closing = false, disabled }) => {
  const options = Array.from(
    { length: closing ? 97 : 96 },
    (_, index) => index * 15,
  ).filter((minutes) => !closing || minutes > 0);

  // Preserve custom times that are not on 15-minute intervals.
  if (!options.includes(value)) {
    options.push(value);
    options.sort((a, b) => a - b);
  }

  return (
    <select
      className={inputStyle}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      {options.map((minutes) => (
        <option key={minutes} value={minutes}>
          {formatTime(minutes)}
        </option>
      ))}
    </select>
  );
};

// ======================================================
// STAT CARD
// ======================================================

const StatCard = ({ icon: Icon, label, value, description }) => (
  <div className={`${panel} p-5`}>
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4AF37]/10">
      <Icon className="h-5 w-5 text-[#D4AF37]" />
    </div>

    <p className="text-sm text-zinc-400">{label}</p>

    <h3 className="mt-1 text-3xl font-bold text-white">{value}</h3>

    <p className="mt-2 text-xs text-zinc-500">{description}</p>
  </div>
);

// ======================================================
// DAY EDITOR
// ======================================================

const DayEditor = ({ day, onToggle, onChange, onAdd, onRemove, disabled }) => {
  const dailyHours =
    day.windows.reduce(
      (sum, window) =>
        sum + Math.max(0, window.closesAtMinutes - window.opensAtMinutes),
      0,
    ) / 60;

  return (
    <div className={`${panel} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">
            {formatDay(day.dayOfWeek)}
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            {day.isOpen
              ? `${formatHours(dailyHours)} operating hours`
              : "Closed for regular reservations"}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={day.isOpen}
          aria-label={`${formatDay(day.dayOfWeek)} open`}
          disabled={disabled}
          onClick={onToggle}
          className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition disabled:opacity-50 ${
            day.isOpen
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {day.isOpen ? "Open" : "Closed"}

          <span
            className={`relative h-6 w-11 rounded-full transition ${
              day.isOpen ? "bg-emerald-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                day.isOpen ? "left-6" : "left-1"
              }`}
            />
          </span>
        </button>
      </div>

      {day.isOpen && (
        <div className="mt-5 space-y-3">
          {day.windows.map((window, index) => (
            <div
              key={index}
              className="rounded-xl border border-white/5 bg-black/20 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">
                  Operating period {index + 1}
                </p>

                <button
                  type="button"
                  title="Remove operating period"
                  aria-label={`Remove operating period ${index + 1}`}
                  disabled={disabled || day.windows.length === 1}
                  onClick={() => onRemove(index)}
                  className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs text-zinc-400">
                    Opening time
                  </label>

                  <TimeSelect
                    value={window.opensAtMinutes}
                    disabled={disabled}
                    onChange={(value) =>
                      onChange(index, "opensAtMinutes", value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-zinc-400">
                    Closing time
                  </label>

                  <TimeSelect
                    closing
                    value={window.closesAtMinutes}
                    disabled={disabled}
                    onChange={(value) =>
                      onChange(index, "closesAtMinutes", value)
                    }
                  />
                </div>
              </div>

              {window.closesAtMinutes <= window.opensAtMinutes && (
                <p className="mt-2 text-xs text-red-400">
                  Closing time must be after opening time.
                </p>
              )}
            </div>
          ))}

          <button
            type="button"
            disabled={disabled || day.windows.length >= 24}
            onClick={onAdd}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:opacity-40"
          >
            <Plus size={16} />
            Add operating period
          </button>
        </div>
      )}
    </div>
  );
};

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function ManageOperatingHours() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [schedule, setSchedule] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

  const activeRooms = rooms.filter((room) => room.isActive);

  const originalSchedule = selectedRoom
    ? cloneSchedule(selectedRoom.schedule)
    : [];

  const hasChanges =
    JSON.stringify(schedule) !== JSON.stringify(originalSchedule);

  const validationErrors = schedule.length ? validateSchedule(schedule) : [];

  const weeklyHours = getWeeklyHours(schedule);

  const openDays = schedule.filter((day) => day.isOpen).length;

  const totalRoomHours = activeRooms.reduce(
    (total, room) => total + room.summary.totalWeeklyHours,
    0,
  );

  // ====================================================
  // FETCH OPERATING HOURS
  // ====================================================

  useEffect(() => {
    const controller = new AbortController();

    const fetchOperatingHours = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get("/operating-hours", {
          signal: controller.signal,
        });

        if (!data.success || !Array.isArray(data.rooms)) {
          throw new Error("Invalid operating hours response.");
        }

        if (controller.signal.aborted) return;

        setRooms(data.rooms);

        const firstRoom =
          data.rooms.find((room) => room.isActive) || data.rooms[0];

        setSelectedRoomId(firstRoom?.id || "");

        setSchedule(firstRoom ? cloneSchedule(firstRoom.schedule) : []);
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(getErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOperatingHours();

    return () => controller.abort();
  }, [reloadKey]);

  // ====================================================
  // UNSAVED CHANGES PROTECTION
  // ====================================================

  useEffect(() => {
    if (!hasChanges) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // ====================================================
  // SELECT ROOM
  // ====================================================

  const handleSelectRoom = (room) => {
    if (saving || room.id === selectedRoomId) return;

    if (
      hasChanges &&
      !window.confirm("You have unsaved changes. Discard them?")
    ) {
      return;
    }

    setSelectedRoomId(room.id);
    setSchedule(cloneSchedule(room.schedule));
    setError("");
    setSuccess("");
  };

  // ====================================================
  // UPDATE DAY
  // ====================================================

  const updateDay = (dayOfWeek, updater) => {
    setSuccess("");

    setSchedule((previous) =>
      previous.map((day) => (day.dayOfWeek === dayOfWeek ? updater(day) : day)),
    );
  };

  const toggleDay = (dayOfWeek) => {
    updateDay(dayOfWeek, (day) => ({
      ...day,
      isOpen: !day.isOpen,
      windows: day.isOpen
        ? []
        : [
            {
              opensAtMinutes: 540,
              closesAtMinutes: dayOfWeek === "SATURDAY" ? 1140 : 1260,
            },
          ],
    }));
  };

  const changeWindow = (dayOfWeek, index, field, value) => {
    updateDay(dayOfWeek, (day) => ({
      ...day,
      windows: day.windows.map((window, position) =>
        position === index
          ? {
              ...window,
              [field]: value,
            }
          : window,
      ),
    }));
  };

  const addWindow = (dayOfWeek) => {
    updateDay(dayOfWeek, (day) => {
      const sorted = [...day.windows].sort(
        (a, b) => a.opensAtMinutes - b.opensAtMinutes,
      );

      // Find an unused period of at least 15 minutes.
      let cursor = 0;
      let newWindow = null;

      for (const window of sorted) {
        if (window.opensAtMinutes - cursor >= 15) {
          newWindow = {
            opensAtMinutes: cursor,
            closesAtMinutes: Math.min(cursor + 60, window.opensAtMinutes),
          };

          break;
        }

        cursor = Math.max(cursor, window.closesAtMinutes);
      }

      if (!newWindow && 1440 - cursor >= 15) {
        newWindow = {
          opensAtMinutes: cursor,
          closesAtMinutes: Math.min(cursor + 60, 1440),
        };
      }

      if (!newWindow) return day;

      return {
        ...day,
        windows: [...day.windows, newWindow].sort(
          (a, b) => a.opensAtMinutes - b.opensAtMinutes,
        ),
      };
    });
  };

  const removeWindow = (dayOfWeek, index) => {
    updateDay(dayOfWeek, (day) => ({
      ...day,
      windows: day.windows.filter((_, position) => position !== index),
    }));
  };

  // ====================================================
  // RESET SCHEDULE
  // ====================================================

  const handleReset = () => {
    if (!selectedRoom) return;

    setSchedule(cloneSchedule(selectedRoom.schedule));
    setError("");
    setSuccess("");
  };

  const handleGoogleDefaults = () => {
    setSchedule(googleSchedule());
    setError("");
    setSuccess("");
  };

  const handleRefresh = () => {
    if (hasChanges && !window.confirm("Discard unsaved changes and refresh?")) {
      return;
    }

    setSuccess("");
    setReloadKey((previous) => previous + 1);
  };

  // ====================================================
  // SAVE OPERATING HOURS
  // ====================================================

  const handleSave = async (bulk = false) => {
    if (
      !selectedRoom ||
      !selectedRoom.isActive ||
      saving ||
      validationErrors.length
    ) {
      return;
    }

    if (bulk && activeRooms.length !== 2) {
      setError("Exactly two active rooms are required for this action.");

      return;
    }

    const target = bulk
      ? "both active studio rooms"
      : getRoomName(selectedRoom);

    const confirmed = window.confirm(
      `Save operating hours for ${target}?\n\n` +
        "Existing classes and reservations will not be " +
        "cancelled automatically. Review the availability " +
        "calendar for affected activities.",
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        schedule: cloneSchedule(schedule),
      };

      const response = bulk
        ? await api.put("/operating-hours/bulk", {
            ...payload,
            roomIds: activeRooms.map((room) => room.id),
          })
        : await api.put(`/operating-hours/${selectedRoomId}`, payload);

      const { data } = response;

      if (!data.success) {
        throw new Error(data.message || "Unable to save operating hours.");
      }

      const updatedRooms = bulk ? data.rooms : [data.room];

      if (
        !Array.isArray(updatedRooms) ||
        updatedRooms.some((room) => !room?.id || !room?.schedule)
      ) {
        throw new Error("Unexpected response. Refresh to verify saved hours.");
      }

      setRooms((previous) =>
        previous.map(
          (room) =>
            updatedRooms.find((updated) => updated.id === room.id) || room,
        ),
      );

      const updatedSelectedRoom = updatedRooms.find(
        (room) => room.id === selectedRoomId,
      );

      if (updatedSelectedRoom) {
        setSchedule(cloneSchedule(updatedSelectedRoom.schedule));
      }

      setSuccess(
        bulk
          ? "Operating hours saved for both studio rooms."
          : "Room operating hours saved successfully.",
      );
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // LOADING STATE
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />

        <p>Loading studio operating hours...</p>
      </div>
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-4 text-white sm:p-6 lg:p-8">
      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
            <Clock size={15} />
            Studio management
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Operating Hours
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Manage weekly opening and closing times for Freedom Dance Studio and
            control when rooms are available for regular reservations.
          </p>
        </div>

        <button
          type="button"
          className={secondaryButton}
          onClick={handleRefresh}
          disabled={saving}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* FEEDBACK */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <AlertCircle size={20} className="shrink-0" />

          <p>{error}</p>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          <CheckCircle2 size={20} className="shrink-0" />

          <p>{success}</p>
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Active rooms"
          value={activeRooms.length}
          description="Available studio spaces"
        />

        <StatCard
          icon={CalendarDays}
          label="Open days"
          value={`${openDays}/7`}
          description="Selected room draft"
        />

        <StatCard
          icon={Clock}
          label="Weekly hours"
          value={`${formatHours(weeklyHours)}h`}
          description="Selected room draft"
        />

        <StatCard
          icon={Globe}
          label="Combined room hours"
          value={`${formatHours(totalRoomHours)}h`}
          description="Saved weekly room-hours"
        />
      </div>

      {/* ROOM SELECTOR */}

      <div className={`${panel} p-5`}>
        <h2 className="text-lg font-semibold">Select Studio Room</h2>

        <p className="mt-1 text-sm text-zinc-400">
          Each studio can have its own operating schedule.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              disabled={saving}
              aria-pressed={selectedRoomId === room.id}
              onClick={() => handleSelectRoom(room)}
              className={`rounded-2xl border p-5 text-left transition ${
                selectedRoomId === room.id
                  ? "border-[#D4AF37] bg-[#D4AF37]/5"
                  : "border-white/10 bg-black/20 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <Building2 className="h-6 w-6 text-[#D4AF37]" />

                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    room.isActive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {room.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                {getRoomName(room)}
              </h3>

              <p className="mt-2 text-sm text-zinc-400">
                {room.configured
                  ? `${room.summary.openDays} open days · ${formatHours(
                      room.summary.totalWeeklyHours,
                    )} hours/week`
                  : "Operating hours not configured"}
              </p>
            </button>
          ))}
        </div>

        {!rooms.length && (
          <p className="mt-4 text-sm text-zinc-400">
            No studio rooms found. Create a room first.
          </p>
        )}
      </div>

      {selectedRoom && (
        <>
          {/* SCHEDULE HEADER */}

          <div className={`${panel} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {getRoomName(selectedRoom)} Schedule
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  America/Los_Angeles — Pacific Time
                </p>
              </div>

              {hasChanges && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400">
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className={secondaryButton}
                onClick={handleGoogleDefaults}
                disabled={saving || !selectedRoom.isActive}
              >
                <Globe size={16} />
                Restore Google defaults
              </button>

              <button
                type="button"
                className={secondaryButton}
                onClick={handleReset}
                disabled={!hasChanges || saving}
              >
                <RotateCcw size={16} />
                Discard changes
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4 text-sm leading-relaxed text-zinc-400">
              Default hours: Monday–Friday, 9 AM–9 PM. Saturday, 9 AM–7 PM.
              Sunday closed. These are the Google hours supplied during initial
              setup, not a live Google connection.
            </div>
          </div>

          {/* WARNINGS */}

          {!selectedRoom.configured && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
              This room does not have configured operating hours. Restore Google
              defaults or create a schedule before saving.
            </div>
          )}

          {!selectedRoom.isActive && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
              This room is inactive. Activate it before editing its operating
              hours.
            </div>
          )}

          {/* WEEKLY SCHEDULE */}

          <div className="grid gap-4 xl:grid-cols-2">
            {schedule.map((day) => (
              <DayEditor
                key={day.dayOfWeek}
                day={day}
                disabled={saving || !selectedRoom.isActive}
                onToggle={() => toggleDay(day.dayOfWeek)}
                onChange={(index, field, value) =>
                  changeWindow(day.dayOfWeek, index, field, value)
                }
                onAdd={() => addWindow(day.dayOfWeek)}
                onRemove={(index) => removeWindow(day.dayOfWeek, index)}
              />
            ))}

            {/* OPERATING POLICY */}

            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-6">
              <AlertTriangle className="mb-4 h-6 w-6 text-[#D4AF37]" />

              <h3 className="font-semibold">Operating Hours Policy</h3>

              <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-400">
                <p>
                  Regular reservations must fall within configured operating
                  hours.
                </p>

                <p>After-hours and Sunday rentals require management review.</p>

                <p>
                  Existing classes and reservations are not automatically
                  cancelled when hours change.
                </p>

                <p>
                  Holiday closures and maintenance periods will be managed
                  through room blocks.
                </p>
              </div>
            </div>
          </div>

          {/* VALIDATION */}

          {validationErrors.length > 0 && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-5"
            >
              <h3 className="flex items-center gap-2 font-semibold text-red-300">
                <AlertCircle size={18} />
                Schedule validation
              </h3>

              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-red-300">
                {validationErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* SAVE CONTROLS */}

          <div className={`${panel} p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-sm text-zinc-400">
                  Total weekly operating hours
                </p>

                <h3 className="mt-1 text-3xl font-bold text-[#D4AF37]">
                  {formatHours(weeklyHours)} hours
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  {openDays} open days · {7 - openDays} closed days
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  className={secondaryButton}
                  disabled={
                    saving ||
                    activeRooms.length !== 2 ||
                    !selectedRoom.isActive ||
                    validationErrors.length > 0
                  }
                  onClick={() => handleSave(true)}
                >
                  <Copy size={17} />
                  Apply to both rooms
                </button>

                <button
                  type="button"
                  className={primaryButton}
                  disabled={
                    saving ||
                    !hasChanges ||
                    !selectedRoom.isActive ||
                    validationErrors.length > 0
                  }
                  onClick={() => handleSave(false)}
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}

                  {saving ? "Saving..." : "Save schedule"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FOOTER */}

      <div className="border-t border-white/10 pt-5 text-center text-xs text-zinc-500">
        Freedom Dance Studio Management Platform
        <span className="mx-2">·</span>
        Operating Hours
      </div>
    </div>
  );
}
