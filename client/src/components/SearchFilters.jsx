
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function SearchFilters({
  search,
  setSearch,
  category,
  setCategory,
  city,
  setCity,
  date,
  setDate,
  categories = [],
  cities = [],
}) {
  const hasFilters = Boolean(search || category || city || date);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setCity("");
    setDate("");
  };

  const inputStyle =
    "w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-500";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <SlidersHorizontal size={20} className="text-violet-400" />
        <h2 className="text-lg font-semibold text-white">
          Find Your Next Experience
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-3.5 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputStyle} pl-10`}
            aria-label="Search events"
          />
        </div>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputStyle}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {/* City */}
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={inputStyle}
          aria-label="Filter by city"
        >
          <option value="">All Cities</option>
          {cities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputStyle}
          aria-label="Filter by date"
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300"
        >
          <X size={16} />
          Clear all filters
        </button>
      )}
    </section>
  );
}
