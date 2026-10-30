
import { Link } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  ArrowUpRight,
  Ticket,
} from "lucide-react";

export default function EventCard({ event }) {
  if (!event) return null;

  const {
    _id,
    title,
    category,
    city,
    venue,
    date,
    imageUrl,
    price,
    availableSeats,
  } = event;

  const soldOut = Number(availableSeats) <= 0;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date TBA";

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-900/20">

      {/* Event image */}
      <div className="relative h-52 overflow-hidden bg-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays
              size={48}
              className="text-slate-600"
            />
          </div>
        )}

        {/* Category badge */}
        <span className="absolute left-4 top-4 rounded-full bg-slate-950/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {category || "Event"}
        </span>

        {/* Availability badge */}
        <span
          className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
            soldOut
              ? "bg-red-500 text-white"
              : "bg-emerald-500 text-white"
          }`}
        >
          {soldOut ? "Sold Out" : "Available"}
        </span>
      </div>

      {/* Event information */}
      <div className="p-5">
        <h3 className="mb-4 line-clamp-2 min-h-14 text-xl font-bold text-white transition-colors group-hover:text-violet-400">
          {title}
        </h3>

        <div className="space-y-3 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <CalendarDays
              size={17}
              className="shrink-0 text-violet-400"
            />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin
              size={17}
              className="shrink-0 text-violet-400"
            />
            <span className="truncate">
              {[venue, city].filter(Boolean).join(", ") ||
                "Venue TBA"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Ticket
              size={17}
              className="shrink-0 text-violet-400"
            />
            <span>
              {soldOut
                ? "No seats remaining"
                : `${availableSeats} seats available`}
            </span>
          </div>
        </div>

        {/* Price and action */}
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <p className="text-xs text-slate-500">
              Ticket price
            </p>

            <p className="mt-1 text-2xl font-bold text-white">
              {Number(price) === 0
                ? "Free"
                : `₹${Number(price).toLocaleString("en-IN")}`}
            </p>
          </div>

          <Link
            to={`/events/${_id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            View Details
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}
