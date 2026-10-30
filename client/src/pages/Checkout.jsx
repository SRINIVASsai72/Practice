import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import BookingForm from "../components/BookingForm";

import {
  getCheckoutEvent,
  createBooking,
  createBookingAttemptKey,
  getBookingErrorMessage,
} from "../services/bookingApi";

export default function Checkout() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [uncertainBooking, setUncertainBooking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const bookingAttemptRef = useRef(null);
  const submissionLock = useRef(false);

  // Fetch event details
  useEffect(() => {
    let active = true;

    const fetchEvent = async () => {
      setLoading(true);
      setError("");

      try {
        if (!eventId) {
          throw new Error("Invalid event ID.");
        }

        const data = await getCheckoutEvent(eventId);

        if (!data?.event) {
          throw new Error("Event not found.");
        }

        if (active) {
          setEvent(data.event);
        }
      } catch (err) {
        if (active) {
          setEvent(null);
          setError(getBookingErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchEvent();

    return () => {
      active = false;
    };
  }, [eventId, retryCount]);

  // Reset attempts when switching events
  useEffect(() => {
    bookingAttemptRef.current = null;
    setUncertainBooking(false);
    setBookingError("");
  }, [eventId]);

  // Handle ticket booking
  const handleBooking = async (quantity) => {
    if (submissionLock.current) {
      return;
    }

    if (!event?._id) {
      throw new Error("Event information is unavailable.");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Please select a valid ticket quantity.");
    }

    const availableSeats = Number(event.availableSeats);

    if (
      Number.isFinite(availableSeats) &&
      quantity > availableSeats
    ) {
      throw new Error(
        "Not enough tickets are currently available."
      );
    }

    const previousAttempt = bookingAttemptRef.current;

    // An uncertain request must be retried with the same details
    if (
      previousAttempt &&
      (previousAttempt.eventId !== event._id ||
        previousAttempt.quantity !== quantity)
    ) {
      throw new Error(
        "Your previous booking may have succeeded. Please check My Bookings before starting a different booking."
      );
    }

    const attempt = previousAttempt || {
      eventId: event._id,
      quantity,
      idempotencyKey: createBookingAttemptKey(),
    };

    bookingAttemptRef.current = attempt;

    submissionLock.current = true;
    setSubmitting(true);
    setBookingError("");

    try {
      const response = await createBooking({
        eventId: attempt.eventId,
        quantity: attempt.quantity,
        idempotencyKey: attempt.idempotencyKey,
      });

      // Confirm only after a successful backend response
      if (!response?.booking) {
        const responseError = new Error(
          "Booking response could not be verified. Please check My Bookings."
        );

        responseError.bookingUncertain = true;
        throw responseError;
      }

      const booking = response.booking;

      if (booking.status === "cancelled") {
        throw new Error(
          "The returned booking is cancelled."
        );
      }

      bookingAttemptRef.current = null;
      setUncertainBooking(false);

      // Redirect after confirmed booking
      navigate("/my-bookings", {
        replace: true,
        state: {
          message:
            response.message || "Booking confirmed successfully!",
          bookingReference: booking.bookingReference,
          bookingId: booking._id,
        },
      });
    } catch (err) {
      const status = err.response?.status;

      // Network failures and server errors may have created a booking
      const uncertain =
        err.bookingUncertain === true ||
        !err.response && Boolean(err.request) ||
        status === 408 ||
        status === 425 ||
        status >= 500;

      if (uncertain) {
        // Keep the same idempotency key for retrying this attempt
        setUncertainBooking(true);
      } else {
        // Definitive failure: next attempt receives a new key
        bookingAttemptRef.current = null;
        setUncertainBooking(false);
      }

      const message = getBookingErrorMessage(err);
      setBookingError(message);

      throw err;
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  // Format event date
  const formatDate = (date) => {
    if (!date) return "Date to be announced";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date to be announced";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

          <p className="mt-4 text-gray-600">
            Loading checkout details...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h2 className="mb-3 text-2xl font-bold text-red-600">
            Unable to Load Event
          </h2>

          <p role="alert" className="mb-6 text-gray-600">
            {error || "Event not found."}
          </p>

          <button
            onClick={() => setRetryCount((prev) => prev + 1)}
            className="mb-3 w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Try Again
          </button>

          <Link
            to="/events"
            className="block font-medium text-indigo-600 hover:underline"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Navigation */}
        <Link
          to={`/events/${event._id}`}
          className="mb-6 inline-block font-medium text-indigo-600 hover:underline"
        >
          ← Back to Event
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Event Checkout
          </h1>

          <p className="mt-2 text-gray-500">
            Review your event details and reserve your tickets.
          </p>
        </div>

        {/* Uncertain Booking Warning */}
        {uncertainBooking && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5"
          >
            <h3 className="font-bold text-amber-800">
              Booking Status Uncertain
            </h3>

            <p className="mt-2 text-sm text-amber-700">
              Your previous request may have reached the server.
              Check your bookings before trying again.
              Retrying with the same ticket quantity will reuse
              the original booking attempt key.
            </p>

            <Link
              to="/my-bookings"
              className="mt-3 inline-block font-semibold text-indigo-600 hover:underline"
            >
              Check My Bookings →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* Event Details */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">

            {/* Event Image */}
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
                <span className="text-4xl font-bold text-white">
                  EventPulse
                </span>
              </div>
            )}

            <div className="p-6">

              {/* Category */}
              <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {event.category || "Event"}
              </span>

              {/* Event Title */}
              <h2 className="mt-4 text-2xl font-bold text-gray-800">
                {event.title}
              </h2>

              {/* Description */}
              <p className="mt-3 whitespace-pre-wrap break-words text-gray-600">
                {event.description}
              </p>

              {/* Date */}
              <div className="mt-6 border-t border-gray-200 pt-5">
                <p className="text-sm font-semibold text-gray-500">
                  EVENT DATE
                </p>

                <p className="mt-1 font-medium text-gray-800">
                  {formatDate(event.date)}
                </p>
              </div>

              {/* Venue */}
              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-500">
                  VENUE
                </p>

                <p className="mt-1 font-medium text-gray-800">
                  {event.venue || "Venue to be announced"}
                </p>

                <p className="text-gray-600">
                  {event.city}
                </p>
              </div>

              {/* Availability */}
              <div className="mt-5">
                <p className="text-sm font-semibold text-gray-500">
                  TICKET AVAILABILITY
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Displayed availability may change before your
                  booking is processed.
                </p>
              </div>

            </div>
          </div>

          {/* Booking Form */}
          <div>
            <BookingForm
              event={event}
              onBook={handleBooking}
              isSubmitting={submitting}
              error={bookingError}
            />

            <div className="mt-5 rounded-xl bg-indigo-50 p-4">
              <p className="text-sm text-indigo-700">
                Ticket reservations are confirmed only after
                successful processing by the server.
                No online payment is required.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}