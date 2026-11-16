
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  LockKeyhole,
  UserRound,
  GraduationCap,
  ShieldCheck,
  BriefcaseBusiness,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useAuth } from "../../auth/AuthContext";

const roles = [
  {
    value: "dancer",
    label: "Dancer",
    icon: UserRound,
    description: "Classes & memberships",
  },
  {
    value: "instructor",
    label: "Instructor",
    icon: GraduationCap,
    description: "Teaching & attendance",
  },
  {
    value: "manager",
    label: "Manager",
    icon: BriefcaseBusiness,
    description: "Bookings & events",
  },
  {
    value: "admin",
    label: "Admin",
    icon: ShieldCheck,
    description: "Full studio access",
  },
];

export default function Login() {
  const [role, setRole] = useState("dancer");
  const [name, setName] = useState("Demo User");
  const [showInfo, setShowInfo] = useState(false);

  const { demoSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (e) => {
    e.preventDefault();

    demoSignIn(role, name.trim() || "Demo User");

    const destination = location.state?.from;
    navigate(
      typeof destination === "string" &&
        destination.startsWith("/") &&
        !destination.startsWith("//")
        ? destination
        : "/dashboard",
      { replace: true }
    );
  };

  return (
    <main className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12 text-white sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 size-[450px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 size-[450px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#09090b_85%)]" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 shadow-2xl shadow-black/40 lg:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="relative hidden min-h-[650px] flex-col justify-between overflow-hidden bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950 p-10 lg:flex">
          <div className="pointer-events-none absolute -right-32 top-1/3 size-80 rounded-full border border-amber-400/10" />
          <div className="pointer-events-none absolute -right-20 top-1/3 size-60 rounded-full border border-amber-400/20" />

          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10 text-2xl font-black text-amber-400">
                F
              </div>

              <div>
                <p className="font-black tracking-widest">
                  FREEDOM <span className="text-amber-400">DANCE</span>
                </p>
                <p className="text-[10px] tracking-[0.45em] text-zinc-400">
                  STUDIO
                </p>
              </div>
            </Link>
          </div>

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-400">
              <Sparkles className="size-4" />
              Your Dance Journey Starts Here
            </div>

            <h1 className="text-5xl font-black leading-[1.1] tracking-tight">
              Move with
              <br />
              <span className="text-amber-400">Freedom.</span>
            </h1>

            <p className="max-w-sm text-base leading-7 text-zinc-400">
              One place to manage your classes, bookings,
              memberships, and everything happening at
              Freedom Dance Studio.
            </p>

            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <div className="flex size-9 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
                <LockKeyhole className="size-4" />
              </div>
              Your personal studio workspace
            </div>
          </div>

          <p className="relative text-xs tracking-wider text-zinc-500">
            DANCE. CONNECT. BELONG.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center p-5 sm:p-10">
          <Card className="w-full max-w-md border-0 bg-transparent text-white shadow-none">
            <CardHeader className="space-y-3 px-0">
              <div className="mb-2 flex size-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
                <LockKeyhole className="size-6" />
              </div>

              <CardTitle className="text-3xl font-black tracking-tight text-white">
                Welcome back
              </CardTitle>

              <CardDescription className="text-sm leading-6 text-zinc-400">
                Sign in to access your Freedom Dance Studio
                dashboard.
              </CardDescription>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-200">
                <strong>Development preview:</strong> This page
                uses demo access. No password is required, and
                selecting a role does not authenticate a real user.
              </div>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleLogin} className="space-y-6">
                {/* NAME */}
                <div className="space-y-2">
                  <Label
                    htmlFor="displayName"
                    className="text-sm font-medium text-zinc-200"
                  >
                    Display Name
                  </Label>

                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

                    <Input
                      id="displayName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      className="h-12 border-white/10 bg-zinc-950/70 pl-10 text-white placeholder:text-zinc-600 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
                    />
                  </div>
                </div>

                {/* ROLE SELECTION */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-zinc-200">
                    Preview Dashboard As
                  </Label>

                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((item) => {
                      const Icon = item.icon;
                      const active = role === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setRole(item.value)}
                          aria-pressed={active}
                          className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                            active
                              ? "border-amber-400/60 bg-amber-400/10 ring-1 ring-amber-400/20"
                              : "border-white/10 bg-zinc-950/40 hover:border-white/25 hover:bg-white/5"
                          }`}
                        >
                          <Icon
                            className={`mb-3 size-5 ${
                              active
                                ? "text-amber-400"
                                : "text-zinc-500"
                            }`}
                          />

                          <p
                            className={`text-sm font-semibold ${
                              active
                                ? "text-amber-400"
                                : "text-white"
                            }`}
                          >
                            {item.label}
                          </p>

                          <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                            {item.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DEMO BUTTON */}
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 font-bold text-zinc-950 shadow-lg shadow-amber-500/10 transition-all hover:from-amber-200 hover:to-amber-400"
                >
                  Enter Demo Dashboard
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </form>

              <div className="mt-7 space-y-4 text-center">
                <p className="text-sm text-zinc-400">
                  New to Freedom Dance Studio?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-amber-400 transition-colors hover:text-amber-300"
                  >
                    Create an account
                  </Link>
                </p>

                <Link
                  to="/forgot-password"
                  className="inline-block text-xs text-zinc-500 transition-colors hover:text-amber-400"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6 text-center">
                <p className="text-xs text-zinc-600">
                  © {new Date().getFullYear()} Freedom Dance Studio
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
