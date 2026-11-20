import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Hash,
  MapPin,
  Music2,
  Printer,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const STUDIO_ADDRESS = "3110 E Sunset Rd, Suite C, Las Vegas, NV 89120";

const formatPrice = (cents = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(cents) / 100);

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const dateString = typeof date === "string" ? date.slice(0, 10) : "";

  const parsed = new Date(`${dateString}T12:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
};

const formatTime = (minutes) => {
  if (minutes == null) return "Time unavailable";

  const value = Number(minutes);

  if (!Number.isFinite(value)) return "Time unavailable";

  const hour = Math.floor(value / 60);
  const minute = value % 60;

  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${
    hour >= 12 ? "PM" : "AM"
  }`;
};

const getInstructor = (instructor) => {
  if (!instructor) return "Freedom Dance Studio";

  if (typeof instructor === "string") {
    return instructor;
  }

  return (
    [instructor.firstName, instructor.lastName].filter(Boolean).join(" ") ||
    "Freedom Dance Studio"
  );
};

export default function BookingSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const booking = location.state || {};

  const {
    bookingReference,
    bookings = [],
    totalCents,
    status = "PENDING",
  } = booking;

  const calculatedTotal = bookings.reduce(
    (total, item) => total + Number(item.priceCents || 0),
    0,
  );

  const finalTotal = totalCents != null ? Number(totalCents) : calculatedTotal;

  const hasBooking = Boolean(bookingReference);

  const printConfirmation = () => {
    window.print();
  };

  const saveConfirmation = () => {
    const lines = [
      "FREEDOM DANCE STUDIO",
      "CLASS BOOKING CONFIRMATION",
      "",
      `Booking Reference: ${bookingReference}`,
      `Status: ${status}`,
      "",
      "SELECTED CLASSES",
      "",
      ...bookings.flatMap((item, index) => [
        `${index + 1}. ${item.weeklyClass?.title || "Dance Class"}`,
        `Date: ${formatDate(item.classDate)}`,
        `Time: ${formatTime(item.weeklyClass?.startTimeMinutes)}`,
        `Instructor: ${getInstructor(item.weeklyClass?.instructor)}`,
        `Price: ${formatPrice(item.priceCents)}`,
        "",
      ]),
      `TOTAL: ${formatPrice(finalTotal)}`,
      "",
      "Payment: Pay at the studio",
      "Your booking is pending confirmation.",
      "",
      STUDIO_ADDRESS,
      "vegasfreedomdancestudio.com",
    ];

    const content = lines.join("\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `FDS-Booking-${bookingReference}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  if (!hasBooking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 p-8 text-center shadow-2xl">
          <CalendarDays size={48} className="mx-auto mb-5 text-amber-400" />

          <h1 className="text-3xl font-black">No Booking Found</h1>

          <p className="mt-4 text-zinc-400">
            Your booking confirmation is not available. Please return to the
            schedule to make a reservation.
          </p>

          <button
            type="button"
            onClick={() => navigate("/schedule")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-zinc-950 transition hover:bg-amber-300"
          >
            <ArrowLeft size={18} />
            Browse Classes
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-white sm:px-6 lg:px-8 print:bg-white print:p-0 print:text-black">
      <div className="mx-auto max-w-5xl">
        {/* SUCCESS HEADER */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 print:border-black">
            <CheckCircle2
              size={52}
              className="text-emerald-400 print:text-black"
            />
          </div>

          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-amber-400 print:text-black">
            Freedom Dance Studio
          </p>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Booking Request Received!
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-zinc-400 print:text-black">
            Thank you for choosing Freedom Dance Studio. Your reservation
            request has been successfully submitted and is awaiting
            confirmation.
          </p>

          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-5 py-2 text-sm font-bold text-amber-400 print:border-black print:text-black">
            <ShieldCheck size={17} />
            {status === "CONFIRMED"
              ? "Booking Confirmed"
              : "Pending Studio Confirmation"}
          </span>
        </div>

        {/* REFERENCE */}
        <section className="mb-7 rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-zinc-900 p-7 text-center print:border-black print:bg-white">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-400 print:text-black">
            <Hash size={17} />
            Your Booking Reference
          </div>

          <p className="break-all text-2xl font-black tracking-wider text-amber-400 sm:text-4xl print:text-black">
            {bookingReference}
          </p>

          <p className="mt-4 text-sm text-zinc-400 print:text-black">
            Please save this reference and present it when you arrive at the
            studio.
          </p>
        </section>

        <div className="grid gap-7 lg:grid-cols-[1.5fr_1fr]">
          {/* CLASSES */}
          <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6 sm:p-8 print:border-black print:bg-white">
            <div className="mb-7 flex items-center gap-3">
              <CalendarDays className="text-amber-400 print:text-black" />

              <div>
                <h2 className="text-xl font-black">Your Selected Classes</h2>

                <p className="text-sm text-zinc-400 print:text-black">
                  {bookings.length}{" "}
                  {bookings.length === 1 ? "class" : "classes"}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {bookings.map((item, index) => {
                const weeklyClass = item.weeklyClass || {};

                return (
                  <article
                    key={item.id || index}
                    className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 print:border-black print:bg-white"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 print:text-black">
                          Class {index + 1}
                        </span>

                        <h3 className="mt-2 text-lg font-black">
                          {weeklyClass.title || "Dance Class"}
                        </h3>
                      </div>

                      <span className="font-black text-amber-400 print:text-black">
                        {formatPrice(item.priceCents)}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm text-zinc-300 print:text-black">
                      <p className="flex items-center gap-3">
                        <CalendarDays
                          size={17}
                          className="text-amber-400 print:text-black"
                        />
                        {formatDate(item.classDate)}
                      </p>

                      <p className="flex items-center gap-3">
                        <Clock3
                          size={17}
                          className="text-amber-400 print:text-black"
                        />
                        {formatTime(weeklyClass.startTimeMinutes)}
                        {" — "}
                        {formatTime(
                          Number(weeklyClass.startTimeMinutes) +
                            Number(weeklyClass.durationMinutes),
                        )}
                      </p>

                      <p className="flex items-center gap-3">
                        <UserRound
                          size={17}
                          className="text-amber-400 print:text-black"
                        />
                        {getInstructor(weeklyClass.instructor)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* SUMMARY */}
          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6 print:border-black print:bg-white">
              <h2 className="mb-6 text-xl font-black">Booking Summary</h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-400 print:text-black">
                    Number of Classes
                  </span>
                  <span className="font-bold">{bookings.length}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-zinc-400 print:text-black">
                    Payment Method
                  </span>
                  <span className="font-bold">Pay at Studio</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-zinc-400 print:text-black">Status</span>
                  <span className="font-bold text-amber-400 print:text-black">
                    {status}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-5 print:border-black">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Total</span>

                    <span className="text-3xl font-black text-amber-400 print:text-black">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* LOCATION */}
            <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6 print:border-black print:bg-white">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-black">
                <MapPin className="text-amber-400 print:text-black" />
                Studio Location
              </h2>

              <p className="text-sm leading-7 text-zinc-300 print:text-black">
                Freedom Dance Studio
                <br />
                {STUDIO_ADDRESS}
              </p>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `Freedom Dance Studio ${STUDIO_ADDRESS}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300 print:hidden"
              >
                Get Directions
                <ArrowRight size={16} />
              </a>
            </section>
          </aside>
        </div>

        {/* NEXT STEPS */}
        <section className="mt-7 rounded-3xl border border-amber-400/20 bg-amber-400/5 p-7 print:border-black print:bg-white">
          <h2 className="mb-5 text-xl font-black">What's Next?</h2>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Wait for Confirmation",
                text: "Our studio team will review your reservation.",
              },
              {
                icon: CalendarDays,
                title: "Save Your Class Date",
                text: "Keep your selected class dates and times handy.",
              },
              {
                icon: CreditCard,
                title: "Pay at the Studio",
                text: "Payment is collected when you arrive.",
              },
            ].map((step) => (
              <div key={step.title}>
                <step.icon
                  size={24}
                  className="mb-3 text-amber-400 print:text-black"
                />

                <h3 className="font-bold">{step.title}</h3>

                <p className="mt-2 text-sm leading-6 text-zinc-400 print:text-black">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ACTION BUTTONS */}
        <div className="mt-9 flex flex-wrap justify-center gap-3 print:hidden">
          <button
            type="button"
            onClick={printConfirmation}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-bold hover:border-amber-400"
          >
            <Printer size={18} />
            Print Confirmation
          </button>

          <button
            type="button"
            onClick={saveConfirmation}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-bold hover:border-amber-400"
          >
            <Download size={18} />
            Save Details
          </button>

          <button
            type="button"
            onClick={() => navigate("/schedule")}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-zinc-950 hover:bg-amber-300"
          >
            <Music2 size={18} />
            Explore More Classes
          </button>
        </div>

        <p className="mt-10 text-center text-xs text-zinc-500 print:text-black">
          Freedom Dance Studio · Las Vegas, Nevada
          <br />
          vegasfreedomdancestudio.com
        </p>
      </div>
    </main>
  );
}
