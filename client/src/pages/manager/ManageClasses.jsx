import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  Clock,
  Users,
  DoorOpen,
  UserRound,
  Plus,
  RefreshCw,
  Search,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Save,
  CalendarCheck,
  GraduationCap,
  ArrowUpRight,
  Filter,
  X,
} from "lucide-react";

import api from "../../api/axios";
import { studioRooms } from "../../data/studioRooms";

// ======================================================
// CONFIGURATION
// ======================================================

const TIME_ZONE = "America/Los_Angeles";

const levels = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "OPEN_LEVEL", label: "Open Level" },
];

const inputStyle =
  "w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-50";

// ======================================================
// FORMATTING UTILITIES
// ======================================================

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const formatTime = (value) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));

const getLocalDate = (value) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
};

const formatDuration = (startsAt, endsAt) => {
  const minutes = Math.round((new Date(endsAt) - new Date(startsAt)) / 60000);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "Invalid duration";
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (!hours) return `${remaining} min`;

  if (!remaining) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours}h ${remaining}m`;
};

const formatPrice = (priceCents) =>
  priceCents === 0
    ? "FREE"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(priceCents / 100);

const formatLevel = (level) =>
  levels.find((item) => item.value === level)?.label || level;

const getInstructorName = (instructor) => {
  if (!instructor) return "Unknown instructor";

  return `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim();
};

const getRoomName = (room) => {
  if (!room) return "Unassigned";

  const localRoom = studioRooms.find((item) => item.id === room.id);

  return localRoom?.displayName || room.name;
};

const getLevelStyle = (level) => {
  switch (level) {
    case "BEGINNER":
      return "border-green-500/20 bg-green-500/10 text-green-400";

    case "INTERMEDIATE":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "ADVANCED":
      return "border-purple-500/20 bg-purple-500/10 text-purple-400";

    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }
};

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = "text-amber-400",
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-400">{title}</p>

        <div className={`rounded-xl bg-white/5 p-3 ${color}`}>
          <Icon size={21} />
        </div>
      </div>

      <h2 className="mt-3 text-3xl font-extrabold">{value}</h2>

      {description && (
        <p className="mt-2 text-xs text-zinc-500">{description}</p>
      )}
    </div>
  );
}

// ======================================================
// CLASS CARD
// ======================================================

function ClassCard({
  danceClass,
  rooms,
  selectedRoomId,
  onRoomChange,
  onSaveRoom,
  saving,
  busy,
  feedback,
}) {
  const confirmedBookings = danceClass.confirmedBookings ?? 0;

  const availableSpots = danceClass.availableSpots ?? 0;

  const capacity = danceClass.capacity ?? 0;

  const bookingPercentage =
    capacity > 0
      ? Math.min(100, Math.round((confirmedBookings / capacity) * 100))
      : 0;

  const assignedRoom =
    rooms.find((room) => room.id === danceClass.roomId) || danceClass.room;

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

  const hasChanges = selectedRoomId !== (danceClass.roomId || "");

  const capacityExceeded =
    selectedRoom?.capacity != null && capacity > selectedRoom.capacity;

  const invalidRoom = Boolean(selectedRoomId) && !selectedRoom;

  const hasStarted = new Date(danceClass.startsAt) <= new Date();

  const isFull = availableSpots === 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 transition hover:border-white/20">
      {/* CLASS HEADER */}

      <div className="border-b border-white/10 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getLevelStyle(
              danceClass.level,
            )}`}
          >
            {formatLevel(danceClass.level)}
          </span>

          {!danceClass.roomId && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              <AlertTriangle size={12} />
              Unassigned Room
            </span>
          )}

          {isFull && (
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
              Fully Booked
            </span>
          )}
        </div>

        <h2 className="mt-4 break-words text-xl font-extrabold text-white">
          {danceClass.title}
        </h2>

        {danceClass.description && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-400">
            {danceClass.description}
          </p>
        )}
      </div>

      {/* CLASS DETAILS */}

      <div className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <CalendarDays size={19} className="mt-0.5 shrink-0 text-amber-400" />

          <div>
            <p className="text-xs text-zinc-500">Class Date</p>

            <p className="mt-1 text-sm font-semibold">
              {formatDate(danceClass.startsAt)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock size={19} className="mt-0.5 shrink-0 text-amber-400" />

          <div>
            <p className="text-xs text-zinc-500">Schedule — Pacific Time</p>

            <p className="mt-1 text-sm font-semibold">
              {formatTime(danceClass.startsAt)}
              {" – "}
              {getLocalDate(danceClass.startsAt) !==
                getLocalDate(danceClass.endsAt) &&
                `${formatDate(danceClass.endsAt)}, `}
              {formatTime(danceClass.endsAt)}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Duration: {formatDuration(danceClass.startsAt, danceClass.endsAt)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <UserRound size={19} className="mt-0.5 shrink-0 text-amber-400" />

          <div>
            <p className="text-xs text-zinc-500">Instructor</p>

            <p className="mt-1 text-sm font-semibold">
              {getInstructorName(danceClass.instructor)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <DoorOpen size={19} className="mt-0.5 shrink-0 text-amber-400" />

          <div>
            <p className="text-xs text-zinc-500">Assigned Studio Room</p>

            <p
              className={`mt-1 text-sm font-semibold ${
                danceClass.roomId ? "text-white" : "text-amber-400"
              }`}
            >
              {assignedRoom
                ? getRoomName(assignedRoom)
                : danceClass.roomId
                  ? "Assigned room unavailable"
                  : "No room assigned"}
            </p>

            {assignedRoom?.isActive === false && (
              <p className="mt-1 text-xs text-red-400">
                This room is inactive.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BOOKING INFORMATION */}

      <div className="border-y border-white/10 bg-zinc-950/40 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Booking Progress</p>

          <p className="text-sm font-bold text-amber-400">
            {bookingPercentage}%
          </p>
        </div>

        <div
          role="progressbar"
          aria-label="Class booking progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={bookingPercentage}
          className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800"
        >
          <div
            className={`h-full rounded-full transition-all ${
              isFull ? "bg-red-500" : "bg-amber-500"
            }`}
            style={{
              width: `${bookingPercentage}%`,
            }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold">{capacity}</p>

            <p className="mt-1 text-xs text-zinc-500">Capacity</p>
          </div>

          <div>
            <p className="text-xl font-bold text-green-400">
              {confirmedBookings}
            </p>

            <p className="mt-1 text-xs text-zinc-500">Booked</p>
          </div>

          <div>
            <p className="text-xl font-bold text-amber-400">{availableSpots}</p>

            <p className="mt-1 text-xs text-zinc-500">Available</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-zinc-400">Regular Price</span>

          <span className="text-xl font-extrabold text-amber-400">
            {formatPrice(danceClass.priceCents)}
          </span>
        </div>
      </div>

      {/* ROOM MANAGEMENT */}

      <div className="space-y-4 p-6">
        <div>
          <h3 className="flex items-center gap-2 font-bold">
            <DoorOpen size={18} className="text-amber-400" />
            Room Assignment
          </h3>

          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Change the studio room without affecting existing student bookings.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-medium text-zinc-400">
            Select Studio Room
          </span>

          <select
            value={selectedRoomId}
            onChange={(event) =>
              onRoomChange(danceClass.id, event.target.value)
            }
            disabled={busy || hasStarted}
            className={inputStyle}
          >
            <option value="">Unassigned</option>

            {invalidRoom && (
              <option value={selectedRoomId} disabled>
                Current room — unavailable
              </option>
            )}

            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {getRoomName(room)}
                {room.capacity != null ? ` — Capacity ${room.capacity}` : ""}
              </option>
            ))}
          </select>
        </label>

        {capacityExceeded && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle size={17} className="shrink-0" />
            Class capacity ({capacity}) exceeds the selected room capacity (
            {selectedRoom.capacity}).
          </div>
        )}

        {selectedRoom && selectedRoom.capacity == null && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-300">
            <AlertTriangle size={17} className="shrink-0" />
            Room capacity is not configured. Verify permitted occupancy before
            assigning this class.
          </div>
        )}

        {!selectedRoomId && (
          <p className="text-xs leading-5 text-amber-400">
            Unassigned classes block both studio rooms in the availability
            system.
          </p>
        )}

        {hasStarted && (
          <p className="text-xs text-amber-400">
            This class has already started. Refresh the class list.
          </p>
        )}

        <button
          type="button"
          disabled={
            busy || !hasChanges || capacityExceeded || invalidRoom || hasStarted
          }
          onClick={() => onSaveRoom(danceClass, selectedRoomId)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}

          {saving
            ? "Saving Room..."
            : hasChanges
              ? "Save Room Assignment"
              : "Room Assignment Saved"}
        </button>

        {feedback?.message && (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs leading-5 ${
              feedback.type === "error"
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-green-500/20 bg-green-500/10 text-green-400"
            }`}
          >
            {feedback.type === "error" ? (
              <AlertCircle size={17} className="shrink-0" />
            ) : (
              <CheckCircle2 size={17} className="shrink-0" />
            )}

            {feedback.message}
          </div>
        )}

        {feedback?.warnings?.length > 0 && (
          <div
            role="status"
            className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <AlertTriangle size={17} />
              Scheduling Warnings
            </div>

            <ul className="mt-2 space-y-2 text-xs leading-5 text-amber-200">
              {feedback.warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function ManageClasses() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [roomSelections, setRoomSelections] = useState({});

  const [feedback, setFeedback] = useState({});

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");

  const [instructorFilter, setInstructorFilter] = useState("ALL");

  const [dateFilter, setDateFilter] = useState("");

  // ====================================================
  // FETCH CLASSES AND ROOMS
  // ====================================================

  useEffect(() => {
    const controller = new AbortController();

    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [classResponse, roomResponse] = await Promise.all([
          api.get("/classes", {
            signal: controller.signal,
          }),

          api.get("/rooms", {
            signal: controller.signal,
          }),
        ]);

        const classList = classResponse.data.classes;
        const roomList = roomResponse.data.rooms;

        if (!Array.isArray(classList) || !Array.isArray(roomList)) {
          throw new Error("Invalid studio information received.");
        }

        if (!active) return;

        setClasses(classList);

        setRooms(roomList.filter((room) => room.isActive));

        setRoomSelections(
          Object.fromEntries(
            classList.map((danceClass) => [
              danceClass.id,
              danceClass.roomId || "",
            ]),
          ),
        );

        setFeedback({});
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load dance classes.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  // ====================================================
  // DASHBOARD STATISTICS
  // ====================================================

  const statistics = useMemo(
    () => ({
      totalClasses: classes.length,

      confirmedBookings: classes.reduce(
        (total, item) => total + (item.confirmedBookings ?? 0),
        0,
      ),

      availableSpots: classes.reduce(
        (total, item) => total + (item.availableSpots ?? 0),
        0,
      ),

      assignedClasses: classes.filter((item) => Boolean(item.roomId)).length,

      unassignedClasses: classes.filter((item) => !item.roomId).length,
    }),
    [classes],
  );

  // ====================================================
  // INSTRUCTOR FILTER OPTIONS
  // ====================================================

  const instructors = useMemo(() => {
    const uniqueInstructors = new Map();

    classes.forEach((danceClass) => {
      if (danceClass.instructor?.id) {
        uniqueInstructors.set(danceClass.instructor.id, danceClass.instructor);
      }
    });

    return [...uniqueInstructors.values()].sort((a, b) =>
      getInstructorName(a).localeCompare(getInstructorName(b)),
    );
  }, [classes]);

  // ====================================================
  // SEARCH AND FILTER CLASSES
  // ====================================================

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return classes
      .filter((danceClass) => {
        const instructorName = getInstructorName(danceClass.instructor);

        const roomName = getRoomName(danceClass.room);

        const searchableText = [
          danceClass.title,
          danceClass.description,
          instructorName,
          roomName,
          formatLevel(danceClass.level),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || searchableText.includes(query);

        const matchesRoom =
          roomFilter === "ALL" ||
          (roomFilter === "UNASSIGNED"
            ? !danceClass.roomId
            : danceClass.roomId === roomFilter);

        const matchesLevel =
          levelFilter === "ALL" || danceClass.level === levelFilter;

        const matchesInstructor =
          instructorFilter === "ALL" ||
          danceClass.instructor?.id === instructorFilter;

        const matchesDate =
          !dateFilter || getLocalDate(danceClass.startsAt) === dateFilter;

        return (
          matchesSearch &&
          matchesRoom &&
          matchesLevel &&
          matchesInstructor &&
          matchesDate
        );
      })
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }, [classes, search, roomFilter, levelFilter, instructorFilter, dateFilter]);

  // ====================================================
  // UNSAVED ROOM ASSIGNMENTS
  // ====================================================

  const unsavedChanges = classes.filter(
    (danceClass) =>
      (roomSelections[danceClass.id] ?? "") !== (danceClass.roomId || ""),
  ).length;

  useEffect(() => {
    if (!unsavedChanges && !savingId) return;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [unsavedChanges, savingId]);

  // ====================================================
  // CHANGE SELECTED ROOM
  // ====================================================

  const handleRoomChange = (classId, roomId) => {
    if (savingId) return;

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

  const handleSaveRoom = async (danceClass, roomId) => {
    if (savingId || loading || error) return;

    if (roomId === (danceClass.roomId || "")) {
      return;
    }

    if (new Date(danceClass.startsAt) <= new Date()) {
      setFeedback((previous) => ({
        ...previous,

        [danceClass.id]: {
          type: "error",
          message: "This class has already started.",
        },
      }));

      return;
    }

    const selectedRoom = rooms.find((room) => room.id === roomId);

    if (roomId && !selectedRoom) {
      setFeedback((previous) => ({
        ...previous,

        [danceClass.id]: {
          type: "error",
          message: "The selected room is unavailable.",
        },
      }));

      return;
    }

    if (
      selectedRoom?.capacity != null &&
      danceClass.capacity > selectedRoom.capacity
    ) {
      setFeedback((previous) => ({
        ...previous,

        [danceClass.id]: {
          type: "error",
          message: "Class capacity exceeds the selected room capacity.",
        },
      }));

      return;
    }

    if (!roomId) {
      const confirmed = window.confirm(
        "Remove this room assignment? " +
          "An unassigned class will block both studio rooms.",
      );

      if (!confirmed) return;
    }

    try {
      setSavingId(danceClass.id);

      setFeedback((previous) => ({
        ...previous,
        [danceClass.id]: null,
      }));

      const response = await api.patch(
        `/classes/${danceClass.id}/room`,
        {
          roomId: roomId || null,
        },
        {
          timeout: 35000,
        },
      );

      const updatedClass = response.data?.danceClass;

      if (
        !response.data?.success ||
        updatedClass?.id !== danceClass.id ||
        (updatedClass.roomId || "") !== roomId
      ) {
        throw new Error("Room assignment could not be confirmed.");
      }

      setClasses((previous) =>
        previous.map((item) =>
          item.id === updatedClass.id
            ? {
                ...item,
                ...updatedClass,
              }
            : item,
        ),
      );

      setRoomSelections((previous) => ({
        ...previous,

        [updatedClass.id]: updatedClass.roomId || "",
      }));

      setFeedback((previous) => ({
        ...previous,

        [updatedClass.id]: {
          type: "success",

          message:
            response.data.message || "Room assignment saved successfully.",

          warnings: Array.isArray(updatedClass.warnings)
            ? updatedClass.warnings
            : [],
        },
      }));
    } catch (err) {
      const uncertainResult =
        err.code === "ECONNABORTED" ||
        err.code === "ETIMEDOUT" ||
        !err.response;

      setFeedback((previous) => ({
        ...previous,

        [danceClass.id]: {
          type: "error",

          message: uncertainResult
            ? "The update could not be confirmed. Refresh the class list before trying again."
            : err.response?.data?.message || "Failed to save room assignment.",
        },
      }));
    } finally {
      setSavingId(null);
    }
  };

  // ====================================================
  // REFRESH AND NAVIGATION
  // ====================================================

  const confirmDiscardChanges = () => {
    if (savingId) return false;

    if (!unsavedChanges) return true;

    return window.confirm(
      "You have unsaved room assignments. " +
        "Do you want to discard these changes?",
    );
  };

  const handleRefresh = () => {
    if (!confirmDiscardChanges()) return;

    setReloadKey((previous) => previous + 1);
  };

  const handleNavigate = (path) => {
    if (!confirmDiscardChanges()) return;

    navigate(path);
  };

  const clearFilters = () => {
    setSearch("");
    setRoomFilter("ALL");
    setLevelFilter("ALL");
    setInstructorFilter("ALL");
    setDateFilter("");
  };

  const hasFilters =
    Boolean(search) ||
    roomFilter !== "ALL" ||
    levelFilter !== "ALL" ||
    instructorFilter !== "ALL" ||
    Boolean(dateFilter);

  // ====================================================
  // LOADING STATE
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-4 text-zinc-400">
        <Loader2 size={35} className="animate-spin text-amber-400" />

        <p>Loading dance classes...</p>
      </div>
    );
  }

  // ====================================================
  // ERROR STATE
  // ====================================================

  if (error) {
    return (
      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <AlertCircle size={35} className="mx-auto text-red-400" />

        <h2 className="mt-4 text-xl font-bold text-white">
          Unable to Load Dance Classes
        </h2>

        <p className="mt-3 text-sm text-red-400">{error}</p>

        <button
          type="button"
          onClick={handleRefresh}
          className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-zinc-950"
        >
          <RefreshCw size={17} />
          Try Again
        </button>
      </section>
    );
  }

  // ====================================================
  // RENDER DASHBOARD
  // ====================================================

  return (
    <section className="mx-auto max-w-[1600px] space-y-8 px-4 py-6 text-white md:px-8">
      {/* PAGE HEADER */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
            Studio Management
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
            Manage Dance Classes
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Manage individual classes, workshops, masterclasses, student
            bookings and studio room assignments at Freedom Dance Studio.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={Boolean(savingId)}
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            disabled={Boolean(savingId)}
            onClick={() => handleNavigate("/manager/availability")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-50"
          >
            <CalendarCheck size={17} />
            Availability
          </button>

          <button
            type="button"
            disabled={Boolean(savingId)}
            onClick={() => handleNavigate("/manager/classes/new")}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            <Plus size={19} />
            Create Dance Class
          </button>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard
          title="Upcoming Classes"
          value={statistics.totalClasses}
          icon={CalendarDays}
          description="Scheduled individual classes"
        />

        <StatCard
          title="Confirmed Bookings"
          value={statistics.confirmedBookings}
          icon={Users}
          color="text-green-400"
          description="Confirmed class reservations"
        />

        <StatCard
          title="Available Spots"
          value={statistics.availableSpots}
          icon={CalendarCheck}
          description="Remaining student capacity"
        />

        <StatCard
          title="Assigned Classes"
          value={statistics.assignedClasses}
          icon={DoorOpen}
          color="text-green-400"
          description="Classes with a room assignment"
        />

        <StatCard
          title="Unassigned Classes"
          value={statistics.unassignedClasses}
          icon={AlertTriangle}
          description="Classes requiring room assignment"
        />
      </div>

      {/* WARNINGS */}

      {statistics.unassignedClasses > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:flex-row sm:items-center">
          <AlertTriangle size={25} className="shrink-0 text-amber-400" />

          <div className="flex-1">
            <h3 className="font-bold text-amber-400">
              Room Assignments Required
            </h3>

            <p className="mt-1 text-sm leading-6 text-zinc-400">
              {statistics.unassignedClasses} upcoming{" "}
              {statistics.unassignedClasses === 1 ? "class does" : "classes do"}{" "}
              not have a studio room assigned. Unassigned classes block both
              rooms in the availability system.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              clearFilters();
              setRoomFilter("UNASSIGNED");
            }}
            className="rounded-xl border border-amber-500/30 px-4 py-2 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/10"
          >
            View Unassigned
          </button>
        </div>
      )}

      {rooms.length === 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          No active studio rooms are available. Check Studio Rooms Management
          before assigning classes.
        </div>
      )}

      {unsavedChanges > 0 && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-300"
        >
          <AlertCircle size={19} className="shrink-0" />
          You have {unsavedChanges} unsaved room{" "}
          {unsavedChanges === 1 ? "assignment" : "assignments"}. Save each
          modified class individually.
        </div>
      )}

      {/* SEARCH AND FILTERS */}

      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={19} className="text-amber-400" />

            <h2 className="font-bold">Search & Filters</h2>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300"
            >
              <X size={15} />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-zinc-400">
              Search Classes
            </span>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search classes..."
                className={`${inputStyle} pl-10`}
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold text-zinc-400">
              Studio Room
            </span>

            <select
              value={roomFilter}
              onChange={(event) => setRoomFilter(event.target.value)}
              className={inputStyle}
            >
              <option value="ALL">All Rooms</option>

              <option value="UNASSIGNED">Unassigned Classes</option>

              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {getRoomName(room)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold text-zinc-400">
              Dance Level
            </span>

            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className={inputStyle}
            >
              <option value="ALL">All Levels</option>

              {levels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold text-zinc-400">
              Instructor
            </span>

            <select
              value={instructorFilter}
              onChange={(event) => setInstructorFilter(event.target.value)}
              className={inputStyle}
            >
              <option value="ALL">All Instructors</option>

              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {getInstructorName(instructor)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold text-zinc-400">
              Class Date
            </span>

            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className={`${inputStyle} [color-scheme:dark]`}
            />
          </label>
        </div>

        <p className="mt-5 text-xs text-zinc-500">
          Showing {filteredClasses.length} of {classes.length} upcoming classes.
          All dates and times use Las Vegas local time.
        </p>
      </div>

      {/* CLASS LIST */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={23} className="text-amber-400" />

          <h2 className="text-xl font-bold">Upcoming Dance Classes</h2>
        </div>

        <span className="text-sm text-zinc-500">
          {filteredClasses.length} results
        </span>
      </div>

      {filteredClasses.length > 0 ? (
        <div className="grid items-start gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredClasses.map((danceClass) => (
            <ClassCard
              key={danceClass.id}
              danceClass={danceClass}
              rooms={rooms}
              selectedRoomId={roomSelections[danceClass.id] ?? ""}
              onRoomChange={handleRoomChange}
              onSaveRoom={handleSaveRoom}
              saving={savingId === danceClass.id}
              busy={Boolean(savingId)}
              feedback={feedback[danceClass.id]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 p-12 text-center">
          <CalendarDays size={42} className="mx-auto text-zinc-600" />

          <h3 className="mt-5 text-lg font-bold">
            {classes.length === 0
              ? "No Upcoming Dance Classes"
              : "No Matching Classes"}
          </h3>

          <p className="mt-3 text-sm text-zinc-400">
            {classes.length === 0
              ? "Create your first individual dance class or special workshop."
              : "Try changing your search or filters."}
          </p>

          <button
            type="button"
            disabled={Boolean(savingId)}
            onClick={() =>
              classes.length === 0
                ? handleNavigate("/manager/classes/new")
                : clearFilters()
            }
            className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {classes.length === 0 ? (
              <>
                <Plus size={18} />
                Create Dance Class
              </>
            ) : (
              "Clear Filters"
            )}
          </button>
        </div>
      )}

      {/* AVAILABILITY FOOTER */}

      <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-zinc-900/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
            <CalendarCheck size={24} />
          </div>

          <div>
            <h3 className="font-bold">Studio Availability Calendar</h3>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              Review weekly classes, individual workshops, studio rentals and
              room closures before making scheduling changes.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={Boolean(savingId)}
          onClick={() => handleNavigate("/manager/availability")}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-500/30 px-5 py-3 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/10 disabled:opacity-50"
        >
          Open Availability Calendar
          <ArrowUpRight size={17} />
        </button>
      </div>
    </section>
  );
}
