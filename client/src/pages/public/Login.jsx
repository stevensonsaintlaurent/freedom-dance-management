import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  LockKeyhole,
  UserRound,
  Sparkles,
  Eye,
  EyeOff,
  Mail,
  Loader2,
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const user = await signIn(email, password);

      const destination = location.state?.from;

      const roleRoutes = {
        dancer: "/dashboard",
        instructor: "/instructor/classes",
        manager: "/manager",
        admin: "/admin",
      };

      const fallback = roleRoutes[user.role] || "/dashboard";

      const safeDestination =
        typeof destination === "string" &&
        destination.startsWith("/") &&
        !destination.startsWith("//") &&
        !destination.startsWith("/\\")
          ? destination
          : fallback;

      navigate(safeDestination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
              One place to manage your classes, bookings, memberships, and
              everything happening at Freedom Dance Studio.
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
                Sign in to access your Freedom Dance Studio dashboard.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleLogin} className="space-y-6">
                {/* EMAIL */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-zinc-200"
                  >
                    Email Address
                  </Label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-12 border-white/10 bg-zinc-950/70 pl-10 text-white placeholder:text-zinc-600 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-zinc-200"
                  >
                    Password
                  </Label>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />

                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-12 border-white/10 bg-zinc-950/70 pl-10 pr-12 text-white placeholder:text-zinc-600 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-amber-400"
                    >
                      {showPassword ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                  >
                    {error}
                  </div>
                )}

                {/* LOGIN BUTTON */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 font-bold text-zinc-950 shadow-lg shadow-amber-500/10 transition-all hover:from-amber-200 hover:to-amber-400"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
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
