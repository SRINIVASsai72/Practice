
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Ticket,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { getEventById } from "../services/eventApi";

export default function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadEvent() {
      setLoading(true);
      setError("");
      setEvent(null);

      try {
        const data = await getEventById(id);

        if (!data || typeof data !== "object" || !data._id) {
          throw new Error("Invalid event response");
        }

        if (active) {
          setEvent(data);
        }
      } catch (err) {
        if (active) {
          setError("Unable to load event details. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadEvent();

    return () => {
      active = false;
    };
  }, [id, retryCount]);

  if (loading) {
    return (
      <main
        role="status"
        className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />
        <p className="mt-5 text-slate-400">
          Loading event details...
        </p>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
        <AlertCircle size={52} className="text-red-400" />

        <h1 className="mt-5 text-2xl font-bold">
          Event Unavailable
        </h1>

        <p role="alert" className="mt-3 text-slate-400">
          {error || "Event not found."}
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setRetryCount((n) => n + 1)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500"
          >
            <RefreshCw size={17} />
            Try Again
          </button>

          <Link
            to="/events"
            className="rounded-xl border border-white/20 px-5 py-3 font-semibold hover:bg-white/10"
          >
            Explore Events
          </Link>
        </div>
      </main>
    );
  }

  const {
    _id,
    title,
    description,
    category,
    venue,
    city,
    date,
    imageUrl,
    price,
    totalSeats,
    bookedSeats,
    availableSeats,
  } = event;

  const total = Math.max(0, Number(totalSeats) || 0);
  const booked = Math.max(0, Number(bookedSeats) || 0);
  const available = Math.max(0, Number(availableSeats) || 0);

  const soldOut = available === 0;

  const bookedPercentage =
    total > 0
      ? Math.min(100, Math.round((booked / total) * 100))
      : 0;

  const parsedDate = date ? new Date(date) : null;

  const formattedDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "Date to be announced";

  const formattedPrice =
    Number(price) === 0
      ? "Free"
      : `₹${Number(price).toLocaleString("en-IN")}`;

  return (
    <main className="min-h-screen bg-slate-950 pb-20 text-white">
      <div className="mx-auto max-w-7xl px-6 pt-8">
        {/* Back navigation */}
        <Link
          to="/events"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-violet-400"
        >
          <ArrowLeft size={18} />
          Back to Events
        </Link>

        {/* Event image */}
        <div className="relative h-64 overflow-hidden rounded-2xl bg-slate-800 sm:h-96">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <CalendarDays
                size={70}
                className="text-slate-600"
              />
            </div>
          )}

          <span className="absolute left-5 top-5 rounded-full bg-slate-950/85 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            {category || "Event"}
          </span>
        </div>

        {/* Main content */}
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          {/* Event information */}
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <span
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  soldOut
                    ? "bg-red-500/15 text-red-400"
                    : "bg-emerald-500/15 text-emerald-400"
                }`}
              >
                {soldOut ? "Sold Out" : "Tickets Available"}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
              {title}
            </h1>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-slate-900 p-5">
                <CalendarDays
                  size={24}
                  className="shrink-0 text-violet-400"
                />
                <div>
                  <p className="text-sm text-slate-400">
                    Date & Time
                  </p>
                  <p className="mt-1 font-semibold">
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-slate-900 p-5">
                <MapPin
                  size={24}
                  className="shrink-0 text-violet-400"
                />
                <div>
                  <p className="text-sm text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 font-semibold">
                    {[venue, city].filter(Boolean).join(", ") ||
                      "Venue to be announced"}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <section className="mt-10">
              <h2 className="text-2xl font-bold">
                About This Event
              </h2>

              <p className="mt-5 whitespace-pre-line leading-8 text-slate-400">
                {description || "No description available."}
              </p>
            </section>
          </div>

          {/* Booking summary */}
          <aside>
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 lg:sticky lg:top-24">
              <p className="text-sm text-slate-400">
                Ticket Price
              </p>

              <p className="mt-2 text-4xl font-extrabold">
                {formattedPrice}
              </p>

              <div className="my-7 border-t border-white/10" />

              <div className="flex items-center gap-2">
                <Ticket size={20} className="text-violet-400" />
                <h3 className="font-semibold">
                  Seat Availability
                </h3>
              </div>

              <div className="mt-5 flex justify-between text-sm">
                <span className="text-slate-400">
                  Seats booked
                </span>
                <span className="font-semibold">
                  {booked} / {total}
                </span>
              </div>

              {/* Capacity progress */}
              <div
                className="mt-3 h-3 overflow-hidden rounded-full bg-slate-700"
                role="progressbar"
                aria-label="Seats booked"
                aria-valuenow={bookedPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    soldOut ? "bg-red-500" : "bg-violet-500"
                  }`}
                  style={{ width: `${bookedPercentage}%` }}
                />
              </div>

              <div className="mt-4 flex justify-between text-sm">
                <span className="text-slate-400">
                  Seats remaining
                </span>

                <span
                  className={`font-semibold ${
                    soldOut
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {available}
                </span>
              </div>

              {/* Book Now */}
              {soldOut ? (
                <button
                  type="button"
                  disabled
                  className="mt-8 w-full cursor-not-allowed rounded-xl bg-slate-700 px-6 py-4 font-semibold text-slate-400"
                >
                  Sold Out
                </button>
              ) : (
                <Link
                  to={`/checkout/${_id}`}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-4 font-semibold transition hover:bg-violet-500"
                >
                  Book Now
                  <ArrowRight size={19} />
                </Link>
              )}

              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                Availability may change before booking confirmation.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
