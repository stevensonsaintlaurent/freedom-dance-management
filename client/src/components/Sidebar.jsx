
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  CalendarCheck,
  CreditCard,
  GraduationCap,
  ClipboardCheck,
  BriefcaseBusiness,
  CalendarDays,
  TicketCheck,
  ShieldCheck,
  UsersRound,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../auth/AuthContext";

const common = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Profile",
    path: "/profile",
    icon: UserRound,
  },
];

const dancer = [
  {
    label: "My Bookings",
    path: "/dancer/bookings",
    icon: CalendarCheck,
  },
  {
    label: "Membership",
    path: "/dancer/membership",
    icon: CreditCard,
  },
];

const instructor = [
  {
    label: "My Classes",
    path: "/instructor/classes",
    icon: GraduationCap,
  },
  {
    label: "Attendance",
    path: "/instructor/attendance",
    icon: ClipboardCheck,
  },
];

const manager = [
  {
    label: "Manager Overview",
    path: "/manager",
    icon: BriefcaseBusiness,
  },
  {
    label: "Manage Bookings",
    path: "/manager/bookings",
    icon: TicketCheck,
  },
  {
    label: "Manage Events",
    path: "/manager/events",
    icon: CalendarDays,
  },
];

const admin = [
  {
    label: "Admin Overview",
    path: "/admin",
    icon: ShieldCheck,
  },
  {
    label: "Staff & Invitations",
    path: "/admin/staff",
    icon: UsersRound,
  },
];

function SidebarSection({ title, links, onNavigate }) {
  if (!links.length) return null;

  return (
    <div className="space-y-2">
      <p className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
        {title}
      </p>

      <div className="space-y-1">
        {links.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-3
               text-sm font-medium transition-all duration-200
               ${
                 isActive
                   ? "bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20"
                   : "text-zinc-400 hover:bg-white/5 hover:text-white"
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={19}
                  className={
                    isActive
                      ? "text-amber-400"
                      : "text-zinc-500 transition-colors group-hover:text-amber-400"
                  }
                />

                <span className="flex-1">{label}</span>

                {isActive && (
                  <span className="size-1.5 rounded-full bg-amber-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();

  const role = user?.role || "dancer";

  const workspaceLinks =
    role === "dancer"
      ? dancer
      : role === "instructor"
      ? instructor
      : [];

  const managementLinks =
    role === "manager" || role === "admin" ? manager : [];

  const adminLinks = role === "admin" ? admin : [];

  const displayName =
    user?.name ||
    user?.firstName ||
    user?.email ||
    "Freedom Member";

  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-white/10 bg-zinc-950 text-white">
      {/* SIDEBAR HEADER */}
      <div className="px-5 pb-5 pt-7">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-amber-400" />

          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
            Freedom Workspace
          </span>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white">
          Your Dashboard
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Manage your dance journey.
        </p>
      </div>

      <Separator className="bg-white/10" />

      {/* NAVIGATION */}
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-6">
        <SidebarSection
          title="Workspace"
          links={common}
          onNavigate={onNavigate}
        />

        <SidebarSection
          title="My Dance Journey"
          links={workspaceLinks}
          onNavigate={onNavigate}
        />

        <SidebarSection
          title="Management"
          links={managementLinks}
          onNavigate={onNavigate}
        />

        <SidebarSection
          title="Administration"
          links={adminLinks}
          onNavigate={onNavigate}
        />
      </div>

      {/* BOTTOM SECTION */}
      <div className="space-y-4 border-t border-white/10 p-4">
        <Link
          to="/classes"
          onClick={onNavigate}
          className="group flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 transition-colors hover:bg-amber-400/10"
        >
          <div>
            <p className="text-sm font-bold text-white">
              Explore Classes
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Discover something new
            </p>
          </div>

          <ArrowUpRight className="size-5 text-amber-400 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
        </Link>

        {/* USER PROFILE */}
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <Avatar className="size-10 border border-amber-400/30">
            <AvatarFallback className="bg-amber-400/10 text-sm font-bold text-amber-400">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>

            <p className="text-xs capitalize text-zinc-500">
              {role}
            </p>
          </div>

          <Link
            to="/profile"
            onClick={onNavigate}
            aria-label="View profile"
            className="text-zinc-500 transition-colors hover:text-amber-400"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
