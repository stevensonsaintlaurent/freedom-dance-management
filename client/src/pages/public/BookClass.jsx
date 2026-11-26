import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarCheck,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  UserRound,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const WEEKDAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const vegasDate = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
};

const nextClassDate = (dayOfWeek) => {
  const today = vegasDate();
  const currentDate = new Date(`${today}T12:00:00Z`);

  const targetDay = WEEKDAYS.indexOf(String(dayOfWeek || "").toUpperCase());

  if (targetDay === -1) return today;

  const difference = (targetDay - currentDate.getUTCDay() + 7) % 7;

  currentDate.setUTCDate(currentDate.getUTCDate() + difference);

  return currentDate.toISOString().slice(0, 10);
};

const formatPrice = (cents) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((Number(cents) || 0) / 100);

const formatTime = (minutes) => {
  const value = Number(minutes);

  if (!Number.isFinite(value)) return "Time TBD";

  const hours = Math.floor(value / 60);
  const mins = value % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(mins).padStart(2, "0")} ${suffix}`;
};

export default function BookClass() {
  const location = useLocation();
  const navigate = useNavigate();

  const incoming = useMemo(() => {
    const state = location.state || {};

    const classes =
      state.selectedClasses ||
      state.classes ||
      (state.weeklyClass ? [state.weeklyClass] : []);

    return Array.isArray(classes) ? classes : [];
  }, [location.state]);

  const [selectedClasses] = useState(incoming);

  const [dates, setDates] = useState(() =>
    Object.fromEntries(
      incoming.map((item) => [
        item.id,
        nextClassDate(item.dayOfWeek || item.day),
      ]),
    ),
  );

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    marketingConsent: false,
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalCents = selectedClasses.reduce(
    (sum, item) => sum + Number(item.priceCents || 0),
    0,
  );

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    setError("");

    if (selectedClasses.length === 0) {
      setError("Please select a class from the schedule.");
      return;
    }

    for (const item of selectedClasses) {
      const date = dates[item.id];

      if (!date) {
        setError("Please select a date for every class.");
        return;
      }

      const weekday = WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];

      const classDay = String(item.dayOfWeek || item.day || "").toUpperCase();

      if (weekday !== classDay) {
        setError(
          `${item.title || item.dance} takes place on ${classDay}. Please choose the correct day.`,
        );
        return;
      }

      if (date < vegasDate()) {
        setError("Please choose a current or future date.");
        return;
      }
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/weekly-bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          selectedClasses: selectedClasses.map((item) => ({
            weeklyClassId: item.id,
            classDate: dates[item.id],
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit booking.");
      }

      navigate("/booking-success", {
        replace: true,
        state: {
          bookingReference: data.bookingReference,
          bookings: data.bookings,
          classCount: data.classCount,
          totalCents: data.totalCents,
          status: data.status,
        },
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (selectedClasses.length === 0) {
    return (
      <main className="min-h-screen bg-base-100 px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">No classes selected</h1>

        <p className="mt-4 text-base-content/60">
          Please choose a class from our schedule.
        </p>

        <Link to="/schedule" className="btn btn-warning mt-8">
          Browse Classes
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-100 px-4 py-12 md:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/schedule"
          className="mb-8 inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-warning"
        >
          <ArrowLeft size={17} />
          Back to Schedule
        </Link>

        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-warning">
            Freedom Dance Studio
          </p>

          <h1 className="text-4xl font-black md:text-5xl">Book Your Classes</h1>

          <p className="mt-4 text-base-content/60">
            Reserve your place today. No account required.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={submitBooking} className="space-y-6">
            <section className="rounded-2xl border border-base-300 bg-base-200 p-6">
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold">
                <UserRound className="text-warning" />
                Your Information
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["firstName", "First Name"],
                  ["lastName", "Last Name"],
                  ["email", "Email Address"],
                  ["phone", "Phone Number"],
                ].map(([name, label]) => (
                  <label key={name} className="form-control">
                    <span className="mb-2 block text-sm font-medium">
                      {label}
                    </span>

                    <input
                      name={name}
                      type={
                        name === "email"
                          ? "email"
                          : name === "phone"
                            ? "tel"
                            : "text"
                      }
                      required
                      value={form[name]}
                      onChange={updateForm}
                      className="input input-bordered w-full"
                      placeholder={label}
                    />
                  </label>
                ))}
              </div>

              <label className="mt-6 block">
                <span className="mb-2 block text-sm font-medium">
                  Additional Notes (Optional)
                </span>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={updateForm}
                  className="textarea textarea-bordered min-h-24 w-full"
                  placeholder="Anything you would like us to know?"
                />
              </label>

              <label className="mt-5 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="marketingConsent"
                  checked={form.marketingConsent}
                  onChange={updateForm}
                  className="checkbox checkbox-warning mt-1"
                />

                <span className="text-sm text-base-content/60">
                  I would like to receive updates about upcoming classes,
                  workshops, and events.
                </span>
              </label>
            </section>

            {error && (
              <div role="alert" className="alert alert-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="
    flex w-full min-h-[64px]
    items-center justify-center gap-3
    rounded-xl cursor-pointer
    bg-gradient-to-r
    from-[#D4AF37] to-[#F5D76E]
    px-6 py-4
    text-lg font-bold text-black
    shadow-lg
    transition-all duration-300
    hover:brightness-110
    hover:-translate-y-1
    active:scale-[0.98]
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:transform-none
  "
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  Processing your booking...
                </>
              ) : (
                <>
                  <CheckCircle2 size={22} />
                  Reserve My Spot
                </>
              )}
            </button>

            <p className="text-center text-xs text-base-content/50">
              Payment is collected at the studio. Your reservation is pending
              confirmation.
            </p>
          </form>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-warning/30 bg-base-200 p-6 lg:sticky lg:top-24">
              <h2 className="mb-6 flex items-center gap-3 text-xl font-bold">
                <CalendarDays className="text-warning" />
                Your Selected Classes
              </h2>

              <div className="space-y-5">
                {selectedClasses.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-base-300 pb-5 last:border-0"
                  >
                    <div className="flex justify-between gap-3">
                      <h3 className="font-semibold">
                        {item.title || item.dance}
                      </h3>

                      <span className="font-bold text-warning">
                        {formatPrice(item.priceCents)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-base-content/60">
                      {item.dayOfWeek || item.day} ·{" "}
                      {formatTime(item.startTimeMinutes)}
                    </p>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-xs font-medium">
                        Attendance Date
                      </span>

                      <input
                        type="date"
                        required
                        min={vegasDate()}
                        value={dates[item.id] || ""}
                        onChange={(event) =>
                          setDates((previous) => ({
                            ...previous,
                            [item.id]: event.target.value,
                          }))
                        }
                        className="input input-bordered w-full"
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-base-300 pt-5">
                <span className="font-semibold">Estimated Total</span>

                <span className="text-2xl font-black text-warning">
                  {formatPrice(totalCents)}
                </span>
              </div>

              <p className="mt-3 text-xs text-base-content/50">
                Final pricing is confirmed by the studio.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
