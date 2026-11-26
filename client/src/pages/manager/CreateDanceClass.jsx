import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Users,
  UserRound,
  DoorOpen,
  DollarSign,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Save,
  Loader2,
  RefreshCw,
  MapPin,
} from "lucide-react";

import api from "../../api/axios";

// ======================================================
// CONFIGURATION
// ======================================================

const TIME_ZONE = "America/Los_Angeles";

const INSTRUCTOR_ROLES = ["INSTRUCTOR", "MANAGER", "ADMIN"];

const initialForm = {
  title: "",
  description: "",
  level: "BEGINNER",
  date: "",
  startTime: "",
  endTime: "",
  capacity: 20,
  price: 15,
  instructorId: "",
  roomId: "",
};

const levels = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "OPEN_LEVEL", label: "Open Level" },
];

// ======================================================
// STYLES
// ======================================================

const inputStyle =
  "w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:opacity-50";

const panelStyle =
  "rounded-2xl border border-white/10 bg-zinc-900/70 p-6 md:p-8";

// ======================================================
// LAS VEGAS DATE AND TIME UTILITIES
// ======================================================

const vegasFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const getVegasDateParts = (date) =>
  Object.fromEntries(
    vegasFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

const getTodayInVegas = () => {
  const parts = getVegasDateParts(new Date());

  return `${parts.year}-${parts.month}-${parts.day}`;
};

// Convert Las Vegas local time into an actual UTC instant.
// Handles both Pacific Standard Time and Daylight Time.

const vegasLocalToUtc = (date, time) => {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {
    throw new Error("Please enter a valid date and time.");
  }

  const base = new Date(`${date}T${time}:00.000Z`);

  if (Number.isNaN(base.getTime())) {
    throw new Error("Invalid class date.");
  }

  const candidates = [7, 8]
    .map((offset) => new Date(base.getTime() + offset * 60 * 60 * 1000))
    .filter((candidate) => {
      const parts = getVegasDateParts(candidate);

      const localDate = `${parts.year}-${parts.month}-${parts.day}`;

      const localTime = `${parts.hour}:${parts.minute}`;

      return localDate === date && localTime === time;
    });

  if (candidates.length === 0) {
    throw new Error(
      "This time does not exist in Las Vegas. " +
        "Please choose another date or time.",
    );
  }

  if (candidates.length > 1) {
    throw new Error(
      "This time is ambiguous because of a daylight-saving " +
        "transition. Please choose another time.",
    );
  }

  return candidates[0];
};

const formatTime = (time) => {
  if (!time) return "Not selected";

  const [hours, minutes] = time.split(":").map(Number);

  const period = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
};

const formatDate = (date) => {
  if (!date) return "Not selected";

  const value = new Date(`${date}T12:00:00Z`);

  if (Number.isNaN(value.getTime())) {
    return "Invalid date";
  }

  return value.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) {
    return "Not calculated";
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (!hours) return `${remaining} min`;

  if (!remaining) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours}h ${remaining}m`;
};

const formatPrice = (price) => {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return "—";

  if (amount === 0) return "FREE";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// ======================================================
// REUSABLE COMPONENTS
// ======================================================

function Field({ label, children, hint, required = false }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-zinc-200">
        {label}

        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      {children}

      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
        <Icon size={21} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>

        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

function PreviewRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex shrink-0 items-center gap-2 text-sm text-zinc-400">
        <Icon size={16} />

        {label}
      </div>

      <span className="break-words text-right text-sm font-semibold text-white">
        {value}
      </span>
    </div>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function CreateDanceClass() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ...initialForm,
  });

  const [instructors, setInstructors] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warnings, setWarnings] = useState([]);

  // ====================================================
  // LOAD INSTRUCTORS AND STUDIO ROOMS
  // ====================================================

  useEffect(() => {
    const controller = new AbortController();

    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const [staffResponse, roomResponse] = await Promise.all([
          api.get("/staff/users", {
            signal: controller.signal,
          }),

          api.get("/rooms", {
            signal: controller.signal,
          }),
        ]);

        const users = staffResponse.data.users;
        const studioRooms = roomResponse.data.rooms;

        if (!Array.isArray(users) || !Array.isArray(studioRooms)) {
          throw new Error("Invalid instructor or room information received.");
        }

        const eligibleInstructors = users.filter(
          (user) => user.isActive && INSTRUCTOR_ROLES.includes(user.role),
        );

        const activeRooms = studioRooms.filter((room) => room.isActive);

        if (!active) return;

        setInstructors(eligibleInstructors);
        setRooms(activeRooms);

        setForm((previous) => ({
          ...previous,

          instructorId: eligibleInstructors.some(
            (item) => item.id === previous.instructorId,
          )
            ? previous.instructorId
            : "",

          roomId: activeRooms.some((item) => item.id === previous.roomId)
            ? previous.roomId
            : "",
        }));
      } catch (err) {
        if (!active) return;

        setLoadError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load studio information.",
        );

        setInstructors([]);
        setRooms([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  // ====================================================
  // SELECTED INSTRUCTOR AND ROOM
  // ====================================================

  const selectedInstructor = useMemo(
    () => instructors.find((item) => item.id === form.instructorId),
    [instructors, form.instructorId],
  );

  const selectedRoom = useMemo(
    () => rooms.find((item) => item.id === form.roomId),
    [rooms, form.roomId],
  );

  const instructorName = selectedInstructor
    ? `${selectedInstructor.firstName} ${selectedInstructor.lastName}`
    : "Not selected";

  const levelName =
    levels.find((item) => item.value === form.level)?.label || form.level;

  const maximumCapacity = Math.min(500, selectedRoom?.capacity ?? 500);

  const capacityExceeded = Number(form.capacity) > maximumCapacity;

  // ====================================================
  // CALCULATE CLASS DURATION
  // ====================================================

  const schedule = useMemo(() => {
    if (!form.date || !form.startTime || !form.endTime) {
      return {
        duration: 0,
        error: "",
      };
    }

    try {
      if (form.endTime <= form.startTime) {
        throw new Error("End time must be after start time on the same date.");
      }

      const startsAt = vegasLocalToUtc(form.date, form.startTime);

      const endsAt = vegasLocalToUtc(form.date, form.endTime);

      if (endsAt <= startsAt) {
        throw new Error("End time must be after start time.");
      }

      return {
        startsAt,
        endsAt,

        duration: (endsAt.getTime() - startsAt.getTime()) / 60000,

        error: "",
      };
    } catch (err) {
      return {
        duration: 0,
        error: err.message,
      };
    }
  }, [form.date, form.startTime, form.endTime]);

  // ====================================================
  // FORM HANDLERS
  // ====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
    setWarnings([]);
  };

  const handleReset = () => {
    setForm({ ...initialForm });

    setError("");
    setSuccess("");
    setWarnings([]);
  };

  // ====================================================
  // CREATE DANCE CLASS
  // ====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || loading || loadError) return;

    setError("");
    setSuccess("");
    setWarnings([]);

    if (form.title.trim().length < 2) {
      setError("Please enter a valid class name.");
      return;
    }

    if (!selectedInstructor) {
      setError("Please select an active instructor.");
      return;
    }

    if (!selectedRoom) {
      setError("Please select a studio room.");
      return;
    }

    if (schedule.error || !schedule.startsAt || !schedule.endsAt) {
      setError(schedule.error || "Please enter a valid class schedule.");

      return;
    }

    if (schedule.startsAt <= new Date()) {
      setError("Please choose a future class date.");
      return;
    }

    if (schedule.duration > 1440) {
      setError("Class duration cannot exceed 24 hours.");
      return;
    }

    const capacity = Number(form.capacity);

    if (
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      capacity > maximumCapacity
    ) {
      setError(`Class capacity must be between 1 and ${maximumCapacity}.`);

      return;
    }

    const price = Number(form.price);
    const priceCents = Math.round(price * 100);

    if (
      String(form.price).trim() === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isSafeInteger(priceCents) ||
      priceCents > 2147483647
    ) {
      setError("Please enter a valid class price.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      level: form.level,

      startsAt: schedule.startsAt.toISOString(),
      endsAt: schedule.endsAt.toISOString(),

      capacity,
      priceCents,

      instructorId: selectedInstructor.id,
      roomId: selectedRoom.id,
    };

    try {
      setSaving(true);

      const response = await api.post("/classes", payload, {
        timeout: 35000,
      });

      if (!response.data?.success || !response.data?.danceClass?.id) {
        throw new Error(
          "The server did not confirm class creation. " +
            "Check the class list before trying again.",
        );
      }

      const createdClass = response.data.danceClass;

      setSuccess(
        `"${createdClass.title}" was created successfully ` +
          `in ${selectedRoom.name}!`,
      );

      setWarnings(
        Array.isArray(createdClass.warnings) ? createdClass.warnings : [],
      );

      setForm({ ...initialForm });
    } catch (err) {
      if (
        err.code === "ECONNABORTED" ||
        err.code === "ETIMEDOUT" ||
        !err.response
      ) {
        setError(
          "Class creation could not be confirmed. " +
            "Check your class list before submitting again.",
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to create dance class.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    !loading &&
    !saving &&
    !loadError &&
    instructors.length > 0 &&
    rooms.length > 0 &&
    Boolean(selectedInstructor) &&
    Boolean(selectedRoom) &&
    !capacityExceeded &&
    !schedule.error;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-6 text-white md:px-8">
      {/* PAGE HEADER */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate("/manager/classes")}
            className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-amber-400 disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            Back to Dance Classes
          </button>

          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
              Studio Management
            </span>

            <span className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-400">
              Individual Class
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Create Dance Class
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Schedule individual dance classes, masterclasses, workshops, and
            special training sessions at Freedom Dance Studio.
          </p>
        </div>

        <button
          type="button"
          disabled={loading || saving}
          onClick={() => setReloadKey((previous) => previous + 1)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh Studio Data
        </button>
      </div>

      {/* FEEDBACK MESSAGES */}

      {loadError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
        >
          <AlertCircle size={20} className="shrink-0" />

          <div>
            <p className="font-semibold">Unable to load studio information</p>

            <p className="mt-1 text-sm">{loadError}</p>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
        >
          <AlertCircle size={20} className="shrink-0" />

          <div>
            <p className="font-semibold">Unable to create class</p>

            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-400"
        >
          <CheckCircle2 size={21} className="shrink-0" />

          <div>
            <p className="font-bold">Class created successfully</p>

            <p className="mt-1 text-sm">{success}</p>

            <button
              type="button"
              onClick={() => navigate("/manager/classes")}
              className="mt-3 text-sm font-semibold underline"
            >
              View Dance Classes
            </button>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
        >
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <AlertTriangle size={20} />
            Scheduling Warnings
          </div>

          <ul className="mt-3 space-y-2 text-sm text-amber-200">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_350px]">
          {/* MAIN FORM */}

          <fieldset disabled={saving} className="min-w-0 space-y-7">
            {/* CLASS INFORMATION */}

            <div className={panelStyle}>
              <SectionHeading
                icon={BookOpen}
                title="Class Information"
                description="Define the name, level and content of your class."
              />

              <div className="space-y-5">
                <Field label="Class Name" required>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Bachata Sensual Masterclass"
                    minLength={2}
                    maxLength={150}
                    required
                    className={inputStyle}
                  />
                </Field>

                <Field label="Dance Level" required>
                  <select
                    name="level"
                    value={form.level}
                    onChange={handleChange}
                    className={inputStyle}
                    required
                  >
                    {levels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Description"
                  hint="Optional — explain what students will learn."
                >
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the class, techniques, and requirements..."
                    maxLength={1000}
                    rows={4}
                    className={`${inputStyle} resize-y`}
                  />
                </Field>
              </div>
            </div>

            {/* SCHEDULE */}

            <div className={panelStyle}>
              <SectionHeading
                icon={CalendarDays}
                title="Date & Schedule"
                description="Choose the date and time of this individual class."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Class Date" required>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    min={getTodayInVegas()}
                    onChange={handleChange}
                    required
                    className={`${inputStyle} [color-scheme:dark]`}
                  />
                </Field>

                <Field label="Class Duration">
                  <div className="flex min-h-12 items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4">
                    <Clock3 size={18} className="text-amber-400" />

                    <span className="text-sm font-bold text-amber-400">
                      {formatDuration(schedule.duration)}
                    </span>
                  </div>
                </Field>

                <Field label="Start Time" required>
                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleChange}
                    required
                    className={`${inputStyle} [color-scheme:dark]`}
                  />
                </Field>

                <Field label="End Time" required>
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleChange}
                    required
                    className={`${inputStyle} [color-scheme:dark]`}
                  />
                </Field>
              </div>

              {schedule.error && (
                <p className="mt-4 text-sm text-red-400">{schedule.error}</p>
              )}

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-950/50 p-4">
                <MapPin size={19} className="mt-0.5 shrink-0 text-amber-400" />

                <div>
                  <p className="text-sm font-semibold">Las Vegas Local Time</p>

                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    All class times use Pacific Time, regardless of your
                    device's timezone. Start and end times must be on the same
                    date.
                  </p>
                </div>
              </div>
            </div>

            {/* INSTRUCTOR */}

            <div className={panelStyle}>
              <SectionHeading
                icon={UserRound}
                title="Instructor Assignment"
                description="Select the instructor responsible for teaching this class."
              />

              <Field label="Select Instructor" required>
                <select
                  name="instructorId"
                  value={form.instructorId}
                  onChange={handleChange}
                  disabled={loading || Boolean(loadError)}
                  required
                  className={inputStyle}
                >
                  <option value="">
                    {loading
                      ? "Loading instructors..."
                      : "Choose an instructor"}
                  </option>

                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.firstName} {instructor.lastName} —{" "}
                      {instructor.role}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedInstructor && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                    <UserRound size={22} />
                  </div>

                  <div>
                    <p className="font-semibold">{instructorName}</p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {selectedInstructor.role}
                    </p>
                  </div>

                  <CheckCircle2
                    size={21}
                    className="ml-auto shrink-0 text-green-400"
                  />
                </div>
              )}

              {!loading && !loadError && instructors.length === 0 && (
                <p className="mt-4 text-sm text-amber-400">
                  No active instructors are available. Check Staff Management.
                </p>
              )}
            </div>

            {/* STUDIO ROOM ASSIGNMENT */}

            <div className={panelStyle}>
              <SectionHeading
                icon={DoorOpen}
                title="Studio Room Assignment"
                description="Select the studio room reserved for this class."
              />

              {loading ? (
                <div className="flex items-center gap-3 py-5 text-sm text-zinc-400">
                  <Loader2 size={20} className="animate-spin text-amber-400" />
                  Loading studio rooms...
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {rooms.map((room) => {
                    const isSelected = form.roomId === room.id;

                    return (
                      <label
                        key={room.id}
                        className={`relative flex cursor-pointer flex-col rounded-2xl border p-5 transition ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-white/10 bg-zinc-950/50 hover:border-amber-500/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="roomId"
                          value={room.id}
                          checked={isSelected}
                          onChange={handleChange}
                          required
                          className="sr-only peer"
                        />

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                            <DoorOpen size={24} />
                          </div>

                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                              isSelected
                                ? "border-amber-500 bg-amber-500"
                                : "border-zinc-600"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2
                                size={16}
                                className="text-zinc-950"
                              />
                            )}
                          </div>
                        </div>

                        <h3 className="mt-4 text-lg font-bold">{room.name}</h3>

                        <div className="mt-3 space-y-2 text-xs text-zinc-400">
                          {room.areaSquareFeet != null && (
                            <p>{room.areaSquareFeet} sq. ft.</p>
                          )}

                          <p>
                            {room.capacity != null
                              ? `Capacity: ${room.capacity}`
                              : "Capacity not configured"}
                          </p>

                          <p className="text-green-400">Active studio room</p>
                        </div>

                        <span className="pointer-events-none absolute inset-0 rounded-2xl peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400" />
                      </label>
                    );
                  })}
                </div>
              )}

              {!loading && !loadError && rooms.length === 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
                  No active studio rooms are available. Check Studio Rooms
                  Management.
                </div>
              )}

              {selectedRoom && selectedRoom.capacity == null && (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-5 text-amber-300">
                  <AlertTriangle size={17} className="shrink-0" />
                  This room does not have a configured capacity. Verify the
                  permitted occupancy before setting the class limit.
                </div>
              )}

              <p className="mt-5 text-xs leading-5 text-zinc-500">
                Room availability and scheduling conflicts will be verified by
                the server before the class is saved.
              </p>
            </div>

            {/* CAPACITY AND PRICING */}

            <div className={panelStyle}>
              <SectionHeading
                icon={DollarSign}
                title="Capacity & Pricing"
                description="Set the attendance limit and regular drop-in price."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Maximum Students"
                  required
                  hint={
                    selectedRoom?.capacity != null
                      ? `Configured room capacity: ${selectedRoom.capacity}`
                      : "Enter your class attendance limit."
                  }
                >
                  <input
                    type="number"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleChange}
                    min={1}
                    max={maximumCapacity}
                    step={1}
                    required
                    className={inputStyle}
                  />
                </Field>

                <Field
                  label="Regular Price ($)"
                  hint="Enter 0 for a free class."
                  required
                >
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min={0}
                    step="0.01"
                    required
                    className={inputStyle}
                  />
                </Field>
              </div>

              {capacityExceeded && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle size={18} />
                  Class capacity exceeds the configured limit of{" "}
                  {maximumCapacity}.
                </div>
              )}

              <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={19} className="text-amber-400" />

                  <p className="font-semibold text-amber-400">
                    First Class FREE
                  </p>
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  New students receive their first eligible group class free.
                  Enter the regular price here. Eligibility and discounts are
                  handled separately during booking.
                </p>
              </div>
            </div>

            {/* FORM ACTIONS */}

            <div className="flex flex-col-reverse gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Clear Form
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-8 py-3 font-bold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={19} className="animate-spin" />
                ) : (
                  <Save size={19} />
                )}

                {saving ? "Creating Class..." : "Create Dance Class"}
              </button>
            </div>
          </fieldset>

          {/* LIVE PREVIEW */}

          <aside className="space-y-5 xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70">
              <div className="bg-amber-500 p-6 text-zinc-950">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-75">
                  <Sparkles size={16} />
                  Live Class Preview
                </div>

                <h2 className="mt-4 break-words text-2xl font-extrabold leading-snug">
                  {form.title.trim() || "Your Dance Class"}
                </h2>

                <p className="mt-2 text-sm font-semibold opacity-75">
                  Freedom Dance Studio
                </p>
              </div>

              <div className="divide-y divide-white/10 px-5 py-2">
                <PreviewRow
                  icon={GraduationCap}
                  label="Level"
                  value={levelName}
                />

                <PreviewRow
                  icon={CalendarDays}
                  label="Date"
                  value={formatDate(form.date)}
                />

                <PreviewRow
                  icon={Clock3}
                  label="Time"
                  value={
                    form.startTime && form.endTime
                      ? `${formatTime(form.startTime)} – ${formatTime(form.endTime)}`
                      : "Not selected"
                  }
                />

                <PreviewRow
                  icon={Clock3}
                  label="Duration"
                  value={formatDuration(schedule.duration)}
                />

                <PreviewRow
                  icon={UserRound}
                  label="Instructor"
                  value={instructorName}
                />

                <PreviewRow
                  icon={DoorOpen}
                  label="Studio Room"
                  value={selectedRoom?.name || "Not selected"}
                />

                <PreviewRow
                  icon={Users}
                  label="Capacity"
                  value={`${form.capacity || 0} students`}
                />
              </div>

              {form.description.trim() && (
                <div className="border-t border-white/10 px-5 py-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    About This Class
                  </p>

                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">
                    {form.description}
                  </p>
                </div>
              )}

              <div className="border-t border-white/10 bg-zinc-950/50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Regular Drop-in Price
                </p>

                <p className="mt-2 text-4xl font-extrabold text-amber-400">
                  {formatPrice(form.price)}
                </p>

                <p className="mt-2 text-xs text-zinc-500">Per student</p>
              </div>
            </div>

            {/* SCHEDULING INFORMATION */}

            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={19} className="text-green-400" />

                <h3 className="font-bold">Scheduling Protection</h3>
              </div>

              <p className="mt-3 text-xs leading-6 text-zinc-400">
                Before saving, the server checks the selected instructor and
                room against existing weekly classes, individual classes,
                rentals and room closures.
              </p>

              <button
                type="button"
                disabled={saving}
                onClick={() => navigate("/manager/availability")}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-400 transition hover:text-amber-300 disabled:opacity-50"
              >
                <CalendarDays size={16} />
                View Studio Availability
              </button>
            </div>
          </aside>
        </div>
      </form>
    </section>
  );
}
