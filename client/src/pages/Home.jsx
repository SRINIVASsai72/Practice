
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Ticket,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: CalendarDays,
      title: "Discover Events",
      description:
        "Explore concerts, tech conferences, workshops, and exciting experiences.",
    },
    {
      icon: MapPin,
      title: "Find Events Near You",
      description:
        "Discover amazing experiences happening in your favorite cities.",
    },
    {
      icon: Ticket,
      title: "Easy Ticket Booking",
      description:
        "Choose an event, check availability, and book your tickets.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Hero section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        {/* Background glow */}
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">

          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-5 py-2 text-sm text-violet-300">
            <Sparkles size={16} />
            Your gateway to unforgettable experiences
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Discover Events.
            <br />
            Create{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Memories.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
            From electrifying concerts to inspiring conferences,
            discover exciting events and unforgettable experiences
            with EventPulse.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/events"
              className="inline-flex items-center gap-3 rounded-xl bg-violet-600 px-8 py-4 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:-translate-y-1 hover:bg-violet-500"
            >
              Explore Events
              <ArrowRight size={20} />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-white/5 bg-slate-900/40 px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Why Choose{" "}
              <span className="text-violet-400">
                EventPulse?
              </span>
            </h2>

            <p className="mt-4 text-slate-400">
              Everything you need to discover your next experience.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-8 transition hover:-translate-y-1 hover:border-violet-500/40"
                >
                  <div className="mb-6 inline-flex rounded-xl bg-violet-600/15 p-4 text-violet-400">
                    <Icon size={26} />
                  </div>

                  <h3 className="mb-3 text-xl font-bold">
                    {feature.title}
                  </h3>

                  <p className="text-sm leading-7 text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom call to action */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Ready for Your Next Experience?
        </h2>

        <p className="mt-4 text-slate-400">
          Your next unforgettable moment is just a click away.
        </p>

        <Link
          to="/events"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 font-semibold transition hover:bg-violet-500"
        >
          Browse All Events
          <ArrowRight size={19} />
        </Link>
      </section>
    </div>
  );
}
