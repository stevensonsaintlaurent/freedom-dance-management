import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
      });

      setMessage("Your profile has been updated successfully.");
    } catch (err) {
      const response = err.response?.data;
      const fieldErrors = response?.errors?.fieldErrors;
      const firstFieldError = fieldErrors
        ? Object.values(fieldErrors).flat()[0]
        : null;

      setError(
        firstFieldError ||
          response?.message ||
          "Something went wrong while updating your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60";

  const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

  const initials = `${user?.firstName?.[0] || ""}${
    user?.lastName?.[0] || ""
  }`.toUpperCase();

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* PAGE HEADER */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Freedom Dance Studio
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Account Settings
          </h1>

          <p className="mt-2 text-slate-600">
            Manage your personal information and keep your account up to date.
          </p>
        </div>

        {/* PROFILE OVERVIEW */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-600" />

          <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="-mt-10 flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-indigo-100 text-2xl font-extrabold text-indigo-700 shadow-md">
                {initials || "FD"}
              </div>

              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {user.name}
                </h2>

                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
              {user.role}
            </span>
          </div>
        </div>

        {/* PROFILE FORM */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
            <h3 className="text-xl font-bold text-slate-900">
              Personal Information
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Update your name, email address, and phone number.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClass}>
                  First Name
                </label>

                <input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={inputClass}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className={labelClass}>
                  Last Name
                </label>

                <input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={inputClass}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className={inputClass}
                  maxLength={30}
                />
              </div>
            </div>

            {/* ACCOUNT ROLE */}
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">
                Account Role
              </p>

              <p className="mt-2 text-lg font-bold capitalize text-slate-900">
                {user.role}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Your account role is managed by authorized staff.
              </p>
            </div>

            {/* FEEDBACK */}
            {message && (
              <div
                role="status"
                className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800"
              >
                {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            {/* ACTIONS */}
            <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Your changes will be saved to your account.
              </p>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-indigo-700 px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
