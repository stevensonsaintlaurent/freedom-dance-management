import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Page({ title, description, items = [], links = [] }) {
  return (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-zinc-950 px-4 py-12 text-white sm:px-6 lg:px-10 lg:py-16">
      {/* BACKGROUND EFFECTS */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 size-96 rounded-full bg-amber-500/10 blur-[110px]" />

        <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-amber-500/5 blur-[110px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_0%,#09090b_85%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* PAGE HEADER */}
        <div className="mb-12 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2">
            <Sparkles className="size-4 text-amber-400" />

            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Freedom Dance Studio
            </span>
          </div>

          <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {description && (
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              {description}
            </p>
          )}

          <div className="mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-amber-300 to-amber-600" />
        </div>

        {/* FEATURE CARDS */}
        {items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <Card
                key={`${item}-${index}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 text-white shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/40 hover:bg-zinc-900 hover:shadow-xl hover:shadow-amber-500/5"
              >
                {/* Decorative gradient */}
                <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-amber-400/5 blur-3xl transition-colors group-hover:bg-amber-400/10" />

                <CardContent className="relative flex h-full min-h-52 flex-col justify-between p-6">
                  <div>
                    <div className="mb-8 flex items-start justify-between">
                      <div className="flex size-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                        <span className="text-lg font-black text-amber-400">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <ArrowUpRight className="size-5 text-zinc-600 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-amber-400" />
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-white">
                      {item}
                    </h3>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-sm text-zinc-500">
                    <CheckCircle2 className="size-4 text-amber-400/70" />
                    <span>Ready for database integration</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ACTION BUTTONS */}
        {links.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {links.map(([label, to], index) => (
              <Button
                key={`${to}-${index}`}
                asChild
                variant={index === 0 ? "default" : "outline"}
                className={
                  index === 0
                    ? "h-12 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 font-bold text-zinc-950 shadow-lg shadow-amber-500/10 hover:from-amber-200 hover:to-amber-400"
                    : "h-12 rounded-xl border-white/20 bg-transparent px-6 font-semibold text-white hover:border-amber-400/40 hover:bg-white/5 hover:text-amber-400"
                }
              >
                <Link to={to}>
                  {label}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-20 border-t border-white/10 pt-6">
          <p className="text-xs tracking-wider text-zinc-600">
            FREEDOM DANCE STUDIO · DANCE. CONNECT. BELONG.
          </p>
        </div>
      </div>
    </section>
  );
}
