import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  UserRound,
  CalendarDays,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useAuth } from "../auth/AuthContext";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Classes", to: "/classes" },
  { label: "Events", to: "/events" },
  { label: "Checkout", to: "/checkout" },
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();

      setMobileOpen(false);

      navigate("/login", { replace: true });
      console.log("sign out success");
    } catch (error) {
      console.error("Unable to sign out:", error);
      alert("Unable to sign out. Please try again.");
    }
  };

  const getInitials = () => {
    const name = user?.name || user?.firstName || user?.email || "FD";

    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const linkClass = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-medium
     transition-colors duration-300
     ${isActive ? "text-amber-400" : "text-zinc-400 hover:text-white"}`;

  return (
    <header
      className="
        sticky top-0 z-50 w-full
        border-b border-amber-500/15
        bg-zinc-950/95
        text-white
        shadow-lg shadow-black/10
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto flex h-20 max-w-7xl
          items-center justify-between
          gap-6 px-4 sm:px-6 lg:px-8
        "
      >
        {/* BRAND */}
        <Link to="/" className="group flex shrink-0 items-center gap-3">
          <div
            className="
              flex size-11 items-center justify-center
              rounded-xl border border-amber-500/40
              bg-amber-500/10
              text-2xl font-black text-amber-400
              transition-all duration-300
              group-hover:border-amber-400
              group-hover:bg-amber-500/20
            "
          >
            F
          </div>

          <div className="flex flex-col">
            <span
              className="
                text-sm font-black tracking-wider
                text-white sm:text-base
              "
            >
              FREEDOM <span className="text-amber-400">DANCE</span>
            </span>

            <span
              className="
                text-[10px] font-semibold
                tracking-[0.45em] text-zinc-400
              "
            >
              STUDIO
            </span>
          </div>
        </Link>

        {/* DESKTOP LINKS */}
        <nav
          className="hidden items-center gap-2 lg:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={linkClass}
            >
              {({ isActive }) => (
                <span className="relative">
                  {link.label}

                  {isActive && (
                    <span
                      className="
                        absolute -bottom-2 left-0
                        h-0.5 w-full
                        rounded-full bg-amber-400
                      "
                    />
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* DESKTOP ACTIONS */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Button
                asChild
                variant="ghost"
                className="
                  text-zinc-300
                  hover:bg-amber-500/10
                  hover:text-amber-400
                "
              >
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="
                      flex items-center gap-2
                      rounded-full px-2
                      text-white
                      hover:bg-white/10
                      hover:text-white
                    "
                  >
                    <Avatar className="size-9 border border-amber-500/30">
                      <AvatarFallback className="bg-amber-500/15 text-amber-400">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>

                    <ChevronDown className="size-4 text-zinc-400" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      My Account
                      <p className="mt-1 truncate text-xs font-normal text-muted-foreground">
                        {user.email}
                      </p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">
                        <LayoutDashboard className="mr-2 size-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <UserRound className="mr-2 size-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-500 focus:text-red-500"
                    >
                      <LogOut className="mr-2 size-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <Link to="/login">Sign In</Link>
              </Button>

              <Button
                asChild
                className="
                  rounded-lg border-0
                  bg-gradient-to-r
                  from-amber-300 to-amber-500
                  font-bold text-zinc-950
                  shadow-lg shadow-amber-500/10
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:from-amber-200
                  hover:to-amber-400
                "
              >
                <Link to="/register">
                  Join Freedom
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* MOBILE MENU */}
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation menu"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="
                w-[300px] border-amber-500/20
                bg-zinc-950 text-white
                sm:w-[360px]
              "
            >
              <SheetHeader className="border-b border-white/10 pb-5">
                <SheetTitle className="text-left text-lg font-black text-white">
                  FREEDOM <span className="text-amber-400">DANCE</span>
                </SheetTitle>
              </SheetHeader>

              <nav
                className="flex flex-col gap-2 px-4 py-6"
                aria-label="Mobile navigation"
              >
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-amber-500/10 text-amber-400"
                          : "text-zinc-300 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mx-4 border-t border-white/10 pt-6">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <div className="mb-2 flex items-center gap-3">
                      <Avatar className="border border-amber-500/30">
                        <AvatarFallback className="bg-amber-500/15 text-amber-400">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {user.name || user.firstName || "Dancer"}
                        </p>
                        <p className="truncate text-xs text-zinc-400">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      className="bg-amber-400 text-zinc-950 hover:bg-amber-300"
                    >
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileOpen(false)}
                      >
                        <LayoutDashboard className="size-4" />
                        My Dashboard
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                      <Link to="/profile" onClick={() => setMobileOpen(false)}>
                        <UserRound className="size-4" />
                        My Profile
                      </Link>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <LogOut className="size-4" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button
                      asChild
                      variant="outline"
                      className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        Sign In
                      </Link>
                    </Button>

                    <Button
                      asChild
                      className="bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300"
                    >
                      <Link to="/register" onClick={() => setMobileOpen(false)}>
                        Join Freedom
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-auto px-6 pb-6">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <CalendarDays className="size-4" />
                  Dance. Connect. Belong.
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
