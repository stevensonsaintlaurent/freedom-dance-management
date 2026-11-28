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
  CalendarX,
  CalendarPlus,
  TicketCheck,
  ShieldCheck,
  UsersRound,
  ArrowUpRight,
  Sparkles,
  ClipboardList,
  DoorOpen,
  Layers,
  DollarSign,
  Clock,
  Bell,
  Settings2,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../auth/AuthContext";

// ==========================================
// COMMON NAVIGATION
// ==========================================

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

const notificationLinks = [
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
  },
  {
    label: "Notification Preferences",
    path: "/notification-preferences",
    icon: Settings2,
  },
];
// ==========================================
// DANCER NAVIGATION
// ==========================================

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

// ==========================================
// INSTRUCTOR NAVIGATION
// ==========================================

const instructor = [
  {
    label: "My Classes",
    path: "/instructor/classes",
    icon: GraduationCap,
  },
  {
    label: "Class Bookings",
    path: "/instructor/bookings",
    icon: ClipboardList,
  },
  {
    label: "Attendance",
    path: "/instructor/attendance",
    icon: ClipboardCheck,
  },
];

// ==========================================
// MANAGEMENT NAVIGATION
// ==========================================

const manager = [
  {
    label: "Staff Management",
    path: "/manager/staff",
    icon: UsersRound,
  },
  {
    label: "Weekly Schedule",
    path: "/manager/weekly-classes",
    icon: CalendarDays,
  },
  {
    label: "Create Weekly Class",
    path: "/manager/weekly-classes/new",
    icon: CalendarPlus,
  },
  {
    label: "Manage Classes",
    path: "/manager/classes",
    icon: GraduationCap,
  },
  {
    label: "Create Dance Class",
    path: "/manager/classes/new",
    icon: CalendarPlus,
  },
  {
    label: "Manage Bookings",
    path: "/manager/bookings",
    icon: TicketCheck,
  },
  {
    label: "Attendance",
    path: "/manager/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Class Cancellations",
    path: "/manager/cancellations",
    icon: CalendarX,
  },
  {
    label: "Manage Events",
    path: "/manager/events",
    icon: CalendarDays,
  },
  {
    label: "Studio Rooms",
    path: "/manager/rooms",
    icon: DoorOpen,
  },
  {
    label: "Rental Categories",
    path: "/manager/rental-categories",
    icon: Layers,
  },
  {
    label: "Rental Pricing",
    path: "/manager/rental-pricing",
    icon: DollarSign,
  },
  {
    label: "Studio Availability",
    path: "/manager/availability",
    icon: CalendarDays,
  },
  {
    label: "Operating Hours",
    path: "/manager/operating-hours",
    icon: Clock,
  },
];

// ==========================================
// ADMIN NAVIGATION
// ==========================================

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
  {
    label: "All Bookings",
    path: "/admin/bookings",
    icon: ClipboardList,
  },
  {
    label: "Attendance Records",
    path: "/admin/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Class Cancellations",
    path: "/admin/cancellations",
    icon: CalendarX,
  },
];

// ==========================================
// ROLE INFORMATION
// ==========================================

const roleInformation = {
  dancer: {
    title: "Dancer Workspace",
    description: "Manage your dance journey.",
    icon: GraduationCap,
  },
  member: {
    title: "Member Workspace",
    description: "Manage your classes and membership.",
    icon: GraduationCap,
  },
  instructor: {
    title: "Instructor Workspace",
    description: "Manage your classes and students.",
    icon: GraduationCap,
  },
  manager: {
    title: "Manager Workspace",
    description: "Manage daily studio operations.",
    icon: BriefcaseBusiness,
  },
  admin: {
    title: "Admin Workspace",
    description: "Manage the entire studio platform.",
    icon: ShieldCheck,
  },
};

// ==========================================
// SIDEBAR SECTION
// ==========================================

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
                  className={`shrink-0 ${
                    isActive
                      ? "text-amber-400"
                      : "text-zinc-500 transition-colors group-hover:text-amber-400"
                  }`}
                />

                <span className="flex-1">{label}</span>

                {isActive && (
                  <span className="size-1.5 shrink-0 rounded-full bg-amber-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// MAIN SIDEBAR
// ==========================================

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();

  const role = String(user?.role || "dancer").toLowerCase();

  const isDancer = role === "dancer" || role === "member";

  const isInstructor = role === "instructor";
  const isManager = role === "manager";
  const isAdmin = role === "admin";
  const canManageNotifications = isManager || isInstructor || isAdmin;

  const workspaceLinks = isDancer ? dancer : isInstructor ? instructor : [];

  // Admins already have their own booking,
  // attendance, staff and cancellation routes.
  // Avoid displaying duplicate navigation links.

  const managementLinks = isManager
    ? manager
    : isAdmin
      ? manager.filter(
          (item) =>
            ![
              "/manager/staff",
              "/manager/bookings",
              "/manager/attendance",
              "/manager/cancellations",
            ].includes(item.path),
        )
      : [];

  const adminLinks = isAdmin ? admin : [];

  const roleInfo = roleInformation[role] || roleInformation.dancer;

  const RoleIcon = roleInfo.icon;

  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Freedom Member";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-white/10 bg-zinc-950 text-white">
      {/* =====================================
          SIDEBAR HEADER
      ====================================== */}

      <div className="px-5 pb-5 pt-7">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-amber-400" />

          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
            Freedom Workspace
          </span>
        </div>

        <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
          <RoleIcon size={22} className="text-amber-400" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white">
          {roleInfo.title}
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          {roleInfo.description}
        </p>
      </div>

      <Separator className="bg-white/10" />

      {/* =====================================
          NAVIGATION
      ====================================== */}

      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-6">
        <SidebarSection
          title="Workspace"
          links={common}
          onNavigate={onNavigate}
        />

        <SidebarSection
          title={isInstructor ? "Teaching" : "My Dance Journey"}
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

        {canManageNotifications && (
          <SidebarSection
            title="Notifications & Settings"
            links={notificationLinks}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* =====================================
          BOTTOM SECTION
      ====================================== */}

      <div className="shrink-0 space-y-4 border-t border-white/10 p-4">
        <Link
          to="/schedule"
          onClick={onNavigate}
          className="group flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 transition-colors hover:bg-amber-400/10"
        >
          <div>
            <p className="text-sm font-bold text-white">Explore Classes</p>

            <p className="mt-1 text-xs text-zinc-400">
              View our public schedule
            </p>
          </div>

          <ArrowUpRight className="size-5 shrink-0 text-amber-400 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
        </Link>

        {/* USER PROFILE */}

        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <Avatar className="size-10 shrink-0 border border-amber-400/30">
            <AvatarFallback className="bg-amber-400/10 text-sm font-bold text-amber-400">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>

            <div className="mt-1 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />

              <p className="text-xs capitalize text-zinc-500">{role}</p>
            </div>
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

        <p className="text-center text-[10px] tracking-wide text-zinc-600">
          Freedom Dance Studio © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
