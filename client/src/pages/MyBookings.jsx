import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import BookingCard from "../components/BookingCard";

import {
  getMyBookings,
  cancelBooking,
  getBookingErrorMessage,
} from "../services/bookingApi";

export default function MyBookings() {
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshCount, setRefreshCount] = useState(0);

  // Fetch user's bookings
  useEffect(() => {
    let active = true;

    const fetchBookings = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getMyBookings();

        if (!Array.isArray(response?.bookings)) {
          throw new Error("Invalid booking response from server.");
        }

        if (active) {
          setBookings(response.bookings);
        }
      } catch (err) {
        if (active) {
          setError(getBookingErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    return () => {
      active = false;
    };
  }, [refreshCount]);

  // Cancel a booking
  const handleCancelBooking = async (bookingId) => {
    const response = await cancelBooking(bookingId);

    if (
      !response?.booking?._id ||
      response.booking.status?.toLowerCase() !== "cancelled"
    ) {
      throw new Error(
        "Cancellation could not be confirmed. Please refresh your bookings."
      );
    }

    const updatedBooking = response.booking;

    setBookings((previousBookings) =>
      previousBookings.map((booking) => {
        if (booking._id !== bookingId) {
          return booking;
        }

        return {
          ...booking,
          ...updatedBooking,

          // Preserve populated event details when necessary
          eventId:
            updatedBooking.eventId &&
            typeof updatedBooking.eventId === "object"
              ? updatedBooking.eventId
              : booking.eventId,
        };
      })
    );

    setSuccess(
      response.message || "Booking cancelled successfully."
    );

    return response;
  };

  // Filter bookings
  const filteredBookings = bookings
    .filter((booking) => {
      if (filter === "all") return true;

      return (
        String(booking.status || "pending").toLowerCase() ===
        filter
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  // Booking statistics
  const totalBookings = bookings.length;

  const confirmedBookings = bookings.filter(
    (booking) =>
      String(booking.status).toLowerCase() === "confirmed"
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) =>
      String(booking.status).toLowerCase() === "cancelled"
  ).length;

  const pendingBookings = bookings.filter(
    (booking) =>
      String(booking.status).toLowerCase() === "pending"
  ).length;

  const totalTickets = bookings
    .filter(
      (booking) =>
        String(booking.status).toLowerCase() === "confirmed"
    )
    .reduce(
      (sum, booking) => sum + Number(booking.quantity || 0),
      0
    );

  // Confirm checkout success against fetched booking data
  const checkoutBooking = bookings.find(
    (booking) =>
      booking._id === location.state?.bookingId &&
      booking.bookingReference ===
        location.state?.bookingReference &&
      String(booking.status).toLowerCase() === "confirmed"
  );

  const checkoutMessage = checkoutBooking
    ? location.state?.message || "Booking confirmed successfully!"
    : "";

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

          <p className="mt-4 text-gray-600">
            Loading your bookings...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h2 className="mb-3 text-2xl font-bold text-red-600">
            Unable to Load Bookings
          </h2>

          <p role="alert" className="mb-6 text-gray-600">
            {error}
          </p>

          <button
            onClick={() =>
              setRefreshCount((previous) => previous + 1)
            }
            className="mb-4 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Try Again
          </button>

          <Link
            to="/events"
            className="block font-medium text-indigo-600 hover:underline"
          >
            Explore Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              My Bookings
            </h1>

            <p className="mt-2 text-gray-500">
              View, manage, and access your event tickets.
            </p>
          </div>

          <Link
            to="/events"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Explore Events
          </Link>
        </div>

        {/* Checkout Confirmation */}
        {checkoutMessage && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5"
          >
            <h3 className="text-lg font-bold text-green-700">
              Booking Confirmed!
            </h3>

            <p className="mt-1 text-sm text-green-700">
              {checkoutMessage}
            </p>

            <p className="mt-2 break-all text-sm font-semibold text-green-800">
              Booking Reference:{" "}
              {checkoutBooking.bookingReference}
            </p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-4"
          >
            <p className="text-sm font-medium text-green-700">
              {success}
            </p>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-lg font-bold text-green-700"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Booking Statistics */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

          {/* Total Bookings */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Bookings
            </p>

            <h2 className="mt-3 text-3xl font-bold text-indigo-600">
              {totalBookings}
            </h2>
          </div>

          {/* Confirmed Bookings */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Confirmed
            </p>

            <h2 className="mt-3 text-3xl font-bold text-green-600">
              {confirmedBookings}
            </h2>
          </div>

          {/* Tickets Booked */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Active Tickets
            </p>

            <h2 className="mt-3 text-3xl font-bold text-purple-600">
              {totalTickets}
            </h2>
          </div>

          {/* Cancelled Bookings */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Cancelled
            </p>

            <h2 className="mt-3 text-3xl font-bold text-red-600">
              {cancelledBookings}
            </h2>
          </div>
        </div>

        {/* Filter Section */}
        <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Your Reservations
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredBookings.length} booking(s) found
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              {/* Filter Dropdown */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter bookings by status"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">
                  All Bookings ({totalBookings})
                </option>

                <option value="confirmed">
                  Confirmed ({confirmedBookings})
                </option>

                <option value="pending">
                  Pending ({pendingBookings})
                </option>

                <option value="cancelled">
                  Cancelled ({cancelledBookings})
                </option>
              </select>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() =>
                  setRefreshCount((previous) => previous + 1)
                }
                className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Empty Bookings */}
        {filteredBookings.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">

            <div className="mb-5 text-6xl" aria-hidden="true">
              🎟️
            </div>

            <h2 className="text-2xl font-bold text-gray-800">
              {filter === "all"
                ? "No Bookings Yet"
                : "No Matching Bookings"}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-gray-500">
              {filter === "all"
                ? "You haven't booked any events yet. Discover exciting events and reserve your tickets."
                : "You don't have any bookings with this status."}
            </p>

            {filter === "all" ? (
              <Link
                to="/events"
                className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                Browse Events
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                View All Bookings
              </button>
            )}
          </div>
        ) : (
          /* Booking Cards */
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onCancel={handleCancelBooking}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}