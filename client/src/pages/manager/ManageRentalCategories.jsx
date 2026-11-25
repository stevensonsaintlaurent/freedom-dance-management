import { useEffect, useMemo, useState } from "react";

import {
  Layers,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  CalendarDays,
  Tag,
  LayoutGrid,
  List,
  Music,
  Users,
  Camera,
  Heart,
  Briefcase,
  PartyPopper,
  Dumbbell,
  GraduationCap,
  Mic2,
} from "lucide-react";

import api from "@/api/axios";

// ==========================================
// CONFIGURATION
// ==========================================

const GOLD = "text-[#d4af37]";

const panel = "rounded-2xl border border-zinc-800 bg-zinc-900/60";

const categoryIcons = {
  Audition: Mic2,
  "Birthday Party": PartyPopper,
  "Business Meeting": Briefcase,
  "Community Event": Users,
  "Corporate Event": Briefcase,
  "Dance Class": Music,
  "Dance Social": Music,
  "Fitness Class": Dumbbell,
  "Independent Instructor": GraduationCap,
  "Music Rehearsal": Music,
  Other: Layers,
  Performance: Mic2,
  "Personal Practice": Users,
  "Photography and Video": Camera,
  "Private Event": PartyPopper,
  "Private Lesson": GraduationCap,
  "Wedding Event": Heart,
  Workshop: GraduationCap,
};

// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({ icon: Icon, label, value, detail }) => (
  <div className={`${panel} p-5`}>
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/10">
      <Icon size={23} className={GOLD} />
    </div>

    <p className="text-sm text-zinc-400">{label}</p>

    <h3 className="mt-2 text-3xl font-bold text-white">{value}</h3>

    <p className="mt-2 text-xs text-zinc-500">{detail}</p>
  </div>
);

// ==========================================
// CATEGORY STATUS
// ==========================================

const CategoryStatus = ({ isActive }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
      isActive
        ? "bg-emerald-500/10 text-emerald-400"
        : "bg-red-500/10 text-red-400"
    }`}
  >
    {isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}

    {isActive ? "Active" : "Inactive"}
  </span>
);

// ==========================================
// CATEGORY CARD
// ==========================================

const CategoryCard = ({ category }) => {
  const Icon = categoryIcons[category.name] || Tag;

  return (
    <article
      className={`${panel} flex flex-col p-5 transition duration-300 hover:border-[#d4af37]/50`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/10">
          <Icon size={24} className={GOLD} />
        </div>

        <CategoryStatus isActive={category.isActive} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">{category.name}</h3>

      <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">
        {category.description || "No description configured."}
      </p>

      <div className="mt-5 border-t border-zinc-800 pt-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Building2 size={15} className={GOLD} />
          Both studio rooms
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-black/30 p-3">
            <p className="text-xl font-semibold">
              {category._count?.rentals ?? "—"}
            </p>

            <p className="mt-1 text-xs text-zinc-500">Rental records</p>
          </div>

          <div className="rounded-lg bg-black/30 p-3">
            <p className="text-xl font-semibold">
              {category._count?.rates ?? "—"}
            </p>

            <p className="mt-1 text-xs text-zinc-500">Custom rates</p>
          </div>
        </div>
      </div>
    </article>
  );
};

// ==========================================
// CATEGORY TABLE
// ==========================================

const CategoryTable = ({ categories }) => (
  <div className={`${panel} overflow-hidden`}>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="border-b border-zinc-800 bg-black/30 text-xs uppercase tracking-wider text-zinc-400">
          <tr>
            <th className="px-5 py-4">Category</th>
            <th className="px-5 py-4">Description</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Rentals</th>
            <th className="px-5 py-4">Custom rates</th>
          </tr>
        </thead>

        <tbody>
          {categories.map((category) => {
            const Icon = categoryIcons[category.name] || Tag;

            return (
              <tr
                key={category.id}
                className="border-b border-zinc-800 transition last:border-0 hover:bg-zinc-800/40"
              >
                <td className="px-5 py-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[#d4af37]/10 p-2.5">
                      <Icon size={18} className={GOLD} />
                    </div>

                    <span className="font-semibold">{category.name}</span>
                  </div>
                </td>

                <td className="max-w-md px-5 py-5 leading-6 text-zinc-400">
                  {category.description || "—"}
                </td>

                <td className="px-5 py-5">
                  <CategoryStatus isActive={category.isActive} />
                </td>

                <td className="px-5 py-5">{category._count?.rentals ?? "—"}</td>

                <td className="px-5 py-5">{category._count?.rates ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

const ManageRentalCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [view, setView] = useState("GRID");
  const [sort, setSort] = useState("AZ");

  // ========================================
  // FETCH CATEGORIES
  // ========================================

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/rental-categories");

      if (!data.success || !Array.isArray(data.categories)) {
        throw new Error("Invalid rental category response.");
      }

      setCategories(data.categories);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load rental categories.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ========================================
  // STATISTICS
  // ========================================

  const activeCount = categories.filter((category) => category.isActive).length;

  const inactiveCount = categories.filter(
    (category) => !category.isActive,
  ).length;

  const rentalCount = categories.reduce(
    (total, category) => total + (category._count?.rentals ?? 0),
    0,
  );

  // ========================================
  // FILTERING AND SORTING
  // ========================================

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories
      .filter((category) => {
        const matchesSearch =
          category.name.toLowerCase().includes(query) ||
          (category.description || "").toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && category.isActive) ||
          (statusFilter === "INACTIVE" && !category.isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) =>
        sort === "AZ"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name),
      );
  }, [categories, search, statusFilter, sort]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setSort("AZ");
  };

  return (
    <div className="min-h-screen space-y-8 bg-[#09090b] p-4 text-white sm:p-6 lg:p-8">
      {/* PAGE HEADER */}

      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">
            <Building2 size={16} />
            Freedom Dance Studio
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Rental Categories
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Explore the activities and services available across our studio
            rental spaces.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCategories}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm transition hover:border-[#d4af37] hover:text-[#d4af37] disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400"
        >
          <AlertCircle size={20} className="shrink-0" />

          <div>
            <p>{error}</p>

            <p className="mt-1 text-xs text-zinc-400">
              Previously loaded information may be outdated.
            </p>
          </div>
        </div>
      )}

      {/* STATISTICS */}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          icon={Layers}
          label="Total categories"
          value={loading || error ? "—" : categories.length}
          detail="All configured activities"
        />

        <StatCard
          icon={CheckCircle2}
          label="Active categories"
          value={loading || error ? "—" : activeCount}
          detail="Enabled for customers"
        />

        <StatCard
          icon={XCircle}
          label="Inactive categories"
          value={loading || error ? "—" : inactiveCount}
          detail="Currently disabled"
        />

        <StatCard
          icon={CalendarDays}
          label="Rental records"
          value={loading || error ? "—" : rentalCount}
          detail="Across all categories"
        />
      </section>

      {/* SEARCH AND FILTERS */}

      <section className={`${panel} space-y-4 p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
              type="search"
              aria-label="Search rental categories"
              placeholder="Search categories or descriptions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-black/40 py-3 pl-12 pr-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#d4af37]"
            />
          </div>

          <select
            aria-label="Filter category status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-[#d4af37]"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            aria-label="Sort categories"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-[#d4af37]"
          >
            <option value="AZ">Name: A–Z</option>
            <option value="ZA">Name: Z–A</option>
          </select>

          <div className="flex rounded-xl border border-zinc-700 bg-black/30 p-1">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "GRID"}
              onClick={() => setView("GRID")}
              className={`rounded-lg p-3 ${
                view === "GRID"
                  ? "bg-[#d4af37] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid size={18} />
            </button>

            <button
              type="button"
              aria-label="Table view"
              aria-pressed={view === "TABLE"}
              onClick={() => setView("TABLE")}
              className={`rounded-lg p-3 ${
                view === "TABLE"
                  ? "bg-[#d4af37] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Showing {filteredCategories.length} of {categories.length}{" "}
            categories
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-[#d4af37] hover:underline"
          >
            Reset filters
          </button>
        </div>
      </section>

      {/* LOADING STATE */}

      {loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={`${panel} animate-pulse p-5`}>
              <div className="h-12 w-12 rounded-xl bg-zinc-800" />

              <div className="mt-5 h-5 w-1/2 rounded bg-zinc-800" />

              <div className="mt-4 h-3 w-full rounded bg-zinc-800" />

              <div className="mt-3 h-3 w-3/4 rounded bg-zinc-800" />

              <div className="mt-6 h-20 rounded-xl bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}

      {!loading && !error && !filteredCategories.length && (
        <div className={`${panel} p-12 text-center`}>
          <Search size={42} className="mx-auto mb-4 text-zinc-600" />

          <h3 className="text-xl font-semibold">No categories found</h3>

          <p className="mt-2 text-sm text-zinc-400">
            Try a different search or reset your filters.
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

      {/* GRID VIEW */}

      {!loading && filteredCategories.length > 0 && view === "GRID" && (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </section>
      )}

      {/* TABLE VIEW */}

      {!loading && filteredCategories.length > 0 && view === "TABLE" && (
        <CategoryTable categories={filteredCategories} />
      )}

      {/* STUDIO INFORMATION */}

      <section className="rounded-2xl border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/10 via-zinc-900 to-black p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <Building2 size={32} className="shrink-0 text-[#d4af37]" />

          <div>
            <h2 className="text-xl font-bold">Flexible Studio Rentals</h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
              All active rental categories are supported by our two multipurpose
              studio spaces, subject to availability, approved occupancy,
              activity requirements and studio policies.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Large Studio", "720 sq. ft."],
            ["Small Studio", "639 sq. ft."],
            ["Entire Studio", "1,359 sq. ft."],
          ].map(([name, area]) => (
            <div
              key={name}
              className="rounded-xl border border-zinc-700/60 bg-black/30 p-5"
            >
              <p className="text-sm text-zinc-400">{name}</p>

              <h3 className="mt-2 text-xl font-bold text-[#d4af37]">{area}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-zinc-800 pt-5 text-center text-xs text-zinc-600">
        Freedom Dance Studio Management Platform
        <p className="mt-2">
          Rental categories are retrieved from the database. This dashboard is
          currently read-only.
        </p>
      </footer>
    </div>
  );
};

export default ManageRentalCategories;
