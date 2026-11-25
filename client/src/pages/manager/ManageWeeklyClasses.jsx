import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  Plus,
  Users,
  RefreshCw,
  DoorOpen,
  Search,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Save,
  Loader2,
  UserRound,
  Building2,
  ArrowUpRight,
} from "lucide-react";

import api from "../../api/axios";
import { studioRooms } from "../../data/studioRooms";

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

const inputStyle =
  "w-full rounded-xl border border-white/10 bg-zinc-950 " +
  "px-4 py-3 text-sm text-white outline-none " +
  "transition focus:border-[#D4AF37]";

const primaryButton =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-xl bg-[#D4AF37] px-5 py-3 font-semibold " +
  "text-zinc-950 transition hover:bg-[#e6c65b] " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButton =
  "inline-flex items-center justify-center gap-2 " +
  "rounded-xl border border-white/10 bg-white/5 " +
  "px-4 py-3 text-sm font-medium text-zinc-300 " +
  "transition hover:bg-white/10 disabled:opacity-40";

const LEVEL_STYLES = {
  BEGINNER: "bg-emerald-500/10 text-emerald-400",
  INTERMEDIATE: "bg-blue-500/10 text-blue-400",
  ADVANCED: "bg-purple-500/10 text-purple-400",
  OPEN_LEVEL: "bg-amber-500/10 text-amber-400",
};

// ======================================================
// UTILITIES
// ======================================================

const formatDay = (day) => day.charAt(0) + day.slice(1).toLowerCase();

const formatTime = (minutes) => {
  const normalized = minutes % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;

  return `${hours % 12 || 12}:${String(mins).padStart(
    2,
    "0",
  )} ${hours >= 12 ? "PM" : "AM"}`;
};

const getRoomName = (room) => {
  if (!room) return "Unassigned";

  const localRoom = studioRooms.find((item) => item.id === room.id);

  return localRoom?.displayName || room.name;
};

const getInstructorName = (instructor) => {
  if (!instructor) return "Unknown instructor";

  return `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim();
};

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  color = "text-[#D4AF37]",
}) {
  return (
    <div className={`${panel} p-5`}>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/5">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>

      <p className="text-sm text-zinc-400">{label}</p>

      <h2 className="mt-2 text-3xl font-bold text-white">{value}</h2>

      <p className="mt-2 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

// ======================================================
// WEEKLY CLASS CARD
// ======================================================

function WeeklyClassCard({
  item,
  rooms,
  selectedRoomId,
  onRoomChange,
  onSave,
  saving,
  disabled,
  feedback,
}) {
  const assignedRoom = item.room;

  const hasChanges = selectedRoomId !== (item.roomId || "");

  const activeRooms = rooms.filter((room) => room.isActive);

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

  const inactiveSelection =
    selectedRoomId && (!selectedRoom || !selectedRoom.isActive);

  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-zinc-950 p-5 transition hover:border-[#D4AF37]/30">
      {/* CLASS HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
          {formatDay(item.dayOfWeek)}
        </span>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            item.roomId
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          {item.roomId ? "Assigned" : "Unassigned"}
        </span>
      </div>

      <h3 className="mt-4 text-xl font-bold text-white">{item.title}</h3>

      <div className="mt-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            LEVEL_STYLES[item.level] || "bg-white/5 text-zinc-400"
          }`}
        >
          {item.level.replaceAll("_", " ")}
        </span>
      </div>

      {/* CLASS INFORMATION */}

      <div className="mt-5 space-y-4 text-sm text-zinc-300">
        <div className="flex items-start gap-3">
          <Clock3 size={17} className="mt-0.5 shrink-0 text-zinc-500" />

          <div>
            <p>
              {formatTime(item.startTimeMinutes)}
              {" – "}
              {formatTime(item.startTimeMinutes + item.durationMinutes)}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {item.durationMinutes} minutes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <UserRound size={17} className="text-zinc-500" />

          <span>{getInstructorName(item.instructor)}</span>
        </div>

        <div className="flex items-center gap-3">
          <Users size={17} className="text-zinc-500" />

          <span>Capacity: {item.capacity} students</span>
        </div>

        <div className="flex items-center gap-3">
          <DoorOpen size={17} className="text-zinc-500" />

          <span>
            Current room:{" "}
            <span className="font-medium text-white">
              {getRoomName(assignedRoom)}
            </span>
          </span>
        </div>
      </div>

      {/* DESCRIPTION */}

      {item.description && (
        <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-zinc-400">
          {item.description}
        </p>
      )}

      {/* ROOM ASSIGNMENT */}

      <div className="mt-6 border-t border-white/10 pt-5">
        <label
          htmlFor={`room-${item.id}`}
          className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200"
        >
          <Building2 size={16} className="text-[#D4AF37]" />
          Assign Studio Room
        </label>

        <select
          id={`room-${item.id}`}
          value={selectedRoomId}
          onChange={(event) => onRoomChange(item.id, event.target.value)}
          disabled={disabled}
          className={inputStyle}
        >
          <option value="">Unassigned — blocks both rooms</option>

          {activeRooms.map((room) => (
            <option key={room.id} value={room.id}>
              {getRoomName(room)}
            </option>
          ))}

          {inactiveSelection && (
            <option value={selectedRoomId} disabled>
              {selectedRoom ? getRoomName(selectedRoom) : "Unknown room"} —
              Unavailable
            </option>
          )}
        </select>

        {!selectedRoomId && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-400">
            <AlertTriangle size={16} className="shrink-0" />

            <p>
              Unassigned classes are treated as occupying both rooms by the
              rental availability system.
            </p>
          </div>
        )}

        {selectedRoom?.capacity != null &&
          item.capacity > selectedRoom.capacity && (
            <div className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-400">
              Class capacity exceeds the selected room's configured capacity of{" "}
              {selectedRoom.capacity}.
            </div>
          )}

        {hasChanges && (
          <p className="mt-3 text-xs text-amber-400">Unsaved room assignment</p>
        )}

        <button
          type="button"
          onClick={() => onSave(item)}
          disabled={
            disabled ||
            !hasChanges ||
            inactiveSelection ||
            (selectedRoom?.capacity != null &&
              item.capacity > selectedRoom.capacity)
          }
          className={`${primaryButton} mt-4 w-full`}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}

          {saving ? "Saving..." : "Save Room Assignment"}
        </button>
      </div>

      {/* CLASS FEEDBACK */}

      {feedback?.error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
        >
          <AlertCircle size={17} className="shrink-0" />

          <p>{feedback.error}</p>
        </div>
      )}

      {feedback?.success && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400"
        >
          <CheckCircle2 size={17} className="shrink-0" />

          <p>{feedback.success}</p>
        </div>
      )}

      {feedback?.warnings?.length > 0 && (
        <div className="mt-4 space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          {feedback.warnings.map((warning) => (
            <div
              key={warning}
              className="flex items-start gap-2 text-xs leading-relaxed text-amber-300"
            >
              <AlertTriangle size={16} className="shrink-0" />

              <p>{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* PRICE */}

      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs text-zinc-500">Regular class price</span>

          <span className="text-xl font-bold text-[#D4AF37]">
            {item.priceCents === 0
              ? "FREE"
              : `$${(item.priceCents / 100).toFixed(2)}`}
          </span>
        </div>
      </div>
    </article>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function ManageWeeklyClasses() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [roomSelections, setRoomSelections] = useState({});

  const [feedback, setFeedback] = useState({});

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("ALL");
  const [roomFilter, setRoomFilter] = useState("ALL");

  // ====================================================
  // FETCH CLASSES AND ROOMS
  // ====================================================

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [classesResponse, roomsResponse] = await Promise.all([
          api.get("/weekly-classes", {
            signal: controller.signal,
          }),

          api.get("/rooms", {
            signal: controller.signal,
          }),
        ]);

        if (controller.signal.aborted) return;

        const weeklyClasses = classesResponse.data.classes;

        const studioRoomList = roomsResponse.data.rooms;

        if (!Array.isArray(weeklyClasses) || !Array.isArray(studioRoomList)) {
          throw new Error("Invalid class or studio room response.");
        }

        setClasses(weeklyClasses);
        setRooms(studioRoomList);

        setRoomSelections(
          Object.fromEntries(
            weeklyClasses.map((item) => [item.id, item.roomId || ""]),
          ),
        );

        setFeedback({});
      } catch (error) {
        if (controller.signal.aborted) return;

        setError(getErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => controller.abort();
  }, [reloadKey]);

  // ====================================================
  // STATISTICS
  // ====================================================

  const assignedClasses = classes.filter((item) => Boolean(item.roomId)).length;

  const unassignedClasses = classes.length - assignedClasses;

  const weeklyTeachingHours = (
    classes.reduce((total, item) => total + item.durationMinutes, 0) / 60
  ).toFixed(1);

  const hasUnsavedChanges = classes.some(
    (item) => (roomSelections[item.id] || "") !== (item.roomId || ""),
  );

  // ====================================================
  // UNSAVED CHANGES PROTECTION
  // ====================================================

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ====================================================
  // FILTER AND SORT CLASSES
  // ====================================================

  const searchTerm = search.trim().toLowerCase();

  const filteredClasses = classes
    .filter((item) => {
      const searchableText = [
        item.title,
        item.description,
        item.level,
        getInstructorName(item.instructor),
        getRoomName(item.room),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

      const matchesDay = dayFilter === "ALL" || item.dayOfWeek === dayFilter;

      const matchesRoom =
        roomFilter === "ALL" ||
        (roomFilter === "UNASSIGNED"
          ? !item.roomId
          : item.roomId === roomFilter);

      return matchesSearch && matchesDay && matchesRoom;
    })
    .sort(
      (a, b) =>
        DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek) ||
        a.startTimeMinutes - b.startTimeMinutes,
    );

  // ====================================================
  // REFRESH AND NAVIGATION
  // ====================================================

  const confirmDiscard = () =>
    !hasUnsavedChanges ||
    window.confirm(
      "You have unsaved room assignments. " + "Discard your changes?",
    );

  const handleRefresh = () => {
    if (savingId || !confirmDiscard()) return;

    setReloadKey((previous) => previous + 1);
  };

  const handleNavigate = (path) => {
    if (savingId || !confirmDiscard()) return;

    navigate(path);
  };

  // ====================================================
  // CHANGE ROOM SELECTION
  // ====================================================

  const handleRoomChange = (classId, roomId) => {
    setRoomSelections((previous) => ({
      ...previous,
      [classId]: roomId,
    }));

    setFeedback((previous) => ({
      ...previous,
      [classId]: null,
    }));
  };

  // ====================================================
  // SAVE ROOM ASSIGNMENT
  // ====================================================

  const handleSaveRoom = async (item) => {
    if (savingId || loading) return;

    const roomId = roomSelections[item.id] || null;

    if (roomId === (item.roomId || null)) {
      return;
    }

    const selectedRoom = rooms.find((room) => room.id === roomId);

    if (roomId && (!selectedRoom || !selectedRoom.isActive)) {
      setFeedback((previous) => ({
        ...previous,

        [item.id]: {
          error: "Select an active studio room.",
        },
      }));

      return;
    }

    if (
      selectedRoom?.capacity != null &&
      item.capacity > selectedRoom.capacity
    ) {
      setFeedback((previous) => ({
        ...previous,

        [item.id]: {
          error: "Class capacity exceeds room capacity.",
        },
      }));

      return;
    }

    if (
      !roomId &&
      !window.confirm(
        "Removing this room assignment will cause " +
          "the class to block both studio rooms. Continue?",
      )
    ) {
      return;
    }

    try {
      setSavingId(item.id);

      setFeedback((previous) => ({
        ...previous,
        [item.id]: null,
      }));

      const { data } = await api.patch(`/weekly-classes/${item.id}/room`, {
        roomId,
      });

      if (
        !data.success ||
        !data.weeklyClass ||
        data.weeklyClass.id !== item.id
      ) {
        throw new Error(
          "Unexpected server response. Refresh " +
            "to verify the room assignment.",
        );
      }

      const updatedClass = data.weeklyClass;

      setClasses((previous) =>
        previous.map((weeklyClass) =>
          weeklyClass.id === item.id
            ? {
                ...weeklyClass,
                ...updatedClass,
              }
            : weeklyClass,
        ),
      );

      setRoomSelections((previous) => ({
        ...previous,

        [item.id]: updatedClass.roomId || "",
      }));

      setFeedback((previous) => ({
        ...previous,

        [item.id]: {
          success: data.message || "Room assignment saved successfully.",

          warnings: Array.isArray(updatedClass.warnings)
            ? updatedClass.warnings
            : [],
        },
      }));
    } catch (error) {
      setFeedback((previous) => ({
        ...previous,

        [item.id]: {
          error: getErrorMessage(error),
        },
      }));
    } finally {
      setSavingId(null);
    }
  };

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <section className="mx-auto max-w-7xl space-y-7 text-white">
      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            <CalendarDays size={15} />
            Freedom Dance Studio
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Manage Weekly Classes
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Manage recurring dance classes, instructors, studio room assignments
            and weekly scheduling.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={Boolean(savingId)}
            onClick={() => handleNavigate("/manager/availability")}
            className={secondaryButton}
          >
            <CalendarDays size={17} />
            Studio Availability
            <ArrowUpRight size={15} />
          </button>

          <button
            type="button"
            disabled={Boolean(savingId)}
            onClick={() => handleNavigate("/manager/weekly-classes/new")}
            className={primaryButton}
          >
            <Plus size={18} />
            Create New Class
          </button>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Active Weekly Classes"
          value={classes.length}
          description="Recurring classes"
        />

        <StatCard
          icon={Clock3}
          label="Weekly Teaching Hours"
          value={`${weeklyTeachingHours}h`}
          description="Combined teaching time"
        />

        <StatCard
          icon={DoorOpen}
          label="Assigned Classes"
          value={assignedClasses}
          description="Classes with studio rooms"
          color="text-emerald-400"
        />

        <StatCard
          icon={AlertTriangle}
          label="Unassigned Classes"
          value={unassignedClasses}
          description="Require room assignments"
          color="text-amber-400"
        />
      </div>

      {/* WARNINGS */}

      {!loading && unassignedClasses > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <AlertTriangle size={22} className="shrink-0 text-amber-400" />

          <div>
            <h3 className="font-semibold text-amber-400">
              Room assignments required
            </h3>

            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              {unassignedClasses} weekly{" "}
              {unassignedClasses === 1 ? "class does" : "classes do"} not have
              an assigned studio room. These classes block both rooms in the
              rental availability calendar.
            </p>

            <button
              type="button"
              onClick={() => {
                setRoomFilter("UNASSIGNED");
                setDayFilter("ALL");
                setSearch("");
              }}
              className="mt-3 text-sm font-medium text-[#D4AF37] hover:underline"
            >
              View unassigned classes
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          <AlertCircle size={20} className="shrink-0" />

          <p>{error}</p>
        </div>
      )}

      {/* SEARCH AND FILTERS */}

      <div className={`${panel} p-5`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Schedule Filters</h2>

            <p className="mt-1 text-xs text-zinc-500">
              Find classes by instructor, day or room.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || Boolean(savingId)}
            className={secondaryButton}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="class-search"
              className="mb-2 block text-xs text-zinc-400"
            >
              Search classes
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-4 top-3.5 text-zinc-500"
              />

              <input
                id="class-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Class or instructor..."
                className={`${inputStyle} pl-11`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="day-filter"
              className="mb-2 block text-xs text-zinc-400"
            >
              Day of the week
            </label>

            <select
              id="day-filter"
              value={dayFilter}
              onChange={(event) => setDayFilter(event.target.value)}
              className={inputStyle}
            >
              <option value="ALL">All days</option>

              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {formatDay(day)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="room-filter"
              className="mb-2 block text-xs text-zinc-400"
            >
              Studio room
            </label>

            <select
              id="room-filter"
              value={roomFilter}
              onChange={(event) => setRoomFilter(event.target.value)}
              className={inputStyle}
            >
              <option value="ALL">All rooms</option>

              <option value="UNASSIGNED">Unassigned classes</option>

              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {getRoomName(room)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Showing {filteredClasses.length} of {classes.length} classes
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDayFilter("ALL");
              setRoomFilter("ALL");
            }}
            className="text-xs font-medium text-[#D4AF37] hover:underline"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* UNSAVED CHANGES */}

      {hasUnsavedChanges && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          <span>You have unsaved room assignments.</span>

          <button
            type="button"
            disabled={Boolean(savingId)}
            onClick={() => {
              setRoomSelections(
                Object.fromEntries(
                  classes.map((item) => [item.id, item.roomId || ""]),
                ),
              );

              setFeedback({});
            }}
            className="shrink-0 font-medium underline disabled:opacity-40"
          >
            Discard changes
          </button>
        </div>
      )}

      {/* WEEKLY CLASS SCHEDULE */}

      {loading ? (
        <div
          className={`${panel} flex min-h-64 flex-col items-center justify-center gap-4 p-10`}
        >
          <Loader2 className="h-9 w-9 animate-spin text-[#D4AF37]" />

          <p className="text-sm text-zinc-400">
            Loading weekly class schedule...
          </p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className={`${panel} py-16 text-center`}>
          <CalendarDays className="mx-auto mb-4 h-12 w-12 text-zinc-600" />

          <h3 className="text-lg font-semibold">
            {error ? "Unable to load schedule" : "No weekly classes found"}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            {error
              ? "Refresh the page to try again."
              : "Try changing your filters or create a new class."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {DAYS.map((day) => {
            const dailyClasses = filteredClasses.filter(
              (item) => item.dayOfWeek === day,
            );

            if (!dailyClasses.length) {
              return null;
            }

            return (
              <div key={day}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                    <CalendarDays size={19} className="text-[#D4AF37]" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">{formatDay(day)}</h2>

                    <p className="text-xs text-zinc-500">
                      {dailyClasses.length} scheduled{" "}
                      {dailyClasses.length === 1 ? "class" : "classes"}
                    </p>
                  </div>

                  <div className="ml-3 h-px flex-1 bg-white/10" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {dailyClasses.map((item) => (
                    <WeeklyClassCard
                      key={item.id}
                      item={item}
                      rooms={rooms}
                      selectedRoomId={roomSelections[item.id] ?? ""}
                      onRoomChange={handleRoomChange}
                      onSave={handleSaveRoom}
                      saving={savingId === item.id}
                      disabled={Boolean(savingId) || loading || Boolean(error)}
                      feedback={feedback[item.id]}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER */}

      <div className="border-t border-white/10 pt-5 text-center text-xs text-zinc-500">
        Freedom Dance Studio Management Platform
        <span className="mx-2">·</span>
        Weekly Class Management
      </div>
    </section>
  );
}
