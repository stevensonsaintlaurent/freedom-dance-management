import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Home,
  Music2,
  CalendarDays,
  Building2,
  PartyPopper,
  ChevronDown,
  Users,
  CalendarCheck,
  Camera,
} from "lucide-react";

// ==========================================
// PUBLIC NAVIGATION
// ==========================================

const mainLinks = [
  {
    id: "home",
    label: "Home",
    to: "/",
    icon: Home,
  },
  {
    id: "events",
    label: "Events",
    to: "/events",
    icon: PartyPopper,
  },
  {
    id: "gallery",
    label: "Gallery",
    to: "/gallery",
    icon: Camera,
  },
  {
    id: "rental",
    label: "Studio Rental",
    to: "/rental",
    icon: Building2,
  },
];

const classLinks = [
  {
    id: "freedom-classes",
    label: "Freedom Classes",
    description: "Classes taught by Freedom instructors",
    to: "/classes",
    icon: Music2,
  },
  {
    id: "independent-classes",
    label: "Independent Instructors",
    description: "Classes hosted by independent instructors",
    to: "/independent",
    icon: Users,
  },
];

const additionalLinks = [
  {
    id: "schedule",
    label: "Class Schedule",
    to: "/schedule",
    icon: CalendarDays,
  },
  {
    id: "booking",
    label: "Book a Class",
    to: "/schedule",
    icon: CalendarCheck,
  },
];

// ==========================================
// COMPONENT
// ==========================================

export default function NavLinks({
  mobileMenu = false,
  onNavigate = () => {},
}) {
  const location = useLocation();
  const [classesOpen, setClassesOpen] = useState(false);

  const isClassesActive = classLinks.some(
    (link) => location.pathname === link.to,
  );

  const linkStyles = ({ isActive }) =>
    mobileMenu
      ? `flex w-full items-center gap-3 rounded-xl px-4 py-3
         text-sm font-semibold transition-colors
         ${
           isActive
             ? "bg-amber-500/15 text-amber-400"
             : "text-zinc-300 hover:bg-white/5 hover:text-white"
         }`
      : `inline-flex shrink-0 items-center gap-1.5
         whitespace-nowrap rounded-lg px-2 py-2
         text-sm font-medium transition-colors xl:px-3
         ${
           isActive
             ? "bg-amber-500/10 text-amber-400"
             : "text-zinc-300 hover:bg-white/5 hover:text-white"
         }`;

  const handleNavigate = () => {
    setClassesOpen(false);
    onNavigate();
  };

  // ==========================================
  // MOBILE LINKS
  // ==========================================

  if (mobileMenu) {
    return (
      <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
        {mainLinks.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.id}
              to={link.to}
              end={link.to === "/"}
              onClick={handleNavigate}
              className={linkStyles}
            >
              <Icon className="size-5" />
              {link.label}
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setClassesOpen((open) => !open)}
          aria-expanded={classesOpen}
          aria-controls="mobile-class-links"
          className={`flex w-full items-center justify-between
            rounded-xl px-4 py-3 text-sm font-semibold
            transition-colors ${
              isClassesActive
                ? "bg-amber-500/15 text-amber-400"
                : "text-zinc-300 hover:bg-white/5 hover:text-white"
            }`}
        >
          <span className="flex items-center gap-3">
            <Music2 className="size-5" />
            Classes
          </span>

          <ChevronDown
            className={`size-4 transition-transform ${
              classesOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {classesOpen && (
          <div
            id="mobile-class-links"
            className="ml-5 space-y-1 border-l border-white/10 pl-3"
          >
            {classLinks.map((link) => {
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.id}
                  to={link.to}
                  onClick={handleNavigate}
                  className={linkStyles}
                >
                  <Icon className="size-4 shrink-0" />

                  <span>
                    <span className="block">{link.label}</span>

                    <span className="block text-xs font-normal text-zinc-500">
                      {link.description}
                    </span>
                  </span>
                </NavLink>
              );
            })}
          </div>
        )}

        <div className="my-2 border-t border-white/10" />

        {additionalLinks.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.id}
              to={link.to}
              onClick={handleNavigate}
              className={linkStyles}
            >
              <Icon className="size-5" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    );
  }

  // ==========================================
  // DESKTOP LINKS
  // ==========================================

  return (
    <nav
      aria-label="Main navigation"
      className="hidden items-center gap-0.5 lg:flex xl:gap-1"
    >
      {mainLinks.map((link) => {
        const Icon = link.icon;

        return (
          <NavLink
            key={link.id}
            to={link.to}
            end={link.to === "/"}
            className={linkStyles}
          >
            <Icon className="hidden size-4 shrink-0 xl:block" />
            {link.label}
          </NavLink>
        );
      })}

      {/* CLASSES DROPDOWN */}

      <div className="group relative shrink-0">
        <button
          type="button"
          aria-haspopup="true"
          className={`inline-flex items-center gap-1.5
            whitespace-nowrap rounded-lg px-2 py-2
            text-sm font-medium transition-colors xl:px-3
            ${
              isClassesActive
                ? "bg-amber-500/10 text-amber-400"
                : "text-zinc-300 hover:bg-white/5 hover:text-white"
            }`}
        >
          <Music2 className="hidden size-4 xl:block" />
          Classes
          <ChevronDown className="size-4 transition-transform group-hover:rotate-180" />
        </button>

        <div
          className="invisible absolute right-0 top-full z-50
            w-72 pt-3 opacity-0 transition-all
            group-hover:visible group-hover:opacity-100
            group-focus-within:visible group-focus-within:opacity-100"
        >
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-2xl">
            {classLinks.map((link) => {
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.id}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-start gap-3 rounded-lg px-3 py-3 transition-colors ${
                      isActive
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-zinc-200 hover:bg-white/5"
                    }`
                  }
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-amber-400" />

                  <span>
                    <span className="block text-sm font-semibold">
                      {link.label}
                    </span>

                    <span className="mt-1 block text-xs text-zinc-500">
                      {link.description}
                    </span>
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* WEEKLY SCHEDULE */}

      <NavLink to="/schedule" className={linkStyles}>
        <CalendarDays className="hidden size-4 xl:block" />
        Schedule
      </NavLink>
    </nav>
  );
}
