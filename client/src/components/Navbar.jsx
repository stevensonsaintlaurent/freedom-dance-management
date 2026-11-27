import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  Menu,
  X,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  UserRound,
  ChevronDown,
  LogIn,
  UserPlus,
  Music2,
  Users,
  CalendarDays,
  ClipboardList,
} from "lucide-react";

import NavLinks from "./NavLinks";
import NotificationBell from "./notifications/NotificationBell";
import { useAuth } from "../auth/AuthContext";

// ==========================================
// NAVBAR
// ==========================================

export default function Navbar() {
  const { user, signOut } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // ==========================================
  // USER ROLE
  // ==========================================

  const role = String(user?.role || "").toUpperCase();

  const isManager = role === "MANAGER" || role === "ADMIN";

  const isInstructor = role === "INSTRUCTOR";

  const dashboardPath = "/dashboard";

  // ==========================================
  // CLOSE MENUS ON NAVIGATION
  // ==========================================

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // ==========================================
  // SIGN OUT
  // ==========================================

  const handleSignOut = async () => {
    try {
      await signOut();

      setMobileOpen(false);
      setAccountOpen(false);

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Sign out failed:", error);
      alert("Unable to sign out. Please try again.");
    }
  };

  // ==========================================
  // USER INITIALS
  // ==========================================

  const getInitials = () => {
    if (!user) return "FD";

    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.name ||
      user.email ||
      "FD";

    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // ==========================================
  // DASHBOARD LINKS
  // ==========================================

  const dashboardLinks = [
    {
      id: "dashboard",
      label: "My Dashboard",
      to: dashboardPath,
      icon: LayoutDashboard,
    },
    {
      id: "profile",
      label: "My Profile",
      to: "/profile",
      icon: UserRound,
    },
  ];

  if (isManager) {
    dashboardLinks.push(
      {
        id: "staff",
        label: "Staff Management",
        to: role === "ADMIN" ? "/admin/staff" : "/manager/staff",
        icon: Users,
      },
      {
        id: "weekly-classes",
        label: "Weekly Classes",
        to: "/manager/weekly-classes",
        icon: CalendarDays,
      },
      {
        id: "bookings",
        label: "Bookings",
        to: role === "ADMIN" ? "/admin/bookings" : "/manager/bookings",
        icon: ClipboardList,
      },
    );
  }

  if (isInstructor) {
    dashboardLinks.push({
      id: "my-classes",
      label: "My Classes",
      to: "/instructor/classes",
      icon: Music2,
    });
  }

  // ==========================================
  // SHARED STYLES
  // ==========================================

  const goldButton =
    "inline-flex items-center justify-center gap-2 " +
    "rounded-xl bg-amber-400 px-4 py-2.5 " +
    "text-sm font-bold text-zinc-950 " +
    "transition-all hover:bg-amber-300 " +
    "focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-amber-400";

  const menuLink =
    "flex w-full items-center gap-3 rounded-lg " +
    "px-3 py-2.5 text-sm font-medium " +
    "text-zinc-300 transition-colors " +
    "hover:bg-white/5 hover:text-white";

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <header
      className="
        sticky top-0 z-50 w-full
        border-b border-amber-500/15
        bg-zinc-950/95 text-white
        shadow-lg shadow-black/10
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto flex h-20 max-w-7xl
          items-center justify-between
          gap-4 px-4 sm:px-6 lg:px-8
        "
      >
        {/* ======================================
            BRAND
        ====================================== */}

        <Link to="/" className="group flex shrink-0 items-center gap-3">
          <div
            className="
              flex size-11 items-center justify-center
              rounded-xl border border-amber-500/40
              bg-amber-500/10 text-2xl font-black
              text-amber-400 transition-colors
              group-hover:bg-amber-500/20
            "
          >
            F
          </div>

          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-black tracking-wider sm:text-base">
              FREEDOM <span className="text-amber-400">DANCE</span>
            </span>

            <span className="text-[10px] font-semibold tracking-[0.4em] text-zinc-400">
              STUDIO
            </span>
          </div>
        </Link>

        {/* ======================================
            DESKTOP NAVIGATION
        ====================================== */}

        <NavLinks />

        {/* ======================================
            DESKTOP ACTIONS
        ====================================== */}

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Link to="/schedule" className={goldButton}>
            <CalendarCheck className="size-4" />
            Book a Class
          </Link>

          {user && <NotificationBell />}
          {user ? (
            <div className="group relative">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-label="Open account menu"
                aria-expanded={accountOpen}
                className="
                  flex items-center gap-2 rounded-full
                  border border-white/10 px-2 py-1
                  transition-colors hover:bg-white/10
                "
              >
                <span
                  className="
                    flex size-9 items-center justify-center
                    rounded-full bg-amber-500/15
                    text-sm font-bold text-amber-400
                  "
                >
                  {getInitials()}
                </span>

                <ChevronDown className="size-4 text-zinc-400" />
              </button>

              {accountOpen && (
                <div
                  className="
                    absolute right-0 top-full z-50
                    w-64 pt-3
                  "
                >
                  <div className="rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-2xl">
                    <div className="border-b border-white/10 px-3 py-3">
                      <p className="text-sm font-semibold text-white">
                        {[user.firstName, user.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                          user.name ||
                          "My Account"}
                      </p>

                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-2">
                      {dashboardLinks.map((link) => {
                        const Icon = link.icon;

                        return (
                          <Link
                            key={link.id}
                            to={link.to}
                            onClick={() => setAccountOpen(false)}
                            className={menuLink}
                          >
                            <Icon className="size-4 text-amber-400" />
                            {link.label}
                          </Link>
                        );
                      })}
                    </div>

                    <div className="border-t border-white/10 pt-2">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="
                          flex w-full items-center gap-3
                          rounded-lg px-3 py-2.5
                          text-left text-sm font-medium
                          text-red-400 transition-colors
                          hover:bg-red-500/10
                        "
                      >
                        <LogOut className="size-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="
                  inline-flex items-center gap-2
                  rounded-lg px-3 py-2
                  text-sm font-medium text-zinc-300
                  transition-colors
                  hover:bg-white/5 hover:text-white
                "
              >
                <LogIn className="size-4" />
                Sign In
              </Link>

              <Link
                to="/register"
                className="
                  inline-flex items-center gap-2
                  rounded-lg border border-amber-500/30
                  px-3 py-2 text-sm font-medium
                  text-amber-400 transition-colors
                  hover:bg-amber-500/10
                "
              >
                <UserPlus className="size-4" />
                Register
              </Link>
            </>
          )}
        </div>

        {/* ======================================
            MOBILE MENU BUTTON
        ====================================== */}

        <div className="flex items-center gap-2 lg:hidden">
          {user && <NotificationBell />}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={
              mobileOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
            className="
            inline-flex size-10 items-center
            justify-center rounded-lg
            text-white transition-colors
            hover:bg-white/10 lg:hidden
          "
          >
            {mobileOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>
      </div>

      {/* ======================================
          MOBILE NAVIGATION
      ====================================== */}

      {mobileOpen && (
        <div
          className="
            max-h-[calc(100dvh-80px)]
            overflow-y-auto border-t
            border-white/10 bg-zinc-950
            px-4 py-5 lg:hidden
          "
        >
          <div className="mx-auto max-w-xl space-y-4">
            <NavLinks mobileMenu onNavigate={() => setMobileOpen(false)} />

            <div className="border-t border-white/10 pt-4">
              <Link
                to="/schedule"
                onClick={() => setMobileOpen(false)}
                className={`${goldButton} w-full`}
              >
                <CalendarCheck className="size-4" />
                Book Your First Class
              </Link>
            </div>

            {user ? (
              <div className="space-y-1 border-t border-white/10 pt-4">
                <div className="px-3 pb-3">
                  <p className="text-sm font-semibold text-white">
                    {[user.firstName, user.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                      user.name ||
                      "My Account"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">{user.email}</p>
                </div>

                {dashboardLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.id}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={menuLink}
                    >
                      <Icon className="size-4 text-amber-400" />
                      {link.label}
                    </Link>
                  );
                })}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="
                    flex w-full items-center gap-3
                    rounded-lg px-3 py-2.5
                    text-left text-sm font-medium
                    text-red-400 transition-colors
                    hover:bg-red-500/10
                  "
                >
                  <LogOut className="size-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="
                    flex items-center justify-center
                    gap-2 rounded-lg border
                    border-white/10 px-3 py-3
                    text-sm font-medium text-white
                    transition-colors hover:bg-white/5
                  "
                >
                  <LogIn className="size-4" />
                  Sign In
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="
                    flex items-center justify-center
                    gap-2 rounded-lg border
                    border-amber-500/30 px-3 py-3
                    text-sm font-medium text-amber-400
                    transition-colors
                    hover:bg-amber-500/10
                  "
                >
                  <UserPlus className="size-4" />
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
