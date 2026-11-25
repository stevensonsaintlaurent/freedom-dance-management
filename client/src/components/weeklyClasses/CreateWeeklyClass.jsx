import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  DollarSign,
  Users,
  UserRound,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Repeat2,
  GraduationCap,
  DoorOpen,
  AlertTriangle,
} from "lucide-react";

import api from "../../api/axios";
import { studioRooms } from "../../data/studioRooms";

const roomName = (room) =>
  studioRooms.find((item) => item.id === room.id)?.displayName || room.name;

const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const initialForm = {
  title: "",
  description: "",
  level: "BEGINNER",
  dayOfWeek: "MONDAY",
  startTime: "18:00",
  durationMinutes: 60,
  capacity: 20,
  price: 15,
  instructorId: "",
  roomId: "",
};

const formatDay = (day) => day.charAt(0) + day.slice(1).toLowerCase();

const formatTime = (time) => {
  if (!time) return "—";

  const [hours, minutes] = time.split(":").map(Number);

  return new Date(2026, 0, 1, hours, minutes).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDuration = (minutes) => {
  const value = Number(minutes);

  if (value < 60) return `${value} minutes`;

  const hours = Math.floor(value / 60);
  const remaining = value % 60;

  if (!remaining) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours}h ${remaining}m`;
};

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
        <Icon size={20} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, hint, children, required = false }) {
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

function PreviewRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Icon size={16} />
        <span>{label}</span>
      </div>

      <span className="text-right text-sm font-semibold text-white">
        {value}
      </span>
    </div>
  );
}

export default function CreateWeeklyClass() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [instructors, setInstructors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomError, setRoomError] = useState("");
  const [roomReload, setRoomReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingRooms(true);
    setRoomError("");
    api
      .get("/rooms", { signal: controller.signal })
      .then(({ data }) => {
        if (!data.success || !Array.isArray(data.rooms))
          throw new Error("Invalid room response");
        if (!controller.signal.aborted)
          setRooms(data.rooms.filter((room) => room.isActive));
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setRoomError(
            error.response?.data?.message || "Failed to load studio rooms.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRooms(false);
      });
    return () => controller.abort();
  }, [roomReload]);

  const selectedRoom = rooms.find((room) => room.id === form.roomId);
  const exceedsCapacity =
    selectedRoom?.capacity != null &&
    Number(form.capacity) > selectedRoom.capacity;
  const [loading, setLoading] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(true);

  useEffect(() => {
    let active = true;

    const loadInstructors = async () => {
      try {
        setLoadingInstructors(true);

        const response = await api.get("/staff/users");
        const users = response.data.users || [];

        const eligibleInstructors = users.filter(
          (user) =>
            user.isActive &&
            ["INSTRUCTOR", "MANAGER", "ADMIN"].includes(user.role),
        );

        if (active) {
          setInstructors(eligibleInstructors);
        }
      } catch (error) {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load instructors",
          );
        }
      } finally {
        if (active) {
          setLoadingInstructors(false);
        }
      }
    };

    loadInstructors();

    return () => {
      active = false;
    };
  }, []);

  const selectedInstructor = useMemo(
    () => instructors.find((instructor) => instructor.id === form.instructorId),
    [instructors, form.instructorId],
  );

  const instructorName = selectedInstructor
    ? `${selectedInstructor.firstName} ${selectedInstructor.lastName}`
    : "Not selected";

  const endTime = useMemo(() => {
    const [hours, minutes] = form.startTime.split(":").map(Number);

    const total = hours * 60 + minutes + Number(form.durationMinutes);

    if (total > 1440) return "Past midnight";

    const endHours = Math.floor(total / 60) % 24;
    const endMinutes = total % 60;

    return formatTime(
      `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
        2,
        "0",
      )}`,
    );
  }, [form.startTime, form.durationMinutes]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setForm({ ...initialForm });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || loadingRooms || loadingInstructors || roomError) return;
    if (!instructors.some((item) => item.id === form.instructorId)) {
      toast.error("Select an eligible instructor.");
      return;
    }
    if (!selectedRoom || exceedsCapacity) {
      toast.error("Select an active room with sufficient configured capacity.");
      return;
    }

    const [hours, minutes] = form.startTime.split(":").map(Number);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      level: form.level,
      dayOfWeek: form.dayOfWeek,
      startTimeMinutes: hours * 60 + minutes,
      durationMinutes: Number(form.durationMinutes),
      capacity: Number(form.capacity),
      priceCents: Math.round(Number(form.price) * 100),
      instructorId: form.instructorId,
      roomId: selectedRoom.id,
    };

    if (
      !form.startTime ||
      !Number.isInteger(payload.startTimeMinutes) ||
      payload.startTimeMinutes < 0 ||
      payload.startTimeMinutes + payload.durationMinutes > 1440
    ) {
      toast.error("Choose a valid time ending by midnight.");
      return;
    }
    try {
      setLoading(true);

      const response = await api.post("/weekly-classes", payload);

      if (!response.data.success || !response.data.weeklyClass)
        throw new Error(
          "Unexpected response. Check the weekly schedule before retrying.",
        );

      toast.success("Weekly class created successfully!");

      for (const warning of response.data.weeklyClass.warnings || []) {
        toast.warn(warning, { autoClose: false });
      }

      navigate("/manager/weekly-classes");
    } catch (error) {
      console.error("CREATE WEEKLY CLASS ERROR:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create weekly class",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-500 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10";

  const optionClass = "bg-zinc-900 text-white";

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/manager/weekly-classes")}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-amber-400"
            >
              <ArrowLeft size={16} />
              Back to Weekly Classes
            </button>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
                Studio Management
              </span>

              <span className="rounded-full border border-white/10 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-400">
                Weekly Schedule
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Create Weekly Class
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
              Configure your recurring dance class, assign an instructor, and
              manage scheduling and pricing.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-zinc-900 px-4 py-3">
            <Repeat2 size={18} className="text-amber-400" />
            <span className="text-sm font-semibold">Repeats every week</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* LEFT COLUMN */}
            <div className="space-y-7">
              {/* CLASS INFORMATION */}
              <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-sm md:p-8">
                <SectionHeading
                  icon={BookOpen}
                  title="Class Information"
                  description="Give your class a clear name and description."
                />

                <div className="space-y-5">
                  <Field label="Class Name" required>
                    <input
                      name="title"
                      type="text"
                      placeholder="e.g. Beginner Bachata Sensual"
                      value={form.title}
                      onChange={handleChange}
                      className={inputClass}
                      minLength={2}
                      maxLength={150}
                      required
                    />
                  </Field>

                  <Field label="Dance Level" required>
                    <div className="relative">
                      <GraduationCap
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                      />

                      <select
                        name="level"
                        value={form.level}
                        onChange={handleChange}
                        className={`${inputClass} pl-11`}
                      >
                        <option className={optionClass} value="BEGINNER">
                          Beginner
                        </option>
                        <option className={optionClass} value="INTERMEDIATE">
                          Intermediate
                        </option>
                        <option className={optionClass} value="ADVANCED">
                          Advanced
                        </option>
                        <option className={optionClass} value="OPEN_LEVEL">
                          Open Level
                        </option>
                      </select>
                    </div>
                  </Field>

                  <Field
                    label="Class Description"
                    hint="Optional — describe what students will learn."
                  >
                    <textarea
                      name="description"
                      placeholder="What will students learn in this class?"
                      value={form.description}
                      onChange={handleChange}
                      maxLength={1000}
                      rows={4}
                      className={`${inputClass} resize-y`}
                    />
                  </Field>
                </div>
              </section>

              {/* SCHEDULE */}
              <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-sm md:p-8">
                <SectionHeading
                  icon={CalendarDays}
                  title="Schedule & Duration"
                  description="Choose when this class takes place each week."
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Day of the Week" required>
                    <select
                      name="dayOfWeek"
                      value={form.dayOfWeek}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {days.map((day) => (
                        <option key={day} value={day} className={optionClass}>
                          {formatDay(day)}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Start Time" required>
                    <input
                      name="startTime"
                      type="time"
                      value={form.startTime}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </Field>

                  <Field label="Class Duration" required>
                    <select
                      name="durationMinutes"
                      value={form.durationMinutes}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      {[30, 45, 60, 90, 120].map((minutes) => (
                        <option
                          key={minutes}
                          value={minutes}
                          className={optionClass}
                        >
                          {formatDuration(minutes)}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="End Time">
                    <div className="flex min-h-12 items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4">
                      <Clock3 size={18} className="text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">
                        {endTime}
                      </span>
                    </div>
                  </Field>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-950/50 p-4">
                  <Repeat2
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-400"
                  />

                  <div>
                    <p className="text-sm font-semibold">
                      Recurring Weekly Class
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      This class repeats every {formatDay(form.dayOfWeek)}.
                      Individual dated sessions and bookings are managed
                      separately.
                    </p>
                  </div>
                </div>
              </section>

              {/* INSTRUCTOR */}
              <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-sm md:p-8">
                <SectionHeading
                  icon={UserRound}
                  title="Instructor Assignment"
                  description="Assign an instructor to your weekly class."
                />

                <Field label="Select Instructor" required>
                  <select
                    name="instructorId"
                    value={form.instructorId}
                    onChange={handleChange}
                    disabled={loadingInstructors}
                    className={`${inputClass} cursor-pointer`}
                    required
                  >
                    <option value="" className={optionClass}>
                      {loadingInstructors
                        ? "Loading instructors..."
                        : "Choose an instructor"}
                    </option>

                    {instructors.map((instructor) => (
                      <option
                        key={instructor.id}
                        value={instructor.id}
                        className={optionClass}
                      >
                        {instructor.firstName} {instructor.lastName} —{" "}
                        {instructor.role}
                      </option>
                    ))}
                  </select>
                </Field>

                {selectedInstructor && (
                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/50 p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                      <UserRound size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-bold">{instructorName}</p>
                      <p className="text-xs text-zinc-500">
                        Assigned Instructor
                      </p>
                    </div>

                    <CheckCircle2
                      size={20}
                      className="ml-auto text-green-400"
                    />
                  </div>
                )}
              </section>

              {/* STUDIO ROOM */}
              <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-sm md:p-8">
                <SectionHeading
                  icon={DoorOpen}
                  title="Studio Room Assignment"
                  description="Reserve a room for this recurring class."
                />
                <Field label="Studio Room" required>
                  <select
                    name="roomId"
                    value={form.roomId}
                    onChange={handleChange}
                    required
                    disabled={loading || loadingRooms || Boolean(roomError)}
                    className={inputClass}
                  >
                    <option value="">
                      {loadingRooms
                        ? "Loading rooms..."
                        : "Choose a studio room"}
                    </option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {roomName(room)}
                      </option>
                    ))}
                  </select>
                </Field>
                {roomError && (
                  <div role="alert" className="mt-3 text-sm text-red-400">
                    {roomError}{" "}
                    <button
                      type="button"
                      onClick={() => setRoomReload((n) => n + 1)}
                      className="underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {!loadingRooms && !roomError && !rooms.length && (
                  <p className="mt-3 text-sm text-amber-400">
                    No active studio rooms available.
                  </p>
                )}
                {selectedRoom && (
                  <p className="mt-3 text-sm text-zinc-400">
                    {selectedRoom.capacity == null
                      ? "Room capacity is not configured in the database. Verify approved occupancy before setting class capacity."
                      : `Configured room capacity: ${selectedRoom.capacity}`}
                  </p>
                )}
                {exceedsCapacity && (
                  <p role="alert" className="mt-3 text-sm text-red-400">
                    Class capacity exceeds the selected room capacity.
                  </p>
                )}
                <div className="mt-4 flex gap-2 text-xs text-amber-400">
                  <AlertTriangle size={16} className="shrink-0" /> The server
                  checks scheduling conflicts when you save. Classes outside
                  regular operating hours require management review.
                </div>
              </section>

              {/* CAPACITY & PRICING */}
              <section className="rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-sm md:p-8">
                <SectionHeading
                  icon={DollarSign}
                  title="Capacity & Pricing"
                  description="Set attendance limits and the regular drop-in price."
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Class Capacity" required>
                    <div className="relative">
                      <Users
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                      />

                      <input
                        name="capacity"
                        type="number"
                        min="1"
                        max="500"
                        value={form.capacity}
                        onChange={handleChange}
                        className={`${inputClass} pl-11`}
                        required
                      />
                    </div>
                  </Field>

                  <Field
                    label="Drop-in Price"
                    hint="Enter 0 for a free class."
                    required
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
                        $
                      </span>

                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={handleChange}
                        className={`${inputClass} pl-9`}
                        required
                      />
                    </div>
                  </Field>
                </div>
              </section>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
                  disabled={loading}
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    loadingInstructors ||
                    loadingRooms ||
                    Boolean(roomError) ||
                    !selectedRoom ||
                    exceedsCapacity ||
                    !instructors.length
                  }
                  className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {loading ? "Creating Class..." : "Save & Create Class"}
                </button>
              </div>
            </div>

            {/* LIVE PREVIEW */}
            <aside className="space-y-5 lg:sticky lg:top-6">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 shadow-sm">
                <div className="bg-amber-500 px-6 py-6 text-zinc-950">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-75">
                    <Sparkles size={15} />
                    Live Preview
                  </div>

                  <h2 className="mt-4 break-words text-xl font-extrabold leading-snug">
                    {form.title.trim() || "Your Class Name"}
                  </h2>

                  <p className="mt-2 text-sm font-semibold opacity-75">
                    {form.level.replace("_", " ")}
                  </p>
                </div>

                <div className="divide-y divide-white/10 px-6 py-3">
                  <PreviewRow
                    icon={CalendarDays}
                    label="Day"
                    value={formatDay(form.dayOfWeek)}
                  />

                  <PreviewRow
                    icon={Clock3}
                    label="Time"
                    value={`${formatTime(form.startTime)} – ${endTime}`}
                  />

                  <PreviewRow
                    icon={Repeat2}
                    label="Duration"
                    value={formatDuration(form.durationMinutes)}
                  />

                  <PreviewRow
                    icon={UserRound}
                    label="Instructor"
                    value={instructorName}
                  />

                  <PreviewRow
                    icon={DoorOpen}
                    label="Studio Room"
                    value={
                      selectedRoom ? roomName(selectedRoom) : "Not selected"
                    }
                  />

                  <PreviewRow
                    icon={Users}
                    label="Capacity"
                    value={`${form.capacity || 0} students`}
                  />
                </div>

                <div className="border-t border-white/10 bg-zinc-950/50 px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Regular Drop-in
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-amber-400">
                    {Number(form.price) === 0
                      ? "FREE"
                      : `$${Number(form.price || 0).toFixed(2)}`}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-400" />
                  <h3 className="text-sm font-bold">Before You Save</h3>
                </div>

                <p className="mt-3 text-xs leading-6 text-zinc-400">
                  Review the class name, instructor, schedule, duration,
                  capacity, room, and price. After saving, you'll be redirected
                  to your weekly schedule.
                </p>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}
