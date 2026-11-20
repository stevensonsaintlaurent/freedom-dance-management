import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  Users,
  Search,
  Check,
  X,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Music2,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_WEEKLY_CLASSES_URL ||
  "http://localhost:5000/api/weekly-classes";
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const inputClass =
  "w-full rounded-xl border border-white/15 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-amber-400";
const buttonClass =
  "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors";

function minutes(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value.getHours() * 60 + value.getMinutes();
  const s = String(value).trim();
  const match = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  if (match[3]) h = (h % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return h * 60 + m;
}
function clock(value) {
  if (value == null) return "TBA";
  const n = ((value % 1440) + 1440) % 1440;
  const h = Math.floor(n / 60);
  return `${h % 12 || 12}:${String(n % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function durationText(n) {
  if (!n) return "Duration TBA";
  const h = Math.floor(n / 60),
    m = n % 60;
  return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}
function instructorName(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object")
    return (
      [value.firstName, value.lastName].filter(Boolean).join(" ") ||
      value.name ||
      "Instructor TBA"
    );
  return "Instructor TBA";
}
function styleOf(name) {
  const s = String(name || "").toLowerCase();
  if (s.includes("bachata")) return "Bachata";
  if (s.includes("salsa")) return "Salsa";
  if (s.includes("kizomba") || s.includes("urban kiz")) return "Kizomba";
  if (s.includes("konpa") || s.includes("kompa")) return "Konpa";
  if (s.includes("jazz") || s.includes("band")) return "Music";
  return "Other";
}
function normalize(raw) {
  const detail = raw.danceClass || raw.class || {};
  const dayValue = raw.dayOfWeek ?? raw.day ?? raw.weekday ?? "";
  const day =
    typeof dayValue === "number"
      ? dayValue === 0
        ? "Sunday"
        : DAYS[dayValue - 1] || ""
      : String(dayValue).trim();
  const startRaw = raw.startTime ?? raw.time ?? raw.start;
  const endRaw = raw.endTime ?? raw.end;
  const start = minutes(startRaw);
  const end = minutes(endRaw);
  let duration = Number(
    raw.durationMinutes ?? raw.durationInMinutes ?? detail.durationMinutes,
  );
  if (!Number.isFinite(duration) || duration <= 0)
    duration = start != null && end != null ? (end - start + 1440) % 1440 : 0;
  const title =
    raw.title ||
    raw.name ||
    raw.className ||
    raw.dance ||
    detail.title ||
    detail.name ||
    "Dance Class";
  const instructor =
    raw.instructor || raw.teacher || detail.instructor || raw.instructorName;
  const price = raw.price ?? raw.dropInPrice ?? detail.price;
  return {
    id: String(raw.id),
    day,
    title,
    start,
    end: end ?? (start != null && duration ? start + duration : null),
    duration,
    instructor: instructorName(instructor),
    image:
      raw.image ||
      raw.instructorImage ||
      (typeof instructor === "object"
        ? instructor?.image || instructor?.avatarUrl
        : null),
    level: raw.level || detail.level || "Open Level",
    style: raw.style || raw.danceStyle || detail.style || styleOf(title),
    type: String(
      raw.type || (raw.isIndependent ? "independent" : "freedom"),
    ).toLowerCase(),
    price: price == null || price === "" ? null : price,
    description: raw.description || detail.description || "",
  };
}
function unpack(payload) {
  if (Array.isArray(payload)) return payload;
  for (const candidate of [
    payload?.weeklyClasses,
    payload?.classes,
    payload?.data?.weeklyClasses,
    payload?.data?.classes,
    payload?.data,
  ]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}
function priceLabel(value) {
  if (value == null) return "Ask studio";
  if (String(value).toLowerCase() === "free" || Number(value) === 0)
    return "FREE";
  return String(value).startsWith("$") ? String(value) : `$${value}`;
}
export default function Schedule() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [day, setDay] = useState("All");
  const [type, setType] = useState("all");
  const [style, setStyle] = useState("All");
  const [teacher, setTeacher] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(API_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`Schedule request failed (${res.status})`);
        const result = unpack(await res.json()).map(normalize);
        if (!controller.signal.aborted) {
          setClasses(result);
          setSelected((old) =>
            old.filter((item) => result.some((c) => c.id === item.id)),
          );
        }
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err.message || "Unable to load the schedule");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [retry]);

  const styles = useMemo(
    () => [...new Set(classes.map((c) => c.style))].sort(),
    [classes],
  );
  const teachers = useMemo(
    () => [...new Set(classes.map((c) => c.instructor))].sort(),
    [classes],
  );
  const filtered = useMemo(
    () =>
      classes
        .filter(
          (c) =>
            (day === "All" || c.day.toLowerCase() === day.toLowerCase()) &&
            (type === "all" || c.type === type) &&
            (style === "All" || c.style === style) &&
            (teacher === "All" || c.instructor === teacher) &&
            [c.title, c.style, c.instructor, c.level, c.day]
              .join(" ")
              .toLowerCase()
              .includes(search.trim().toLowerCase()),
        )
        .sort(
          (a, b) =>
            DAYS.findIndex((d) => d.toLowerCase() === a.day.toLowerCase()) -
              DAYS.findIndex((d) => d.toLowerCase() === b.day.toLowerCase()) ||
            (a.start ?? 9999) - (b.start ?? 9999),
        ),
    [classes, day, type, style, teacher, search],
  );
  const grouped = DAYS.map((d) => ({
    day: d,
    items: filtered.filter((c) => c.day.toLowerCase() === d.toLowerCase()),
  })).filter((g) => g.items.length);
  const selectedIds = new Set(selected.map((c) => c.id));
  const toggle = (item) =>
    setSelected((old) =>
      old.some((c) => c.id === item.id)
        ? old.filter((c) => c.id !== item.id)
        : [...old, item],
    );
  const reset = () => {
    setDay("All");
    setType("all");
    setStyle("All");
    setTeacher("All");
    setSearch("");
  };
  const toggleDay = () => {
    const visible = filtered.filter(
      (c) => c.day.toLowerCase() === day.toLowerCase(),
    );
    const ids = new Set(visible.map((c) => c.id));
    setSelected((old) =>
      visible.every((c) => selectedIds.has(c.id))
        ? old.filter((c) => !ids.has(c.id))
        : [...old, ...visible.filter((c) => !selectedIds.has(c.id))],
    );
  };
  const continueBooking = () => {
    if (!selected.length) return;
    const chosen = selected.map((c) => ({
      id: c.id,
      weeklyClassId: c.id,
      day: c.day,
      dance: c.title,
      title: c.title,
      instructor: c.instructor,
      time: clock(c.start),
      endTime: clock(c.end),
      durationMinutes: c.duration,
      level: c.level,
      price: c.price,
      type: c.type,
    }));
    navigate("/checkout", {
      state: {
        bookingType: "multiple-classes",
        selectedClasses: chosen,
        classes: chosen,
        classCount: chosen.length,
        classSummary: chosen
          .map((c) => `${c.day} ${c.time} – ${c.endTime}: ${c.dance}`)
          .join("; "),
      },
    });
  };

  return (
    <main className="min-h-screen bg-zinc-950 pb-24 text-white">
      <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-amber-950/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Music2 size={15} /> Freedom Dance Studio
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            Find your rhythm.
            <br />
            <span className="text-amber-400">Book your next class.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-zinc-400">
            Explore live weekly classes, see exact start and end times, and
            select multiple classes together.
          </p>
          <a
            href="#weekly-classes"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-zinc-950 hover:bg-amber-300"
          >
            Explore schedule <ArrowRight size={18} />
          </a>
        </div>
      </header>
      <section
        id="weekly-classes"
        className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-12 sm:px-6 lg:px-8"
      >
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">
            Your weekly routine
          </p>
          <h2 className="mt-2 text-3xl font-black">Weekly class schedule</h2>
          <p className="mt-2 text-zinc-400">
            Choose a class, or select several and continue together.
          </p>
        </div>
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {[
            { id: "all", label: "All classes", icon: CalendarDays },
            { id: "freedom", label: "Freedom classes", icon: Music2 },
            {
              id: "independent",
              label: "Independent instructors",
              icon: Users,
            },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setType(option.id)}
              className={`${buttonClass} flex min-h-16 items-center gap-3 text-left ${type === option.id ? "border-amber-400 bg-amber-400 text-zinc-950" : "border-white/15 bg-zinc-900 text-zinc-200 hover:border-amber-400/60"}`}
            >
              <option.icon size={20} />
              {option.label}
            </button>
          ))}
        </div>
        <div className="mb-8 rounded-2xl border border-white/10 bg-zinc-900/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Find your class</h3>
              <p className="text-sm text-zinc-400">
                {filtered.length} matching classes
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                className={`${buttonClass} border-white/15 text-zinc-300`}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`${buttonClass} flex items-center gap-2 border-white/15 lg:hidden`}
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
            </div>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {["All", ...DAYS].map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDay(d)}
                className={`${buttonClass} shrink-0 rounded-full ${day === d ? "border-amber-400 bg-amber-400 text-zinc-950" : "border-white/15 text-zinc-300 hover:border-amber-400/60"}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div
            className={`mt-5 grid gap-3 lg:grid-cols-3 ${showFilters ? "grid" : "hidden lg:grid"}`}
          >
            <label className="block text-xs font-bold uppercase tracking-wide text-zinc-400">
              Dance style
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className={`mt-2 ${inputClass}`}
              >
                <option value="All">All styles</option>
                {styles.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase tracking-wide text-zinc-400">
              Instructor
              <select
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className={`mt-2 ${inputClass}`}
              >
                <option value="All">All instructors</option>
                {teachers.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase tracking-wide text-zinc-400">
              Search
              <div className="relative mt-2">
                <Search
                  className="absolute left-3 top-3.5 text-zinc-500"
                  size={17}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Class or instructor..."
                  className={`${inputClass} pl-10`}
                />
              </div>
            </label>
          </div>
        </div>
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
              className="mt-3 inline-flex items-center gap-2 font-bold text-amber-400"
            >
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        )}
        {loading ? (
          <div className="py-24 text-center text-zinc-400">
            <RefreshCw className="mx-auto mb-3 animate-spin text-amber-400" />
            Loading classes...
          </div>
        ) : !error && !filtered.length ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
            <p className="font-bold">No classes match your filters.</p>
            <button onClick={reset} className="mt-4 font-bold text-amber-400">
              Clear filters
            </button>
          </div>
        ) : null}
        {!loading && !error && day !== "All" && filtered.length > 0 && (
          <div className="mb-5 flex justify-end">
            <button
              type="button"
              onClick={toggleDay}
              className={`${buttonClass} border-amber-400/40 text-amber-400`}
            >
              {filtered.every((c) => selectedIds.has(c.id))
                ? "Remove visible classes"
                : `Select all visible ${day} classes`}
            </button>
          </div>
        )}
        {!loading && !error && (
          <div className="space-y-9">
            {grouped.map((group) => (
              <section key={group.day}>
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-2xl font-black">{group.day}</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                    {group.items.length} classes
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item) => {
                    const chosen = selectedIds.has(item.id);
                    return (
                      <article
                        key={item.id}
                        className={`flex flex-col rounded-2xl border bg-zinc-900/80 p-6 transition-all hover:-translate-y-0.5 ${chosen ? "border-amber-400 ring-2 ring-amber-400/20" : "border-white/10 hover:border-amber-400/40"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-400">
                            {item.type === "independent"
                              ? "Independent instructor"
                              : "Freedom class"}
                          </span>
                          <span className="font-black text-amber-400">
                            {priceLabel(item.price)}
                          </span>
                        </div>
                        <h4 className="mt-5 text-xl font-black">
                          {item.title}
                        </h4>
                        <span className="mt-2 self-start rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                          {item.level}
                        </span>
                        <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                            <Clock3 size={15} /> Class time
                          </p>
                          <p className="mt-2 text-lg font-black">
                            {clock(item.start)} – {clock(item.end)}
                          </p>
                          <span className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-extrabold text-zinc-950">
                            <Clock3 size={15} />
                            {durationText(item.duration)}
                          </span>
                        </div>
                        <div className="mt-5 flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.instructor}
                              className="size-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex size-11 items-center justify-center rounded-full bg-amber-400/15 font-bold text-amber-400">
                              {item.instructor.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-zinc-500">Instructor</p>
                            <p className="font-semibold">{item.instructor}</p>
                          </div>
                        </div>
                        {item.description && (
                          <p className="mt-4 text-sm text-zinc-400">
                            {item.description}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => toggle(item)}
                          aria-pressed={chosen}
                          className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition-colors ${chosen ? "mt-6 border border-amber-400 text-amber-400" : "mt-6 bg-amber-400 text-zinc-950 hover:bg-amber-300"}`}
                        >
                          {chosen ? (
                            <>
                              <Check size={17} /> Selected — remove
                            </>
                          ) : (
                            <>
                              Select class <ArrowRight size={17} />
                            </>
                          )}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
        <div className="sticky bottom-3 z-20 mt-10 rounded-2xl border border-amber-400/30 bg-zinc-900/95 p-5 shadow-2xl backdrop-blur-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-black">
                Your selected classes{" "}
                <span className="text-amber-400">({selected.length})</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Choose one or more classes, then continue to checkout.
              </p>
              {selected.length > 0 && (
                <div className="mt-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto">
                  {selected.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggle(c)}
                      className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                    >
                      {c.day} · {c.title} · {durationText(c.duration)}{" "}
                      <X size={13} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className={`${buttonClass} border-white/20`}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={continueBooking}
                disabled={!selected.length}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 lg:flex-none"
              >
                Continue with {selected.length}{" "}
                {selected.length === 1 ? "class" : "classes"}
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-14 rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center">
          <h2 className="text-2xl font-black">More ways to dance</h2>
          <p className="mt-3 text-zinc-400">
            Explore our independent instructors, upcoming events, and studio
            rental options.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              ["Independent instructors", "/independent"],
              ["Upcoming events", "/events"],
              ["Rent the studio", "/rental"],
            ].map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="rounded-xl border border-amber-400/30 px-5 py-3 text-sm font-semibold text-amber-400 hover:bg-amber-400/10"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
