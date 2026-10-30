
import { Link } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  Mail,
  ArrowUpRight,
  Heart,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 pt-14 pb-8 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="rounded-xl bg-violet-600 p-2">
                <CalendarDays size={22} />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">
                Event<span className="text-violet-400">Pulse</span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Discover unforgettable experiences, explore exciting
              events, and book your next adventure with ease.
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
              <MapPin size={17} className="text-violet-400" />
              Discover events across cities
            </div>
          </div>

          {/* Navigation */}
          <div className="md:mx-auto">
            <h3 className="mb-5 text-base font-semibold">
              Quick Links
            </h3>

            <ul className="space-y-4 text-sm text-slate-400">
              <li>
                <Link
                  to="/"
                  className="transition hover:text-violet-400"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/events"
                  className="transition hover:text-violet-400"
                >
                  Explore Events
                </Link>
              </li>

              <li>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-1 transition hover:text-violet-400"
                >
                  Find Your Next Experience
                  <ArrowUpRight size={15} />
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="mb-5 text-base font-semibold">
              About EventPulse
            </h3>

            <p className="text-sm leading-7 text-slate-400">
              Your destination for concerts, workshops, technology
              conferences, sports, and entertainment events.
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
              <Mail size={17} className="text-violet-400" />
              Connecting people through events
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-7 text-center text-sm text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} EventPulse.
            All rights reserved.
          </p>

          <p className="flex items-center gap-1">
            Made with
            <Heart
              size={15}
              className="fill-violet-500 text-violet-500"
            />
            for amazing experiences
          </p>
        </div>
      </div>
    </footer>
  );
}
