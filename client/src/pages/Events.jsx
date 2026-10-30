
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, RefreshCw, SearchX } from "lucide-react";

import EventCard from "../components/EventCard";
import SearchFilters from "../components/SearchFilters";
import { getEvents } from "../services/eventApi";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      setLoading(true);
      setError("");

      try {
        const data = await getEvents();

        if (!Array.isArray(data)) {
          throw new Error("Invalid events response");
        }

        if (active) setEvents(data);
      } catch (err) {
        if (active) {
          setError(
            "Unable to load events. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, [retryCount]);

  const categories = useMemo(
    () =>
      [...new Set(events.map((e) => e.category).filter(Boolean))]
        .sort(),
    [events]
  );

  const cities = useMemo(
    () =>
      [...new Set(events.map((e) => e.city).filter(Boolean))]
        .sort(),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        String(event.title || "")
          .toLowerCase()
          .includes(query) ||
        String(event.description || "")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        !category || event.category === category;

      const matchesCity =
        !city || event.city === city;

      const matchesDate =
        !date ||
        (event.date &&
          !Number.isNaN(new Date(event.date).getTime()) &&
          new Date(event.date).toLocaleDateString("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }) === date);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCity &&
        matchesDate
      );
    });
  }, [events, search, category, city, date]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Page heading */}
      <section className="border-b border-white/10 bg-gradient-to-b from-violet-950/30 to-slate-950 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            <CalendarDays size={16} />
            Explore what's happening
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Explore <span className="text-violet-400">Events</span>
          </h1>

          <p className="mt-4 max-w-2xl text-slate-400">
            Find exciting events, discover new experiences,
            and make unforgettable memories.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Search filters */}
        <SearchFilters
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          city={city}
          setCity={setCity}
          date={date}
          setDate={setDate}
          categories={categories}
          cities={cities}
        />

        {/* Loading state */}
        {loading && (
          <div
            className="flex flex-col items-center justify-center py-24"
            role="status"
          >
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
            <p className="mt-5 text-slate-400">
              Loading amazing events...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div role="alert" className="py-24 text-center">
            <p className="text-xl font-semibold text-white">
              Something went wrong
            </p>

            <p className="mt-3 text-slate-400">
              {error}
            </p>

            <button
              onClick={() => setRetryCount((n) => n + 1)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        )}

        {/* Success state */}
        {!loading && !error && (
          <>
            <div className="my-8 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">
                {filteredEvents.length}{" "}
                {filteredEvents.length === 1
                  ? "Event"
                  : "Events"}{" "}
                Found
              </h2>
            </div>

            {filteredEvents.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-24 text-center">
                <SearchX
                  size={52}
                  className="text-violet-400"
                />

                <h3 className="mt-5 text-2xl font-bold">
                  No events found
                </h3>

                <p className="mt-3 text-slate-400">
                  {events.length === 0
                    ? "No events are available right now."
                    : "Try changing your search or filters."}
                </p>

                {events.length > 0 && (
                  <Link
                    to="/events"
                    onClick={(e) => {
                      e.preventDefault();
                      setSearch("");
                      setCategory("");
                      setCity("");
                      setDate("");
                    }}
                    className="mt-6 rounded-xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500"
                  >
                    Clear Filters
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
