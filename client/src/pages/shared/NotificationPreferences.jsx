import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Mail,
  CalendarClock,
  MessageSquare,
  Settings2,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import api from "@/api/axios";

const endpoint = "/notification-preferences";
const extract = (data) => {
  const p = data?.preferences;
  if (
    typeof p?.dashboardEnabled !== "boolean" ||
    typeof p?.emailEnabled !== "boolean"
  ) {
    throw new Error("Invalid notification preferences response.");
  }
  return { dashboardEnabled: p.dashboardEnabled, emailEnabled: p.emailEnabled };
};
const errorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";

function PreferenceRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled,
  upcoming,
}) {
  return (
    <div className="flex items-center gap-4 border-b border-white/10 py-6 last:border-0">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
        <Icon size={21} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
        {upcoming && (
          <span className="mt-2 inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
            Coming soon
          </span>
        )}
      </div>
      {!upcoming && (
        <button
          type="button"
          role="switch"
          aria-label={title}
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-50 ${checked ? "bg-amber-400" : "bg-zinc-700"}`}
        >
          <span
            className={`absolute left-1 top-1 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      )}
    </div>
  );
}

export default function NotificationPreferences() {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api
      .get(endpoint, { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const p = extract(data);
        setSaved(p);
        setDraft(p);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  const dirty =
    !!draft &&
    !!saved &&
    Object.keys(draft).some((key) => draft[key] !== saved[key]);
  const change = (key, value) => {
    setDraft((p) => ({ ...p, [key]: value }));
    setSuccess("");
    setError("");
  };
  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updates = Object.fromEntries(
        Object.entries(draft).filter(([key, value]) => value !== saved[key]),
      );
      const { data } = await api.patch(endpoint, updates);
      const p = extract(data);
      setSaved(p);
      setDraft(p);
      setSuccess("Your notification preferences have been saved.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="mx-auto max-w-4xl space-y-6 text-white">
      <Link
        to="/notifications"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-400"
      >
        <ArrowLeft size={16} /> Notification history
      </Link>
      <header className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-zinc-950 p-6 sm:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
          <Settings2 size={25} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Freedom Workspace
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Notification Preferences
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Choose how you receive studio booking updates. These settings apply to
          your account only.
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
        >
          <AlertCircle size={20} className="shrink-0" />
          <div className="flex-1">{error}</div>
          {!draft && (
            <button
              onClick={() => setRetry((n) => n + 1)}
              className="underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300"
        >
          <CheckCircle2 size={20} />
          {success}
        </div>
      )}
      {loading ? (
        <div
          role="status"
          className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 p-12 text-zinc-400"
        >
          <Loader2 className="animate-spin" size={20} /> Loading preferences...
        </div>
      ) : (
        draft && (
          <>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 sm:p-7">
              <h2 className="text-lg font-bold">Booking notifications</h2>
              <PreferenceRow
                icon={Bell}
                title="Dashboard notifications"
                description="Receive new booking alerts in your notification bell and history."
                checked={draft.dashboardEnabled}
                onChange={(v) => change("dashboardEnabled", v)}
                disabled={saving}
              />
              <PreferenceRow
                icon={Mail}
                title="Email notifications"
                description="Receive staff booking updates at your account email address."
                checked={draft.emailEnabled}
                onChange={(v) => change("emailEnabled", v)}
                disabled={saving}
              />
              <p className="rounded-xl bg-white/5 p-4 text-sm leading-relaxed text-zinc-400">
                Turning off staff alerts does not cancel reservations, remove
                existing notification history or disable customer booking
                receipts.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 sm:p-7">
              <h2 className="text-lg font-bold">Upcoming features</h2>
              <PreferenceRow
                icon={CalendarClock}
                title="Personal class reminder preferences"
                description="Manage reminders for your own member bookings when account-linked reservations are available."
                upcoming
              />
              <PreferenceRow
                icon={MessageSquare}
                title="SMS notifications"
                description="Text message alerts are not available yet."
                upcoming
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 p-5">
              <p className="text-sm text-zinc-400" aria-live="polite">
                {dirty ? "You have unsaved changes." : "No unsaved changes."}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!dirty || saving}
                  onClick={() => {
                    setDraft(saved);
                    setError("");
                    setSuccess("");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold disabled:opacity-40"
                >
                  <RotateCcw size={16} /> Reset
                </button>
                <button
                  type="button"
                  disabled={!dirty || saving}
                  onClick={save}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-40"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Saving..." : "Save preferences"}
                </button>
              </div>
            </div>
          </>
        )
      )}
    </section>
  );
}
