import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  CalendarDays,
  CalendarCheck,
  CreditCard,
  ArrowRight,
  UserRound,
  Clock3,
  Sparkles,
  Music2,
} from "lucide-react";

const quickActions = [
  {
    title: "Explore Classes",
    description: "Find your next dance class.",
    path: "/classes",
    icon: Music2,
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    title: "My Bookings",
    description: "View your class reservations.",
    path: "/dancer/bookings",
    icon: CalendarCheck,
    color: "bg-violet-100 text-violet-700",
  },
  {
    title: "My Membership",
    description: "Manage your membership.",
    path: "/dancer/membership",
    icon: CreditCard,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "My Profile",
    description: "Update your account details.",
    path: "/profile",
    icon: UserRound,
    color: "bg-amber-100 text-amber-700",
  },
];

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>

        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
          <Icon size={21} />
        </div>
      </div>

      <h3 className="mt-4 text-2xl font-bold text-slate-900">{value}</h3>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, link, linkText }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
      <div className="rounded-2xl bg-white p-4 text-indigo-700 shadow-sm">
        <Icon size={28} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>

      <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>

      {link && (
        <Link
          to={link}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800"
        >
          {linkText}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default function DancerDashboard() {
  const { user } = useAuth();

  const firstName = user?.firstName || "Dancer";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* WELCOME HEADER */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-800 via-violet-700 to-fuchsia-700 p-7 text-white shadow-lg sm:p-10">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold">
              <Sparkles size={15} />
              Freedom Dance Studio
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome back, {firstName}!
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-indigo-100 sm:text-base">
              Your dance journey continues here. Explore classes, manage your
              bookings, and stay connected with our community.
            </p>

            <Link
              to="/classes"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-800 transition hover:bg-indigo-50"
            >
              Explore Classes
              <ArrowRight size={17} />
            </Link>
          </div>

          <Music2
            size={220}
            className="pointer-events-none absolute -bottom-12 -right-10 rotate-12 text-white/10"
          />
        </section>

        {/* DASHBOARD OVERVIEW */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">Your Overview</h2>

            <p className="mt-1 text-sm text-slate-500">
              Your personal dance studio account at a glance.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Upcoming Classes"
              value="—"
              description="Class booking data not connected yet"
              icon={CalendarDays}
            />

            <StatCard
              title="My Bookings"
              value="—"
              description="Booking history will appear here"
              icon={CalendarCheck}
            />

            <StatCard
              title="Membership"
              value="Not connected"
              description="Membership details coming soon"
              icon={CreditCard}
            />
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>

            <p className="mt-1 text-sm text-slate-500">
              Everything you need in one place.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  to={action.path}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
                >
                  <div
                    className={`mb-5 inline-flex rounded-xl p-3 ${action.color}`}
                  >
                    <Icon size={24} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {action.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {action.description}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-indigo-700">
                    Open
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* UPCOMING CLASSES AND MEMBERSHIP */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <CalendarDays className="text-indigo-700" size={24} />

              <h2 className="text-lg font-bold text-slate-900">
                Upcoming Classes
              </h2>
            </div>

            <EmptyState
              icon={Clock3}
              title="Your class schedule"
              description="Once class bookings are connected, your upcoming reservations will appear here."
              link="/classes"
              linkText="Browse Classes"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <CreditCard className="text-indigo-700" size={24} />

              <h2 className="text-lg font-bold text-slate-900">
                Membership Details
              </h2>
            </div>

            <EmptyState
              icon={CreditCard}
              title="Membership information"
              description="Your membership plan, benefits, and renewal details will appear here when the membership system is connected."
              link="/dancer/membership"
              linkText="View Membership"
            />
          </div>
        </section>

        {/* ACCOUNT INFORMATION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                <UserRound size={25} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Account Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>

            <Link
              to="/profile"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Edit Profile
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
