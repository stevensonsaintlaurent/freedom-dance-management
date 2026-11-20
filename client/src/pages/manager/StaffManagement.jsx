import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  ShieldCheck,
  Search,
  CheckCircle2,
  Loader2,
  RefreshCw,
  UserPlus,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

import api from "../../api/axios";

const initialInstructorForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
};

export default function StaffManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add instructor state
  const [showInstructorForm, setShowInstructorForm] = useState(false);
  const [instructorForm, setInstructorForm] = useState(initialInstructorForm);
  const [creatingInstructor, setCreatingInstructor] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ==========================================
  // FETCH REGISTERED USERS
  // ==========================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/staff/users");

      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load registered users.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // INSTRUCTOR FORM
  // ==========================================

  const openInstructorForm = () => {
    setInstructorForm({ ...initialInstructorForm });
    setFormError("");
    setShowPassword(false);
    setShowInstructorForm(true);
  };

  const closeInstructorForm = () => {
    if (creatingInstructor) return;

    setShowInstructorForm(false);
    setFormError("");
    setInstructorForm({ ...initialInstructorForm });
    setShowPassword(false);
  };

  const handleInstructorChange = (event) => {
    const { name, value } = event.target;

    setInstructorForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateInstructor = async (event) => {
    event.preventDefault();

    if (creatingInstructor) return;

    setFormError("");
    setError("");
    setSuccess("");

    const data = {
      firstName: instructorForm.firstName.trim(),
      lastName: instructorForm.lastName.trim(),
      email: instructorForm.email.trim().toLowerCase(),
      phone: instructorForm.phone.trim(),
      password: instructorForm.password,
    };

    if (data.firstName.length < 2) {
      setFormError("First name must have at least 2 characters.");
      return;
    }

    if (data.lastName.length < 2) {
      setFormError("Last name must have at least 2 characters.");
      return;
    }

    if (!data.email) {
      setFormError("Please enter an email address.");
      return;
    }

    if (data.password.length < 8) {
      setFormError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setCreatingInstructor(true);

      const response = await api.post("/staff/instructors", data);

      const newInstructor = response.data.instructor;

      if (newInstructor) {
        setUsers((previous) => [
          newInstructor,
          ...previous.filter((user) => user.id !== newInstructor.id),
        ]);
      }

      setSuccess(
        `${data.firstName} ${data.lastName} has been added as an instructor successfully.`,
      );

      setSearch("");
      setShowInstructorForm(false);
      setInstructorForm({ ...initialInstructorForm });
      setShowPassword(false);

      // Refresh from database
      try {
        const refreshed = await api.get("/staff/users");
        setUsers(refreshed.data.users || []);
      } catch {
        // Keep the newly created instructor in local state.
      }
    } catch (err) {
      console.error("Create instructor error:", err);

      const status = err.response?.status;
      const serverMessage = err.response?.data?.message;

      setFormError(
        serverMessage ||
          (status
            ? `Failed to create instructor. HTTP ${status}`
            : `Network error: ${err.message}`),
      );
    } finally {
      setCreatingInstructor(false);
    }
  };

  // ==========================================
  // APPROVE INSTRUCTOR
  // ==========================================

  const handleApproveInstructor = async (user) => {
    const confirmed = window.confirm(
      `Approve ${user.firstName} ${user.lastName} as an instructor?`,
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user.id);
      setError("");
      setSuccess("");

      const response = await api.patch(`/staff/users/${user.id}/role`, {
        role: "INSTRUCTOR",
      });

      setUsers((previous) =>
        previous.map((currentUser) =>
          currentUser.id === user.id
            ? { ...currentUser, ...response.data.user }
            : currentUser,
        ),
      );

      setSuccess(
        `${user.firstName} ${user.lastName} has been approved as an instructor.`,
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve instructor.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // REMOVE INSTRUCTOR PERMISSIONS
  // ==========================================

  const handleRemoveInstructor = async (user) => {
    const confirmed = window.confirm(
      `Remove instructor permissions from ${user.firstName} ${user.lastName}?`,
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user.id);
      setError("");
      setSuccess("");

      const response = await api.patch(`/staff/users/${user.id}/role`, {
        role: "MEMBER",
      });

      setUsers((previous) =>
        previous.map((currentUser) =>
          currentUser.id === user.id
            ? { ...currentUser, ...response.data.user }
            : currentUser,
        ),
      );

      setSuccess(`${user.firstName} ${user.lastName} is now a member.`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to remove instructor permissions.",
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalUsers = users.length;

  const totalInstructors = users.filter(
    (user) => user.role === "INSTRUCTOR",
  ).length;

  const totalManagers = users.filter(
    (user) => user.role === "MANAGER" || user.role === "ADMIN",
  ).length;

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();

    const email = user.email.toLowerCase();
    const searchValue = search.toLowerCase().trim();

    return (
      fullName.includes(searchValue) ||
      email.includes(searchValue) ||
      user.role.toLowerCase().includes(searchValue)
    );
  });

  // ==========================================
  // ROLE STYLES
  // ==========================================

  const getRoleStyle = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";

      case "MANAGER":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";

      case "INSTRUCTOR":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";

      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <section className="space-y-8 text-white">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Staff Management
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Manage users, create instructor accounts, and assign instructor
            permissions at Freedom Dance Studio.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm font-medium transition hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openInstructorForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-400"
          >
            <UserPlus className="h-4 w-4" />
            Add Instructor
          </button>
        </div>
      </div>

      {/* MESSAGES */}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="text-blue-400"
        />

        <StatCard
          title="Instructors"
          value={totalInstructors}
          icon={UserCheck}
          color="text-amber-400"
        />

        <StatCard
          title="Management"
          value={totalManagers}
          icon={ShieldCheck}
          color="text-purple-400"
        />
      </div>

      {/* USERS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Registered Users</h2>

            <p className="mt-1 text-xs text-zinc-400">
              {filteredUsers.length} users found
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="w-full rounded-xl border border-white/10 bg-zinc-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Registered</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-white/[0.03]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 font-bold text-amber-400">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium text-white">
                          {user.firstName} {user.lastName}
                        </p>

                        <p className="text-xs text-zinc-400">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRoleStyle(
                        user.role,
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-2 text-xs font-medium ${
                        user.isActive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          user.isActive ? "bg-green-400" : "bg-red-400"
                        }`}
                      />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-zinc-400">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {user.role === "MEMBER" && user.isActive ? (
                      <button
                        type="button"
                        onClick={() => handleApproveInstructor(user)}
                        disabled={updatingUserId !== null}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
                      >
                        {updatingUserId === user.id
                          ? "Approving..."
                          : "Approve Instructor"}
                      </button>
                    ) : user.role === "INSTRUCTOR" && user.isActive ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstructor(user)}
                        disabled={updatingUserId !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        {updatingUserId === user.id
                          ? "Removing..."
                          : "Remove Instructor"}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && users.length === 0 && (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
              Loading staff...
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
              <p className="text-sm text-zinc-400">No users found.</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD INSTRUCTOR MODAL */}

      {showInstructorForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeInstructorForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-instructor-title"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-white/10 p-6">
              <div>
                <h2 id="add-instructor-title" className="text-xl font-bold">
                  Add New Instructor
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  Create an instructor account for Freedom Dance Studio.
                </p>
              </div>

              <button
                type="button"
                onClick={closeInstructorForm}
                disabled={creatingInstructor}
                aria-label="Close form"
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateInstructor}
              className="max-h-[75vh] space-y-5 overflow-y-auto p-6"
            >
              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
                >
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="First Name"
                  name="firstName"
                  value={instructorForm.firstName}
                  onChange={handleInstructorChange}
                  placeholder="First name"
                  minLength={2}
                  required
                />

                <FormField
                  label="Last Name"
                  name="lastName"
                  value={instructorForm.lastName}
                  onChange={handleInstructorChange}
                  placeholder="Last name"
                  minLength={2}
                  required
                />
              </div>

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={instructorForm.email}
                onChange={handleInstructorChange}
                placeholder="instructor@example.com"
                required
              />

              <FormField
                label="Phone Number (Optional)"
                name="phone"
                type="tel"
                value={instructorForm.phone}
                onChange={handleInstructorChange}
                placeholder="Phone number"
              />

              <div>
                <label
                  htmlFor="instructor-password"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Initial Password
                </label>

                <div className="relative">
                  <input
                    id="instructor-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={instructorForm.password}
                    onChange={handleInstructorChange}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400/50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-zinc-500">
                  Use a unique, strong initial password. A password setup or
                  reset flow is recommended before production use.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-sm font-semibold text-amber-400">
                  Account Role: INSTRUCTOR
                </p>

                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  This account will be active immediately and can be selected
                  when assigning weekly classes.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeInstructorForm}
                  disabled={creatingInstructor}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingInstructor}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {creatingInstructor ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create Instructor
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

// ==========================================
// REUSABLE FORM FIELD
// ==========================================

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  minLength,
}) {
  return (
    <div>
      <label
        htmlFor={`instructor-${name}`}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}
      </label>

      <input
        id={`instructor-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete="off"
        className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-amber-400/50"
      />
    </div>
  );
}

// ==========================================
// REUSABLE STAT CARD
// ==========================================

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-400">{title}</p>

        <div className="rounded-xl bg-white/5 p-3">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>

      <h2 className="mt-4 text-3xl font-bold text-white">{value}</h2>
    </div>
  );
}
