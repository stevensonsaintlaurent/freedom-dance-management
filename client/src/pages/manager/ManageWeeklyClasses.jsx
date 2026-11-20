import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, Plus, Users, RefreshCw } from "lucide-react";

import api from "../../api/axios";

export default function ManageWeeklyClasses() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/weekly-classes");

      setClasses(response.data.classes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load weekly classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const days = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  const sortedClasses = [...classes].sort(
    (a, b) =>
      days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek) ||
      a.startTimeMinutes - b.startTimeMinutes,
  );

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return new Date(2026, 0, 1, hours, mins).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <section className="space-y-8 text-white">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            Freedom Dance Studio
          </p>

          <h1 className="text-3xl font-extrabold">Manage Weekly Classes</h1>

          <p className="mt-2 text-sm text-zinc-400">
            Manage your recurring dance classes and instructors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/manager/weekly-classes/new")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-bold text-zinc-950 transition hover:bg-amber-400"
        >
          <Plus size={18} />
          Create New Class
        </button>
      </div>

      {/* STATISTICS */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <CalendarDays className="text-amber-400" />

          <p className="mt-3 text-sm text-zinc-400">Active Weekly Classes</p>

          <h2 className="mt-2 text-3xl font-bold">{classes.length}</h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <Clock3 className="text-amber-400" />

          <p className="mt-3 text-sm text-zinc-400">Weekly Teaching Hours</p>

          <h2 className="mt-2 text-3xl font-bold">
            {(
              classes.reduce((sum, item) => sum + item.durationMinutes, 0) / 60
            ).toFixed(1)}
          </h2>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* CLASS LIST */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Weekly Class Schedule</h2>

          <button
            type="button"
            onClick={loadClasses}
            disabled={loading}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
            aria-label="Refresh classes"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-zinc-400">Loading classes...</p>
        ) : sortedClasses.length === 0 ? (
          <p className="py-10 text-center text-zinc-400">
            No weekly classes found.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedClasses.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-zinc-950 p-5 transition hover:border-amber-500/40"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {item.dayOfWeek}
                </p>

                <h3 className="mt-2 text-lg font-bold">{item.title}</h3>

                <p className="mt-1 text-xs text-zinc-400">
                  {item.level.replace("_", " ")}
                </p>

                <div className="mt-5 space-y-3 text-sm text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} />
                    {formatTime(item.startTimeMinutes)}
                    {" – "}
                    {formatTime(item.startTimeMinutes + item.durationMinutes)} (
                    {item.durationMinutes} min)
                  </div>

                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    Capacity: {item.capacity}
                  </div>

                  <p>
                    Instructor: {item.instructor?.firstName}{" "}
                    {item.instructor?.lastName}
                  </p>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <span className="text-xl font-bold text-amber-400">
                    {item.priceCents === 0
                      ? "FREE"
                      : `$${(item.priceCents / 100).toFixed(2)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
