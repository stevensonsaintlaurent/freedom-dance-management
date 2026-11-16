
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  ArrowRight,
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  Heart,
  ShieldCheck,
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
import { Checkbox } from "@/components/ui/checkbox";

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "First name must have at least 2 characters"),
    lastName: z.string().trim().min(2, "Last name must have at least 2 characters"),
    email: z.email("Enter a valid email address"),
    phone: z.string().trim().optional(),
    password: z
      .string()
      .min(8, "Password must have at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
    emailNotifications: z.boolean(),
    smsNotifications: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const benefits = [
  {
    icon: CalendarDays,
    title: "Book Dance Classes",
    description: "Discover and manage your favorite classes.",
  },
  {
    icon: Heart,
    title: "Join Our Community",
    description: "Stay connected with dancers and events.",
  },
  {
    icon: ShieldCheck,
    title: "Manage Memberships",
    description: "Keep your dance journey organized.",
  },
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      emailNotifications: true,
      smsNotifications: false,
    },
  });

  const emailNotifications = watch("emailNotifications");
  const smsNotifications = watch("smsNotifications");

  const onSubmit = async () => {
    // Frontend preview only.
    // Later we'll send the registration data to our Express API.
    setPreviewSubmitted(true);
  };

  if (previewSubmitted) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-zinc-950 px-4 py-12 text-white">
        <Card className="w-full max-w-md border border-white/10 bg-zinc-900 p-4 text-center text-white">
          <CardContent className="space-y-5 py-8">
            <CheckCircle2 className="mx-auto size-16 text-amber-400" />
            <h1 className="text-2xl font-black">
              Form validated!
            </h1>
            <p className="text-sm leading-6 text-zinc-400">
              Your registration details passed frontend validation.
              No account has been created yet. We'll enable
              secure registration when the backend is ready.
            </p>
            <Button
              asChild
              className="w-full bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300"
            >
              <Link to="/login">Return to Demo Login</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-zinc-950 px-4 py-12 text-white sm:px-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 size-96 rounded-full bg-amber-500/10 blur-[110px]" />
        <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-amber-500/5 blur-[110px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/80 shadow-2xl lg:grid-cols-[0.85fr_1.15fr]">
        {/* LEFT PANEL */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950 p-10 lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10 text-2xl font-black text-amber-400">
              F
            </div>
            <div>
              <p className="font-black tracking-wider text-white">
                FREEDOM <span className="text-amber-400">DANCE</span>
              </p>
              <p className="text-[10px] tracking-[0.45em] text-zinc-400">
                STUDIO
              </p>
            </div>
          </Link>

          <div className="my-16 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-400">
              <Sparkles className="size-4" />
              Become Part of Freedom
            </div>

            <div>
              <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
                Your journey
                <br />
                starts with
                <br />
                <span className="text-amber-400">one step.</span>
              </h1>
              <p className="mt-5 max-w-sm leading-7 text-zinc-400">
                Join the Freedom Dance Studio community and
                discover a world of movement, connection, and
                unforgettable experiences.
              </p>
            </div>

            <div className="space-y-6">
              {benefits.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs tracking-widest text-zinc-500">
            DANCE. CONNECT. BELONG.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-5 sm:p-8 lg:p-12">
          <Card className="border-0 bg-transparent text-white shadow-none">
            <CardHeader className="space-y-3 px-0">
              <Link
                to="/"
                className="mb-3 inline-flex w-fit items-center gap-2 text-xs text-zinc-400 transition-colors hover:text-amber-400"
              >
                <ArrowLeft className="size-4" />
                Back to Home
              </Link>

              <div className="flex size-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
                <UserRound className="size-6" />
              </div>

              <CardTitle className="text-3xl font-black tracking-tight text-white">
                Create your account
              </CardTitle>

              <CardDescription className="text-sm leading-6 text-zinc-400">
                Join Freedom Dance Studio as a dancer.
              </CardDescription>

              <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-200">
                Development preview: this form validates your
                information but does not create an account yet.
              </div>
            </CardHeader>

            <CardContent className="px-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* NAME FIELDS */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-zinc-200">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      autoComplete="given-name"
                      {...register("firstName")}
                      className="h-12 border-white/10 bg-zinc-950/70 text-white placeholder:text-zinc-600"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-400">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-zinc-200">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      autoComplete="family-name"
                      {...register("lastName")}
                      className="h-12 border-white/10 bg-zinc-950/70 text-white placeholder:text-zinc-600"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-400">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-200">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...register("email")}
                      className="h-12 border-white/10 bg-zinc-950/70 pl-10 text-white placeholder:text-zinc-600"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* PHONE */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-200">
                    Phone Number
                    <span className="ml-2 text-xs text-zinc-500">
                      Optional
                    </span>
                  </Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (702) 555-0123"
                      autoComplete="tel"
                      {...register("phone")}
                      className="h-12 border-white/10 bg-zinc-950/70 pl-10 text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-200">
                    Password
                  </Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      {...register("password")}
                      className="h-12 border-white/10 bg-zinc-950/70 pl-10 pr-11 text-white placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-400"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    At least 8 characters, one uppercase letter, and one number.
                  </p>
                  {errors.password && (
                    <p className="text-xs text-red-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-zinc-200">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      {...register("confirmPassword")}
                      className="h-12 border-white/10 bg-zinc-950/70 pl-10 pr-11 text-white placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-400">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* NOTIFICATION PREFERENCES */}
                <div className="space-y-4 rounded-xl border border-white/10 bg-zinc-950/40 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Notification Preferences
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Choose how you would like to hear from us.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="emailNotifications"
                      checked={emailNotifications}
                      onCheckedChange={(checked) =>
                        setValue("emailNotifications", checked === true)
                      }
                    />
                    <Label
                      htmlFor="emailNotifications"
                      className="cursor-pointer text-sm leading-5 text-zinc-300"
                    >
                      Send me class updates, events, and special offers by email.
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="smsNotifications"
                      checked={smsNotifications}
                      onCheckedChange={(checked) =>
                        setValue("smsNotifications", checked === true)
                      }
                    />
                    <Label
                      htmlFor="smsNotifications"
                      className="cursor-pointer text-sm leading-5 text-zinc-300"
                    >
                      Send me reminders and updates by SMS.
                    </Label>
                  </div>
                </div>

                {/* SUBMIT */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 font-bold text-zinc-950 hover:from-amber-200 hover:to-amber-400"
                >
                  Validate Registration
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </form>

              <p className="mt-7 text-center text-sm text-zinc-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-amber-400 hover:text-amber-300"
                >
                  Sign In
                </Link>
              </p>

              <p className="mt-6 text-center text-xs text-zinc-600">
                © {new Date().getFullYear()} Freedom Dance Studio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
