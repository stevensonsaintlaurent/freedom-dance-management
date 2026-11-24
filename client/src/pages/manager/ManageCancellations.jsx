import { useEffect, useState } from "react";
import {
  CalendarX,
  CalendarDays,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import api from "@/api/axios";

const days = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const initialForm = () => ({
  type: "STUDIO",
  classDate: today(),
  weeklyClassId: "",
  reason: "",
  publicMessage: "",
});
const field =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white focus:outline-none focus:border-yellow-500";
const dateLabel = (value) =>
  new Date(value.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const errorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong.";
const timeLabel = (minutes) =>
  `${Math.floor(minutes / 60) % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${minutes >= 720 ? "PM" : "AM"}`;

export default function ManageCancellations() {
  const [form, setForm] = useState(initialForm);
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [history, schedule] = await Promise.all([
        api.get("/cancellations"),
        api.get("/weekly-classes"),
      ]);
      const list =
        schedule.data.weeklyClasses ?? schedule.data.classes ?? schedule.data;
      if (!Array.isArray(list))
        throw new Error("Unexpected weekly classes response.");
      setClasses(list);
      setRecords(history.data.cancellations ?? []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const change = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(["type", "classDate"].includes(key) ? { weeklyClassId: "" } : {}),
    }));
  const day = days[new Date(form.classDate + "T00:00:00Z").getUTCDay()];
  const available = classes.filter(
    (c) => c.isActive !== false && c.dayOfWeek === day,
  );
  const submit = async (event) => {
    event.preventDefault();
    if (
      busy ||
      !window.confirm(
        "Cancel the selected session(s)? Existing reservations will require review.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data } = await api.post("/cancellations", form);
      setNotice(
        `${data.message} ${data.affectedBookings ?? 0} existing reservation(s) affected. Review these reservations in booking management.`,
      );
      setForm(initialForm());
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const restore = async (record) => {
    if (
      busy ||
      !window.confirm(
        "Restore this cancellation? Other active cancellations may still block the session.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data } = await api.patch(`/cancellations/${record.id}/restore`, {
        type: record.type,
      });
      setNotice(data.message);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const visible = records.filter(
    (r) => filter === "all" || r.isActive === (filter === "active"),
  );
  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-yellow-500">
              FREEDOM DANCE STUDIO
            </p>
            <h1 className="mt-2 text-3xl font-bold">Class cancellations</h1>
            <p className="mt-2 text-zinc-400">
              Manage temporary changes without deleting your weekly schedule.
            </p>
          </div>
          <button
            disabled={busy || loading}
            onClick={load}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 disabled:opacity-50"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </header>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Total records", records.length],
            ["Active", records.filter((r) => r.isActive).length],
            ["Restored", records.filter((r) => !r.isActive).length],
            ["Studio-wide", records.filter((r) => r.type === "STUDIO").length],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <p className="text-sm text-zinc-400">{label}</p>
              <p className="mt-2 text-3xl font-bold text-yellow-500">{value}</p>
            </div>
          ))}
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-800 bg-red-950 p-4 text-red-200"
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="rounded-xl border border-green-800 bg-green-950 p-4 text-green-200"
          >
            {notice}
          </div>
        )}
        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <CalendarX className="text-yellow-500" /> New cancellation
          </h2>
          <fieldset
            disabled={busy || loading}
            className="space-y-4 disabled:opacity-60"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 block">
                <span>Cancellation type</span>
                <select
                  className={field}
                  value={form.type}
                  onChange={(e) => change("type", e.target.value)}
                >
                  <option value="STUDIO">All recurring classes</option>
                  <option value="CLASS">Individual class</option>
                </select>
              </label>
              <label className="space-y-2 block">
                <span>Date</span>
                <input
                  required
                  type="date"
                  min={today()}
                  className={field}
                  value={form.classDate}
                  onChange={(e) => change("classDate", e.target.value)}
                />
              </label>
            </div>
            {form.type === "CLASS" && (
              <label className="space-y-2 block">
                <span>Class</span>
                <select
                  required
                  className={field}
                  value={form.weeklyClassId}
                  onChange={(e) => change("weeklyClassId", e.target.value)}
                >
                  <option value="">
                    {available.length
                      ? "Select a class"
                      : "No classes scheduled on this day"}
                  </option>
                  {available.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} — {timeLabel(c.startTimeMinutes)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="space-y-2 block">
              <span>Internal reason</span>
              <textarea
                required
                maxLength={500}
                rows={2}
                className={field}
                value={form.reason}
                onChange={(e) => change("reason", e.target.value)}
                placeholder="Holiday, instructor unavailable, maintenance…"
              />
            </label>
            <label className="space-y-2 block">
              <span>Public message (optional)</span>
              <textarea
                maxLength={1000}
                rows={2}
                className={field}
                value={form.publicMessage}
                onChange={(e) => change("publicMessage", e.target.value)}
                placeholder="A message for your students"
              />
            </label>
            <div className="flex gap-3 rounded-xl border border-yellow-800 bg-yellow-950/30 p-4 text-sm text-yellow-200">
              <AlertTriangle size={20} className="shrink-0" />
              <span>
                New reservations will be blocked by the backend. Existing
                reservations are not automatically canceled or refunded.
              </span>
            </div>
            <button
              disabled={
                !form.reason.trim() ||
                !form.classDate ||
                (form.type === "CLASS" && !form.weeklyClassId)
              }
              className="rounded-xl bg-yellow-500 px-6 py-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Create cancellation"}
            </button>
          </fieldset>
        </form>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <CalendarDays className="text-yellow-500" /> Cancellation records
            </h2>
            <select
              aria-label="Filter records"
              className={field + " max-w-48"}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All records</option>
              <option value="active">Active</option>
              <option value="restored">Restored</option>
            </select>
          </div>
          {loading ? (
            <p className="p-6 text-zinc-400">Loading cancellations…</p>
          ) : visible.length === 0 ? (
            <p className="p-6 text-center text-zinc-400">
              No cancellations found.
            </p>
          ) : (
            <div className="space-y-3">
              {visible.map((r) => (
                <article
                  key={`${r.type}-${r.id}`}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">
                          {r.type === "STUDIO"
                            ? "All recurring classes"
                            : r.weeklyClass?.title || "Individual class"}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${r.isActive ? "bg-red-950 text-red-300" : "bg-green-950 text-green-300"}`}
                        >
                          {r.isActive ? "Canceled" : "Restored"}
                        </span>
                      </div>
                      <p className="text-sm text-yellow-500">
                        {dateLabel(r.classDate)}
                        {r.weeklyClass &&
                          ` · ${timeLabel(r.weeklyClass.startTimeMinutes)}`}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-zinc-300">
                        {r.reason}
                      </p>
                      {r.publicMessage && (
                        <p className="text-sm text-zinc-400">
                          Public message: {r.publicMessage}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500">
                        Canceled by {r.cancelledBy?.firstName}{" "}
                        {r.cancelledBy?.lastName}
                        {r.restoredBy &&
                          ` · Restored by ${r.restoredBy.firstName} ${r.restoredBy.lastName}`}
                      </p>
                    </div>
                    {r.isActive && (
                      <button
                        disabled={busy}
                        onClick={() => restore(r)}
                        className="flex h-fit items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-yellow-500 disabled:opacity-50"
                      >
                        <RotateCcw size={16} /> Restore
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
