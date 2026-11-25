import { useEffect, useMemo, useState } from "react";

import {
  Building2,
  DollarSign,
  Calculator,
  Clock,
  Users,
  ShieldCheck,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  Layers,
  DoorOpen,
  Receipt,
  Info,
} from "lucide-react";

import api from "@/api/axios";

const GOLD = "text-[#d4af37]";

const panel = "rounded-2xl border border-zinc-800 bg-zinc-900/60";

const field =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-[#d4af37]";

const scopeLabels = {
  SINGLE_ROOM: "Single Room",
  ENTIRE_STUDIO: "Entire Studio",
  LARGE_GROUP: "Large Group",
};

const dayLabels = {
  EVERY_DAY: "Every day",
  WEEKDAY: "Weekdays",
  WEEKEND: "Weekends",
};

const scopeIcons = {
  SINGLE_ROOM: DoorOpen,
  ENTIRE_STUDIO: Building2,
  LARGE_GROUP: Users,
};

const money = (cents) =>
  cents == null
    ? "Custom quote"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(cents / 100);

const formatTime = (minutes) => {
  if (minutes === 1440) return "12:00 AM (next day)";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours % 12 || 12}:${String(mins).padStart(
    2,
    "0",
  )} ${hours >= 12 ? "PM" : "AM"}`;
};

const timeRange = (rule) =>
  `${formatTime(rule.startTimeMinutes)} – ${formatTime(rule.endTimeMinutes)}`;

// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({ icon: Icon, label, value, detail }) => (
  <div className={`${panel} p-5`}>
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/10">
      <Icon size={23} className={GOLD} />
    </div>

    <p className="text-sm text-zinc-400">{label}</p>

    <h3 className="mt-2 text-3xl font-bold">{value}</h3>

    <p className="mt-2 text-xs text-zinc-500">{detail}</p>
  </div>
);

// ==========================================
// STATUS
// ==========================================

const Status = ({ active }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${
      active
        ? "bg-emerald-500/10 text-emerald-400"
        : "bg-red-500/10 text-red-400"
    }`}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

// ==========================================
// PRICING RULE CARD
// ==========================================

const PricingCard = ({ rule }) => {
  const Icon = scopeIcons[rule.scope] || DollarSign;

  return (
    <article className={`${panel} flex flex-col p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-xl bg-[#d4af37]/10 p-3">
          <Icon size={24} className={GOLD} />
        </div>

        <Status active={rule.isActive} />
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-[#d4af37]">
        {scopeLabels[rule.scope]}
      </p>

      <h3 className="mt-2 text-lg font-bold">{rule.name}</h3>

      <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
        {rule.description || "Standard studio rental pricing."}
      </p>

      <div className="my-5 rounded-xl border border-zinc-800 bg-black/30 p-4">
        <p className="text-xs text-zinc-400">Hourly rate</p>

        <p className="mt-2 text-2xl font-bold text-[#d4af37]">
          {rule.requiresQuote ? "Custom quote" : money(rule.hourlyRateCents)}

          {!rule.requiresQuote && rule.hourlyRateCents != null && (
            <span className="text-sm font-normal text-zinc-500">/hr</span>
          )}
        </p>

        <p className="mt-3 text-sm text-zinc-400">{dayLabels[rule.dayType]}</p>

        <p className="mt-1 text-xs text-zinc-500">{timeRange(rule)}</p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-zinc-400">Minimum rental</span>
          <span>{rule.minimumMinutes} min</span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-zinc-400">Billing increment</span>
          <span>{rule.billingIncrementMinutes} min</span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-zinc-400">Cleaning fee</span>
          <span>{money(rule.cleaningFeeCents)}</span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-zinc-400">Deposit</span>
          <span>{rule.depositBasisPoints / 100}%</span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-zinc-400">Deposit refundable</span>

          <span
            className={
              rule.depositRefundable ? "text-emerald-400" : "text-amber-400"
            }
          >
            {rule.depositRefundable ? "Yes" : "No"}
          </span>
        </div>

        {rule.scope === "LARGE_GROUP" && (
          <div className="flex justify-between gap-3 border-t border-zinc-800 pt-3">
            <span className="text-zinc-400">Guest threshold</span>

            <span>{rule.minimumGuestCount ?? "Not configured"}</span>
          </div>
        )}
      </div>
    </article>
  );
};

// ==========================================
// PRICE SIMULATOR
// ==========================================

const PriceSimulator = ({ rules }) => {
  const [scope, setScope] = useState("SINGLE_ROOM");
  const [dayType, setDayType] = useState("WEEKDAY");
  const [ruleId, setRuleId] = useState("");
  const [duration, setDuration] = useState("60");

  const matchingRules = useMemo(
    () =>
      rules
        .filter(
          (rule) =>
            rule.isActive &&
            rule.scope === scope &&
            (rule.dayType === dayType || rule.dayType === "EVERY_DAY"),
        )
        .sort((a, b) => a.startTimeMinutes - b.startTimeMinutes),
    [rules, scope, dayType],
  );

  const selectedRule =
    matchingRules.find((rule) => rule.id === ruleId) ||
    matchingRules[0] ||
    null;

  const requestedMinutes = Number(duration);

  const validDuration =
    duration.trim() !== "" &&
    Number.isSafeInteger(requestedMinutes) &&
    requestedMinutes > 0;

  let estimate = null;
  let warning = "";

  if (!selectedRule) {
    warning = "No active pricing rule matches this selection.";
  } else if (selectedRule.requiresQuote) {
    warning = "This rental requires a custom quote.";
  } else if (
    selectedRule.hourlyRateCents == null ||
    selectedRule.billingIncrementMinutes <= 0
  ) {
    warning = "This pricing rule is incomplete.";
  } else if (!validDuration) {
    warning = "Enter a valid duration in whole minutes.";
  } else if (requestedMinutes < selectedRule.minimumMinutes) {
    warning = `Minimum rental duration is ${selectedRule.minimumMinutes} minutes.`;
  } else {
    const billedMinutes =
      Math.ceil(requestedMinutes / selectedRule.billingIncrementMinutes) *
      selectedRule.billingIncrementMinutes;

    const availableMinutes =
      selectedRule.endTimeMinutes - selectedRule.startTimeMinutes;

    if (billedMinutes > availableMinutes) {
      warning =
        "The billed duration exceeds this pricing period. A multi-period quote is required.";
    } else {
      const subtotalCents = Math.round(
        (selectedRule.hourlyRateCents * billedMinutes) / 60,
      );

      const cleaningFeeCents = selectedRule.cleaningFeeCents ?? 0;

      const totalCents = subtotalCents + cleaningFeeCents;

      const depositCents = Math.round(
        (totalCents * selectedRule.depositBasisPoints) / 10000,
      );

      estimate = {
        billedMinutes,
        subtotalCents,
        cleaningFeeCents,
        totalCents,
        depositCents,
        balanceCents: totalCents - depositCents,
      };
    }
  }

  const reset = () => {
    setScope("SINGLE_ROOM");
    setDayType("WEEKDAY");
    setRuleId("");
    setDuration("60");
  };

  return (
    <section className={`${panel} p-5 sm:p-7`}>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calculator size={28} className={GOLD} />

          <div>
            <h2 className="text-xl font-bold">Rental Price Simulator</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Calculate estimates using active pricing rules.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="text-sm text-[#d4af37] hover:underline"
        >
          Reset calculator
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SIMULATOR INPUTS */}

        <div className="space-y-5">
          <div>
            <label
              htmlFor="rental-scope"
              className="mb-2 block text-sm text-zinc-300"
            >
              Rental type
            </label>

            <select
              id="rental-scope"
              className={field}
              value={scope}
              onChange={(event) => {
                setScope(event.target.value);
                setRuleId("");
              }}
            >
              <option value="SINGLE_ROOM">Single Room — Large or Small</option>

              <option value="ENTIRE_STUDIO">Entire Studio — Both Rooms</option>

              <option value="LARGE_GROUP">Large Group Rental</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="rental-day"
              className="mb-2 block text-sm text-zinc-300"
            >
              Day type
            </label>

            <select
              id="rental-day"
              className={field}
              value={dayType}
              onChange={(event) => {
                setDayType(event.target.value);
                setRuleId("");
              }}
            >
              <option value="WEEKDAY">Weekday — Monday to Friday</option>

              <option value="WEEKEND">Weekend — Saturday and Sunday</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="rental-period"
              className="mb-2 block text-sm text-zinc-300"
            >
              Pricing period
            </label>

            <select
              id="rental-period"
              className={field}
              value={selectedRule?.id || ""}
              disabled={!matchingRules.length}
              onChange={(event) => setRuleId(event.target.value)}
            >
              {!matchingRules.length && (
                <option value="">No active pricing rules</option>
              )}

              {matchingRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {timeRange(rule)} —{" "}
                  {rule.requiresQuote
                    ? "Custom quote"
                    : `${money(rule.hourlyRateCents)}/hr`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="rental-duration"
              className="mb-2 block text-sm text-zinc-300"
            >
              Rental duration (minutes)
            </label>

            <input
              id="rental-duration"
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className={field}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {[60, 90, 120, 180, 240, 360].map((minutes) => (
                <button
                  type="button"
                  key={minutes}
                  onClick={() => setDuration(String(minutes))}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    Number(duration) === minutes
                      ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
                      : "border-zinc-700 text-zinc-400 hover:text-white"
                  }`}
                >
                  {minutes / 60} hr
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ESTIMATED PRICE */}

        <div className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-br from-[#d4af37]/10 via-zinc-950 to-black p-6">
          <div className="mb-6 flex items-center gap-2">
            <Receipt size={22} className={GOLD} />

            <h3 className="font-semibold">Estimated Rental Summary</h3>
          </div>

          {warning && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-6 text-amber-300">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />

              {warning}
            </div>
          )}

          {estimate && (
            <>
              <div className="space-y-4 text-sm">
                {[
                  ["Rental type", scopeLabels[selectedRule.scope]],
                  ["Hourly rate", `${money(selectedRule.hourlyRateCents)}/hr`],
                  ["Requested duration", `${requestedMinutes / 60} hr`],
                  ["Billable duration", `${estimate.billedMinutes / 60} hr`],
                  ["Rental subtotal", money(estimate.subtotalCents)],
                  ["Cleaning fee", money(estimate.cleaningFeeCents)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-zinc-400">{label}</span>

                    <span className="text-right font-medium">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-zinc-700 pt-6">
                <p className="text-sm text-zinc-400">Estimated total</p>

                <p className="mt-2 text-4xl font-bold text-[#d4af37]">
                  {money(estimate.totalCents)}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-700 bg-black/30 p-4">
                  <p className="text-xs text-zinc-400">
                    Deposit ({selectedRule.depositBasisPoints / 100}%)
                  </p>

                  <p className="mt-2 text-xl font-bold text-[#d4af37]">
                    {money(estimate.depositCents)}
                  </p>

                  <p className="mt-2 text-xs text-zinc-500">
                    {selectedRule.depositRefundable
                      ? "Refundable"
                      : "Non-refundable"}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-700 bg-black/30 p-4">
                  <p className="text-xs text-zinc-400">Remaining balance</p>

                  <p className="mt-2 text-xl font-bold">
                    {money(estimate.balanceCents)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl bg-black/30 p-4">
        <Info size={19} className="shrink-0 text-[#d4af37]" />

        <p className="text-xs leading-6 text-zinc-400">
          Estimates assume the entire billed duration fits inside the selected
          pricing period. The deposit is calculated on the total including
          cleaning fees. This calculator does not verify availability, approved
          occupancy, taxes, or create reservations. Large group classification
          requires management approval until a guest threshold is configured.
        </p>
      </div>
    </section>
  );
};

// ==========================================
// MAIN DASHBOARD
// ==========================================

const ManageRentalPricing = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dayFilter, setDayFilter] = useState("ALL");

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/rental-pricing");

      if (!data.success || !Array.isArray(data.rules)) {
        throw new Error("Invalid rental pricing response.");
      }

      setRules(data.rules);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to retrieve rental pricing.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const activeRules = rules.filter((rule) => rule.isActive);

  const customQuotes = activeRules.filter((rule) => rule.requiresQuote).length;

  const standardRates = activeRules.filter(
    (rule) => !rule.requiresQuote,
  ).length;

  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rules
      .filter((rule) => {
        const matchesSearch = (
          rule.name +
          " " +
          (rule.description || "") +
          " " +
          (scopeLabels[rule.scope] || "")
        )
          .toLowerCase()
          .includes(query);

        const matchesScope =
          scopeFilter === "ALL" || rule.scope === scopeFilter;

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && rule.isActive) ||
          (statusFilter === "INACTIVE" && !rule.isActive);

        const matchesDay =
          dayFilter === "ALL" ||
          rule.dayType === dayFilter ||
          rule.dayType === "EVERY_DAY";

        return matchesSearch && matchesScope && matchesStatus && matchesDay;
      })
      .sort(
        (a, b) =>
          a.scope.localeCompare(b.scope) ||
          a.dayType.localeCompare(b.dayType) ||
          a.startTimeMinutes - b.startTimeMinutes,
      );
  }, [rules, search, scopeFilter, statusFilter, dayFilter]);

  const resetFilters = () => {
    setSearch("");
    setScopeFilter("ALL");
    setStatusFilter("ALL");
    setDayFilter("ALL");
  };

  const statValue = (value) => (loading || error ? "—" : value);

  return (
    <div className="min-h-screen space-y-8 bg-[#09090b] p-4 text-white sm:p-6 lg:p-8">
      {/* HEADER */}

      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
            <Building2 size={16} />
            Freedom Dance Studio
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Rental Pricing
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Review rental rates, deposit requirements, cleaning fees and pricing
            policies.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPricing}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm transition hover:border-[#d4af37] hover:text-[#d4af37] disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />

          {loading ? "Refreshing..." : "Refresh pricing"}
        </button>
      </header>

      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400"
        >
          <AlertCircle size={20} className="shrink-0" />

          <div>
            <p>{error}</p>

            <p className="mt-2 text-xs text-zinc-400">
              Previously loaded pricing may be outdated. Refresh before
              calculating an estimate.
            </p>
          </div>
        </div>
      )}

      {/* STATISTICS */}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          icon={Layers}
          label="Pricing rules"
          value={statValue(rules.length)}
          detail="All configured rules"
        />

        <StatCard
          icon={CheckCircle2}
          label="Active rules"
          value={statValue(activeRules.length)}
          detail="Currently enabled"
        />

        <StatCard
          icon={DollarSign}
          label="Standard rates"
          value={statValue(standardRates)}
          detail="Active fixed hourly rates"
        />

        <StatCard
          icon={Clock}
          label="Custom quotes"
          value={statValue(customQuotes)}
          detail="Active quote-only rules"
        />
      </section>

      {/* CALCULATOR */}

      {!loading && !error && <PriceSimulator rules={rules} />}

      {/* FILTERS */}

      <section className={`${panel} space-y-4 p-5`}>
        <h2 className="text-xl font-bold">Configured Pricing Rules</h2>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="search"
              aria-label="Search pricing rules"
              placeholder="Search pricing..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${field} pl-10`}
            />
          </div>

          <select
            aria-label="Rental type filter"
            value={scopeFilter}
            onChange={(event) => setScopeFilter(event.target.value)}
            className={field}
          >
            <option value="ALL">All rental types</option>
            <option value="SINGLE_ROOM">Single room</option>
            <option value="ENTIRE_STUDIO">Entire studio</option>
            <option value="LARGE_GROUP">Large group</option>
          </select>

          <select
            aria-label="Day type filter"
            value={dayFilter}
            onChange={(event) => setDayFilter(event.target.value)}
            className={field}
          >
            <option value="ALL">All days</option>
            <option value="WEEKDAY">Weekdays</option>
            <option value="WEEKEND">Weekends</option>
            <option value="EVERY_DAY">Every day</option>
          </select>

          <select
            aria-label="Status filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={field}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Showing {filteredRules.length} of {rules.length} rules
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-[#d4af37] hover:underline"
          >
            Reset filters
          </button>
        </div>
      </section>

      {/* LOADING */}

      {loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={`${panel} animate-pulse p-5`}>
              <div className="h-12 w-12 rounded-xl bg-zinc-800" />
              <div className="mt-5 h-5 w-2/3 rounded bg-zinc-800" />
              <div className="mt-4 h-3 w-full rounded bg-zinc-800" />
              <div className="mt-6 h-32 rounded-xl bg-zinc-800" />
              <div className="mt-5 h-24 rounded-xl bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {/* PRICING CARDS */}

      {!loading && filteredRules.length > 0 && (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRules.map((rule) => (
            <PricingCard key={rule.id} rule={rule} />
          ))}
        </section>
      )}

      {/* EMPTY STATE */}

      {!loading && !error && !filteredRules.length && (
        <div className={`${panel} p-12 text-center`}>
          <Search size={42} className="mx-auto mb-4 text-zinc-600" />

          <h3 className="text-xl font-semibold">No pricing rules found</h3>

          <p className="mt-2 text-sm text-zinc-400">
            Try adjusting your search or filters.
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* POLICY INFORMATION */}

      <section className={`${panel} p-6`}>
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck size={25} className={GOLD} />

          <h2 className="text-xl font-bold">Rental Policy Information</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Billing increments",
              description:
                "Rental durations are rounded up according to the billing increment configured in the selected pricing rule.",
            },
            {
              icon: ShieldCheck,
              title: "Deposit requirements",
              description:
                "Deposit percentages and refundability are determined by the selected pricing rule.",
            },
            {
              icon: Building2,
              title: "Entire studio",
              description:
                "An entire studio reservation requires exclusive access to both studio rooms.",
            },
            {
              icon: Users,
              title: "Large groups",
              description:
                "Large group rentals may include additional cleaning fees. Group classification is subject to management approval.",
            },
            {
              icon: Receipt,
              title: "Custom quotes",
              description:
                "Quote-only pricing rules require management to provide a final rental price.",
            },
            {
              icon: Info,
              title: "Occupancy and availability",
              description:
                "All reservations are subject to room availability and verified legal occupancy limits.",
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800 bg-black/30 p-5"
            >
              <Icon size={23} className={GOLD} />

              <h3 className="mt-4 font-semibold">{title}</h3>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-800 pt-5 text-center text-xs text-zinc-600">
        Freedom Dance Studio Management Platform
        <p className="mt-2">
          USD · America/Los_Angeles · Read-only pricing dashboard
        </p>
      </footer>
    </div>
  );
};

export default ManageRentalPricing;
