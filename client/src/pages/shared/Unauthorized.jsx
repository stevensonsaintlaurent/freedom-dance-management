import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
          <ShieldAlert className="size-10 text-amber-400" />
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
          Access Restricted
        </p>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Permission Denied
        </h1>

        <p className="mt-4 text-sm leading-7 text-zinc-400">
          You don't have permission to access this page. Please contact Freedom
          Dance Studio management if you believe this is a mistake.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back Home
            </Link>
          </Button>

          <Button
            asChild
            className="bg-amber-400 font-bold text-zinc-950 hover:bg-amber-300"
          >
            <Link to="/dashboard">
              <LayoutDashboard className="size-4" />
              My Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
