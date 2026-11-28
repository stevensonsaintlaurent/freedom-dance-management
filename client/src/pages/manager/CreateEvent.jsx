import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Image as ImageIcon,
  FileText,
  Eye,
  ShieldCheck,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";

import api from "@/api/axios";

// ==========================================
// CONSTANTS
// ==========================================

const EVENT_TYPES = [
  { value: "WEEKEND_INTENSIVE", label: "Weekend Intensive" },
  { value: "DANCE_WORKSHOP", label: "Dance Workshop" },
  { value: "SOCIAL", label: "Social Dance" },
  { value: "MASTERCLASS", label: "Masterclass" },
  { value: "LIVE_CONCERT", label: "Live Concert" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "SPECIAL_EVENT", label: "Special Event" },
  { value: "OTHER", label: "Other" },
];

const CATEGORIES = [
  "Bachata Sensual",
  "Traditional Bachata",
  "BachaZouk",
  "Salsa",
  "Kizomba",
  "Urban Kiz",
  "Konpa",
  "Reggaeton",
  "Reparto",
  "Hip-Hop",
  "AfroDance",
  "Twerk",
  "Ladies Styling",
  "Men's Styling",
  "Live Music / Jazz / Latin / Big Band",
];

const LEVELS = [
  "Open Level",
  "Beginner Friendly",
  "Beginner",
  "Intermediate",
  "Intermediate & Beyond",
  "Advanced",
  "Professional / Instructor",
  "Open to Everyone",
  "To Be Announced",
];

const INITIAL_FORM = {
  title: "",
  subtitle: "",
  description: "",
  type: "DANCE_WORKSHOP",
  category: "",
  instructorName: "",
  level: "Open Level",
  startDate: "",
  endDate: "",
  timeLabel: "",
  durationLabel: "",
  location: "Freedom Dance Studio",
  address: "3110 E Sunset Rd, Suite C, Las Vegas, NV 89120",
  imageUrl: "",
  imageFit: "contain",
  highlight: "",
  announcement: "",
  buttonLabel: "Register Now",
  capacity: "",
  featured: false,
  showInHero: false,
};

const INPUT_STYLE = `
  w-full rounded-xl border border-white/10
  bg-black/30 px-4 py-3 text-sm text-white
  outline-none transition
  placeholder:text-zinc-600
  focus:border-[#D4AF37]
  focus:ring-2 focus:ring-[#D4AF37]/10
  disabled:opacity-50
`;

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

const Section = ({ icon: Icon, title, description, children }) => (
  <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414]">
    <div className="flex items-start gap-4 border-b border-white/10 p-5 sm:p-6">
      <div className="rounded-xl bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
        <Icon size={22} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>

        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
    </div>

    <div className="space-y-5 p-5 sm:p-6">{children}</div>
  </section>
);

const Field = ({ label, name, required = false, hint, children }) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-medium text-zinc-200">
      {label}

      {required && <span className="ml-1 text-[#D4AF37]">*</span>}
    </label>

    {children}

    {hint && <p className="text-xs leading-relaxed text-zinc-500">{hint}</p>}
  </div>
);

const Toggle = ({ name, title, description, checked, onChange, disabled }) => (
  <label
    htmlFor={name}
    className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4"
  >
    <div>
      <p className="font-medium text-white">{title}</p>

      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </div>

    <div className="relative shrink-0">
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />

      <div
        className="
          h-6 w-11 rounded-full bg-zinc-700
          transition peer-checked:bg-[#D4AF37]
          peer-focus-visible:ring-2
          peer-focus-visible:ring-white
          peer-disabled:opacity-50
          after:absolute after:left-1 after:top-1
          after:h-4 after:w-4 after:rounded-full
          after:bg-white after:transition
          peer-checked:after:translate-x-5
        "
      />
    </div>
  </label>
);

// ==========================================
// VALIDATION
// ==========================================

const isValidImageUrl = (value) => {
  if (!value.trim()) return true;

  if (
    /^\/events\/[a-zA-Z0-9_-]+\.(webp|jpg|jpeg|png|avif)$/i.test(value.trim())
  ) {
    return true;
  }

  try {
    const url = new URL(value.trim());

    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
};

const formatDate = (value) => {
  if (!value) return "Date to be announced";

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const validateForm = (form) => {
  if (!form.title.trim()) {
    return "Event title is required.";
  }

  if (!EVENT_TYPES.some((type) => type.value === form.type)) {
    return "Please select a valid event type.";
  }

  if (!form.startDate) {
    return "Start date is required.";
  }

  if (form.endDate && form.endDate < form.startDate) {
    return "End date cannot be before the start date.";
  }

  if (form.capacity !== "") {
    const capacity = Number(form.capacity);

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
      return "Capacity must be a whole number between 1 and 100,000.";
    }
  }

  if (!isValidImageUrl(form.imageUrl)) {
    return "Please enter a valid HTTPS image URL or local /events/ image path.";
  }

  return null;
};

// ==========================================
// CREATE EVENT PAGE
// ==========================================

const CreateEvent = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ...INITIAL_FORM,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageError, setImageError] = useState(false);
  const [pendingRetry, setPendingRetry] = useState(false);
  const [savedEvent, setSavedEvent] = useState(null);

  // Immediate submission lock.
  const submittingRef = useRef(false);

  // Preserve the same key and payload when retrying.
  const requestRef = useRef(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(INITIAL_FORM);

  const fieldsDisabled = saving || pendingRetry || Boolean(savedEvent);

  // Warn before refreshing or closing an unfinished form.
  useEffect(() => {
    if (savedEvent || (!dirty && !saving && !pendingRetry)) {
      return;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [dirty, saving, pendingRetry, savedEvent]);

  useEffect(() => {
    setImageError(false);
  }, [form.imageUrl]);

  // ==========================================
  // FORM HANDLERS
  // ==========================================

  const handleChange = (event) => {
    if (submittingRef.current || fieldsDisabled) {
      return;
    }

    const { name, value, type, checked } = event.target;

    setForm((previous) => {
      const next = {
        ...previous,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "startDate") {
        if (!previous.endDate || previous.endDate < value) {
          next.endDate = value;
        }
      }

      return next;
    });

    setError("");
  };

  const handleCancel = () => {
    if (submittingRef.current) return;

    if (savedEvent) {
      navigate("/manager/events");
      return;
    }

    const message = pendingRetry
      ? "The previous request may have created an event. Leave this page and check Manage Events before creating another event?"
      : "You have unsaved changes. Are you sure you want to leave?";

    if ((dirty || pendingRetry) && !window.confirm(message)) {
      return;
    }

    navigate("/manager/events");
  };

  const buildPayload = () => ({
    ...form,

    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    instructorName: form.instructorName.trim(),
    location: form.location.trim(),
    address: form.address.trim(),
    imageUrl: form.imageUrl.trim(),

    endDate: form.endDate || form.startDate,

    capacity: form.capacity === "" ? null : Number(form.capacity),
  });

  // ==========================================
  // PROTECTED EVENT SUBMISSION
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current || savedEvent) {
      return;
    }

    setError("");
    setSuccess("");

    if (!requestRef.current) {
      const validationMessage = validateForm(form);

      if (validationMessage) {
        setError(validationMessage);
        return;
      }

      if (!globalThis.crypto?.randomUUID) {
        setError("A secure browser connection is required to create events.");
        return;
      }

      requestRef.current = {
        key: globalThis.crypto.randomUUID(),
        payload: buildPayload(),
      };
    }

    // Lock synchronously before starting the request.
    submittingRef.current = true;

    setSaving(true);

    try {
      const request = requestRef.current;

      const response = await api.post("/events", request.payload, {
        headers: {
          "Idempotency-Key": request.key,
        },
      });

      if (!response.data?.success || !response.data?.event?.id) {
        throw new Error("Unexpected server response.");
      }

      setSavedEvent(response.data.event);

      setSuccess(
        response.data.replayed
          ? "Your event was already saved successfully."
          : "Your event has been saved successfully as a draft.",
      );

      setPendingRetry(false);

      requestRef.current = null;
    } catch (requestError) {
      const status = requestError.response?.status;

      const message =
        requestError.response?.data?.message ||
        "Unable to confirm whether the event was saved.";

      // A definite validation rejection can be corrected.
      // Do not discard an earlier uncertain request.
      if (!pendingRetry && [400, 401, 403, 422].includes(status)) {
        requestRef.current = null;
        setPendingRetry(false);
        setError(message);
      } else {
        // Preserve the original key and payload.
        // The server may have saved the event even
        // if the browser did not receive its response.
        setPendingRetry(true);

        setError(
          `${message} Retry the same request or check Manage Events before creating another event.`,
        );
      }
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  const previewImage =
    form.imageUrl.trim() && isValidImageUrl(form.imageUrl) && !imageError;

  const selectedType =
    EVENT_TYPES.find((type) => type.value === form.type)?.label || "Event";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        {/* PAGE HEADER */}

        <header>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-[#D4AF37] disabled:opacity-50"
          >
            <ArrowLeft size={18} />
            Back to Manage Events
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                Freedom Dance Studio
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create New Event
              </h1>

              <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                Create workshops, weekend intensives, socials, concerts and
                special experiences.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold text-[#D4AF37]">
              <FileText size={15} />
              Draft Mode
            </div>
          </div>
        </header>

        {/* INFORMATION BANNER */}

        <div className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
          <Info size={20} className="mt-0.5 shrink-0 text-[#D4AF37]" />

          <div>
            <p className="text-sm font-medium text-[#D4AF37]">
              Create your event with confidence
            </p>

            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              New events are saved as drafts. They will not appear publicly or
              accept reservations until they are published and registration is
              enabled.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* MAIN FORM */}

            <div className="space-y-6">
              <fieldset disabled={fieldsDisabled} className="min-w-0 space-y-6">
                {/* EVENT INFORMATION */}

                <Section
                  icon={FileText}
                  title="Event Information"
                  description="Tell your community what this event is about."
                >
                  <Field label="Event Title" name="title" required>
                    <input
                      id="title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      maxLength={200}
                      required
                      placeholder="e.g. Las Vegas Bachata Weekender"
                      className={INPUT_STYLE}
                    />
                  </Field>

                  <Field label="Subtitle" name="subtitle">
                    <input
                      id="subtitle"
                      name="subtitle"
                      value={form.subtitle}
                      onChange={handleChange}
                      maxLength={250}
                      placeholder="An unforgettable weekend of dance"
                      className={INPUT_STYLE}
                    />
                  </Field>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Event Type" name="type" required>
                      <select
                        id="type"
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className={INPUT_STYLE}
                      >
                        {EVENT_TYPES.map((type) => (
                          <option
                            key={type.value}
                            value={type.value}
                            className="bg-[#181818]"
                          >
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Category" name="category">
                      <input
                        id="category"
                        name="category"
                        list="event-categories"
                        value={form.category}
                        onChange={handleChange}
                        maxLength={150}
                        placeholder="Select or enter a category"
                        className={INPUT_STYLE}
                      />

                      <datalist id="event-categories">
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                    </Field>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Instructor / Artist" name="instructorName">
                      <input
                        id="instructorName"
                        name="instructorName"
                        value={form.instructorName}
                        onChange={handleChange}
                        maxLength={200}
                        placeholder="Guest artists or instructors"
                        className={INPUT_STYLE}
                      />
                    </Field>

                    <Field label="Experience Level" name="level">
                      <select
                        id="level"
                        name="level"
                        value={form.level}
                        onChange={handleChange}
                        className={INPUT_STYLE}
                      >
                        {LEVELS.map((level) => (
                          <option
                            key={level}
                            value={level}
                            className="bg-[#181818]"
                          >
                            {level}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Event Description" name="description">
                    <textarea
                      id="description"
                      name="description"
                      rows={7}
                      value={form.description}
                      onChange={handleChange}
                      maxLength={10000}
                      placeholder="Describe the event, what participants will learn, and why they should attend..."
                      className={`${INPUT_STYLE} resize-y`}
                    />

                    <p className="text-right text-xs text-zinc-500">
                      {form.description.length}/10000
                    </p>
                  </Field>
                </Section>

                {/* DATE AND TIME */}

                <Section
                  icon={CalendarDays}
                  title="Date & Time"
                  description="Set the event dates and displayed schedule."
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Start Date" name="startDate" required>
                      <input
                        id="startDate"
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                        required
                        className={`${INPUT_STYLE} [color-scheme:dark]`}
                      />
                    </Field>

                    <Field
                      label="End Date"
                      name="endDate"
                      hint="Leave empty for a single-day event."
                    >
                      <input
                        id="endDate"
                        type="date"
                        name="endDate"
                        min={form.startDate || undefined}
                        value={form.endDate}
                        onChange={handleChange}
                        className={`${INPUT_STYLE} [color-scheme:dark]`}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Displayed Event Time" name="timeLabel">
                      <input
                        id="timeLabel"
                        name="timeLabel"
                        value={form.timeLabel}
                        onChange={handleChange}
                        maxLength={200}
                        placeholder="4:00 PM – 6:30 PM"
                        className={INPUT_STYLE}
                      />
                    </Field>

                    <Field label="Duration" name="durationLabel">
                      <input
                        id="durationLabel"
                        name="durationLabel"
                        value={form.durationLabel}
                        onChange={handleChange}
                        maxLength={100}
                        placeholder="2.5 Hours or 2 Days"
                        className={INPUT_STYLE}
                      />
                    </Field>
                  </div>

                  <div className="rounded-xl bg-white/5 p-4 text-sm text-zinc-400">
                    Time zone: America/Los_Angeles (Pacific Time)
                  </div>
                </Section>

                {/* LOCATION */}

                <Section
                  icon={MapPin}
                  title="Location & Capacity"
                  description="Specify where the event will take place."
                >
                  <Field label="Venue Name" name="location">
                    <input
                      id="location"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      maxLength={250}
                      placeholder="Freedom Dance Studio"
                      className={INPUT_STYLE}
                    />
                  </Field>

                  <Field label="Venue Address" name="address">
                    <input
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      maxLength={500}
                      className={INPUT_STYLE}
                    />
                  </Field>

                  <Field
                    label="Maximum Capacity"
                    name="capacity"
                    hint="Leave empty if the capacity has not been determined."
                  >
                    <input
                      id="capacity"
                      type="number"
                      name="capacity"
                      min="1"
                      max="100000"
                      step="1"
                      value={form.capacity}
                      onChange={handleChange}
                      placeholder="e.g. 40"
                      className={INPUT_STYLE}
                    />
                  </Field>
                </Section>

                {/* EVENT FLYER */}

                <Section
                  icon={ImageIcon}
                  title="Event Flyer"
                  description="Add a promotional image for your event."
                >
                  <Field
                    label="Image URL or Local Path"
                    name="imageUrl"
                    hint="Use an HTTPS URL or an existing image inside client/public/events."
                  >
                    <input
                      id="imageUrl"
                      name="imageUrl"
                      value={form.imageUrl}
                      onChange={handleChange}
                      maxLength={2000}
                      placeholder="/events/bachazouk.webp"
                      className={INPUT_STYLE}
                    />
                  </Field>

                  <Field label="Image Display" name="imageFit">
                    <select
                      id="imageFit"
                      name="imageFit"
                      value={form.imageFit}
                      onChange={handleChange}
                      className={INPUT_STYLE}
                    >
                      <option value="contain">
                        Contain — Show entire flyer
                      </option>

                      <option value="cover">Cover — Fill image area</option>
                    </select>
                  </Field>

                  <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/30">
                    {previewImage ? (
                      <img
                        src={form.imageUrl.trim()}
                        alt="Event flyer preview"
                        onError={() => setImageError(true)}
                        referrerPolicy="no-referrer"
                        className={`h-80 w-full ${
                          form.imageFit === "cover"
                            ? "object-cover"
                            : "object-contain"
                        }`}
                      />
                    ) : (
                      <div className="space-y-3 p-6 text-center">
                        <ImageIcon
                          size={42}
                          className="mx-auto text-zinc-600"
                        />

                        <p className="text-sm text-zinc-400">
                          {imageError
                            ? "Unable to load this image"
                            : "Your event flyer will appear here"}
                        </p>
                      </div>
                    )}
                  </div>
                </Section>

                {/* PROMOTION */}

                <Section
                  icon={Sparkles}
                  title="Promotion & Marketing"
                  description="Make your event stand out to your community."
                >
                  <Field label="Promotional Highlight" name="highlight">
                    <input
                      id="highlight"
                      name="highlight"
                      value={form.highlight}
                      onChange={handleChange}
                      maxLength={200}
                      placeholder="EARLY BIRD SPECIAL!"
                      className={INPUT_STYLE}
                    />
                  </Field>

                  <Field label="Special Announcement" name="announcement">
                    <textarea
                      id="announcement"
                      name="announcement"
                      rows={3}
                      value={form.announcement}
                      onChange={handleChange}
                      maxLength={1000}
                      placeholder="Limited spots available..."
                      className={`${INPUT_STYLE} resize-y`}
                    />
                  </Field>

                  <Field label="Registration Button Label" name="buttonLabel">
                    <input
                      id="buttonLabel"
                      name="buttonLabel"
                      value={form.buttonLabel}
                      onChange={handleChange}
                      maxLength={80}
                      placeholder="Get Your Pass"
                      className={INPUT_STYLE}
                    />
                  </Field>
                </Section>

                {/* WEBSITE VISIBILITY */}

                <Section
                  icon={Eye}
                  title="Website Visibility"
                  description="Choose how this event should be promoted after publishing."
                >
                  <Toggle
                    name="featured"
                    title="Featured Event"
                    description="Mark this event for featured event sections."
                    checked={form.featured}
                    onChange={handleChange}
                    disabled={fieldsDisabled}
                  />

                  <Toggle
                    name="showInHero"
                    title="Homepage Hero"
                    description="Mark this event for homepage hero promotion."
                    checked={form.showInHero}
                    onChange={handleChange}
                    disabled={fieldsDisabled}
                  />

                  <p className="text-xs leading-relaxed text-zinc-500">
                    These settings do not publish the event. Public visibility
                    requires publishing separately.
                  </p>
                </Section>
              </fieldset>
            </div>

            {/* SIDEBAR */}

            <aside className="space-y-5 xl:sticky xl:top-24">
              {/* LIVE PREVIEW */}

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414]">
                <div className="flex items-center gap-2 border-b border-white/10 p-5">
                  <Eye size={18} className="text-[#D4AF37]" />

                  <h2 className="font-semibold">Event Preview</h2>
                </div>

                <div className="flex h-60 items-center justify-center bg-black/40">
                  {previewImage ? (
                    <img
                      src={form.imageUrl.trim()}
                      alt="Event card preview"
                      onError={() => setImageError(true)}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full ${
                        form.imageFit === "cover"
                          ? "object-cover"
                          : "object-contain"
                      }`}
                    />
                  ) : (
                    <ImageIcon size={48} className="text-zinc-700" />
                  )}
                </div>

                <div className="space-y-4 p-5">
                  <span className="inline-block rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
                    {selectedType}
                  </span>

                  <h3 className="break-words text-xl font-bold">
                    {form.title || "Your Event Title"}
                  </h3>

                  {form.subtitle && (
                    <p className="break-words text-sm text-zinc-400">
                      {form.subtitle}
                    </p>
                  )}

                  <div className="flex items-start gap-2 text-sm text-zinc-400">
                    <CalendarDays
                      size={17}
                      className="shrink-0 text-[#D4AF37]"
                    />

                    <span>
                      {formatDate(form.startDate)}

                      {form.endDate &&
                        form.endDate !== form.startDate &&
                        ` – ${formatDate(form.endDate)}`}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-zinc-400">
                    <MapPin size={17} className="shrink-0 text-[#D4AF37]" />

                    <span className="break-words">
                      {form.location || "Venue to be announced"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#D4AF37] px-4 py-3 text-center text-sm font-bold text-black">
                    {form.buttonLabel || "Register Now"}
                  </div>

                  <p className="text-center text-xs text-zinc-500">
                    Preview only — registration is disabled
                  </p>
                </div>
              </div>

              {/* SECURITY */}

              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={23} className="text-emerald-400" />

                  <h3 className="font-semibold text-emerald-400">
                    Protected Submission
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  Database-backed duplicate protection prevents repeated
                  submissions using the same request key.
                </p>
              </div>

              {/* SAVE EVENT */}

              <div className="space-y-4 rounded-2xl border border-white/10 bg-[#141414] p-5">
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
                  >
                    <AlertCircle size={18} className="shrink-0" />

                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div
                    role="status"
                    className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400"
                  >
                    <CheckCircle2 size={18} className="shrink-0" />

                    <span>{success}</span>
                  </div>
                )}

                {pendingRetry && !savedEvent && (
                  <p className="text-xs leading-relaxed text-amber-400">
                    Form editing is temporarily locked. Retrying will reuse the
                    original request key and event information.
                  </p>
                )}

                {savedEvent ? (
                  <button
                    type="button"
                    onClick={() => navigate("/manager/events")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-bold text-black transition hover:bg-[#E5C65B]"
                  >
                    <CheckCircle2 size={19} />
                    View Manage Events
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-4 text-sm font-bold text-black transition hover:bg-[#E5C65B] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={19} className="animate-spin" />
                        Saving Event...
                      </>
                    ) : (
                      <>
                        <Save size={19} />

                        {pendingRetry ? "Retry Same Request" : "Save as Draft"}
                      </>
                    )}
                  </button>
                )}

                {!savedEvent && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                  >
                    {pendingRetry ? "Check Manage Events" : "Cancel"}
                  </button>
                )}

                <p className="text-center text-xs leading-relaxed text-zinc-500">
                  Workshop sessions, ticket prices and publishing will be
                  configured separately.
                </p>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
