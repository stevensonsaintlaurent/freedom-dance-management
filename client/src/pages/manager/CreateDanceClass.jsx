import { useEffect, useState } from "react";
import api from "../../api/axios";

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
};

export default function CreateDanceClass() {
  const [form, setForm] = useState(initialForm);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await api.get("/staff/users");

        const approvedInstructors = response.data.users.filter(
          (user) => user.role === "INSTRUCTOR" && user.isActive,
        );

        setInstructors(approvedInstructors);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load instructors.");
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.instructorId) {
      setError("Please select an instructor.");
      return;
    }

    const startsAt = new Date(`${form.date}T${form.startTime}`);

    const endsAt = new Date(`${form.date}T${form.endTime}`);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError("Please enter a valid date and time.");
      return;
    }

    if (endsAt <= startsAt) {
      setError("End time must be after start time.");
      return;
    }

    if (startsAt <= new Date()) {
      setError("Please choose a future class date.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/classes", {
        title: form.title.trim(),
        description: form.description.trim(),
        level: form.level,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        capacity: Number(form.capacity),
        priceCents: Math.round(Number(form.price) * 100),
        instructorId: form.instructorId,
      });

      setSuccess("Dance class created successfully!");

      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create dance class.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl space-y-8 text-white">
      <div>
        <h1 className="text-3xl font-bold">Create Dance Class</h1>

        <p className="mt-2 text-zinc-400">
          Create classes, assign instructors, and manage the Freedom Dance
          Studio schedule.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-400"
        >
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8"
      >
        <h2 className="text-xl font-semibold">Class Information</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Class Name">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Beginner Salsa"
              required
              minLength={2}
              maxLength={150}
              className={inputStyle}
            />
          </Field>

          <Field label="Dance Level">
            <select
              name="level"
              value={form.level}
              onChange={handleChange}
              className={inputStyle}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="OPEN_LEVEL">Open Level</option>
            </select>
          </Field>

          <Field label="Instructor">
            <select
              name="instructorId"
              value={form.instructorId}
              onChange={handleChange}
              required
              disabled={loading}
              className={inputStyle}
            >
              <option value="">
                {loading ? "Loading instructors..." : "Select instructor"}
              </option>

              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.firstName} {instructor.lastName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Class Date">
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className={inputStyle}
            />
          </Field>

          <Field label="Start Time">
            <input
              type="time"
              name="startTime"
              value={form.startTime}
              onChange={handleChange}
              required
              className={inputStyle}
            />
          </Field>

          <Field label="End Time">
            <input
              type="time"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              required
              className={inputStyle}
            />
          </Field>

          <Field label="Maximum Students">
            <input
              type="number"
              name="capacity"
              value={form.capacity}
              onChange={handleChange}
              min="1"
              max="500"
              required
              className={inputStyle}
            />
          </Field>

          <Field label="Regular Price ($)">
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className={inputStyle}
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe what students will learn..."
            maxLength={1000}
            rows={4}
            className={inputStyle}
          />
        </Field>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="font-semibold text-amber-400">First Class FREE</p>

          <p className="mt-1 text-sm text-zinc-400">
            New students receive their first eligible group class free. The
            discount will be applied during booking, not when creating the
            class.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || loading || !instructors.length}
          className="w-full rounded-xl bg-amber-500 px-6 py-3 font-bold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Creating Class..." : "Create Dance Class"}
        </button>

        {!loading && instructors.length === 0 && (
          <p className="text-center text-sm text-amber-400">
            No active approved instructors are available. Approve an instructor
            in Staff Management first.
          </p>
        )}
      </form>
    </section>
  );
}

const inputStyle =
  "w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-amber-400/50";

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-zinc-300">{label}</span>

      {children}
    </label>
  );
}
