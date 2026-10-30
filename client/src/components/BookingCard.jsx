import { useState } from "react";
import TicketQRCode from "./TicketQRCode";
import { getBookingErrorMessage } from "../services/bookingApi";

export default function BookingCard({
  booking,
  onCancel,
  isCancelling = false,
}) {
  const [showQR, setShowQR] = useState(false);
  const [localCancelling, setLocalCancelling] = useState(false);
  const [error, setError] = useState("");

  if (!booking) return null;

  const event =
    booking.eventId && typeof booking.eventId === "object"
      ? booking.eventId
      : {};

  const status = String(booking.status || "pending").toLowerCase();

  const isConfirmed = status === "confirmed";
  const isCancelled = status === "cancelled";
  const isPending = status === "pending";

  const busy = isCancelling || localCancelling;

  const formatPrice = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "Unavailable";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = () => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleCancel = async () => {
    if (!isConfirmed || busy || typeof onCancel !== "function") {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    setLocalCancelling(true);
    setError("");

    try {
      await onCancel(booking._id);
      setShowQR(false);
    } catch (err) {
      setError(getBookingErrorMessage(err));
    } finally {
      setLocalCancelling(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-shadow hover:shadow-lg">

      {/* Event Image */}
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.title || "Booked Event"}
          className="h-48 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
          <h2 className="text-2xl font-bold text-white">
            EventPulse
          </h2>
        </div>
      )}

      <div className="p-6">

        {/* Event Name and Status */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">

          <div className="min-w-0 flex-1">
            <h3 className="break-words text-xl font-bold text-gray-800">
              {event.title || "Event Details Unavailable"}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {event.category || "Event"}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle()}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        {/* Event Information */}
        <div className="space-y-4">

          {/* Date */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Event Date
            </p>

            <p className="mt-1 text-sm font-medium text-gray-700">
              {formatDate(event.date)}
            </p>
          </div>

          {/* Venue */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Venue
            </p>

            <p className="mt-1 break-words text-sm font-medium text-gray-700">
              {[event.venue, event.city]
                .filter(Boolean)
                .join(", ") || "Venue unavailable"}
            </p>
          </div>

          {/* Booking Reference */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Booking Reference
            </p>

            <p className="mt-1 break-all font-mono text-sm font-semibold text-indigo-600">
              {booking.bookingReference || "Unavailable"}
            </p>
          </div>

          {/* Booking Date */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Booked On
            </p>

            <p className="mt-1 text-sm font-medium text-gray-700">
              {formatDate(booking.createdAt)}
            </p>
          </div>

        </div>

        {/* Price Summary */}
        <div className="mt-6 rounded-xl bg-gray-50 p-4">

          <div className="mb-3 flex justify-between gap-3 text-sm text-gray-600">
            <span>Tickets</span>

            <span className="font-semibold">
              {booking.quantity ?? "N/A"}
            </span>
          </div>

          <div className="flex justify-between gap-3 border-t border-gray-200 pt-3">
            <span className="font-semibold text-gray-800">
              Total Amount
            </span>

            <span className="text-lg font-bold text-indigo-600">
              {formatPrice(booking.totalAmount)}
            </span>
          </div>

        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">

          {/* View QR Ticket */}
          {isConfirmed && booking.bookingReference && (
            <button
              type="button"
              onClick={() => setShowQR((prev) => !prev)}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {showQR ? "Hide QR Ticket" : "View QR Ticket"}
            </button>
          )}

          {/* Cancel Booking */}
          {isConfirmed && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={
                busy ||
                typeof onCancel !== "function"
              }
              className="flex-1 rounded-xl border border-red-500 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Cancelling..." : "Cancel Booking"}
            </button>
          )}

          {/* Cancelled Status */}
          {isCancelled && (
            <div className="w-full rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
              Booking Cancelled
            </div>
          )}

          {/* Pending Status */}
          {isPending && (
            <div className="w-full rounded-xl bg-yellow-50 px-4 py-3 text-center text-sm font-semibold text-yellow-700">
              Booking Pending Confirmation
            </div>
          )}

        </div>

        {/* QR Digital Ticket */}
        {isConfirmed &&
          showQR &&
          booking.bookingReference && (
            <div className="mt-6 border-t border-gray-200 pt-6">

              <div className="text-center">
                <h4 className="text-lg font-bold text-gray-800">
                  Your Digital Ticket
                </h4>

                <p className="mt-2 text-sm text-gray-500">
                  Booking identification QR code
                </p>
              </div>

              <div className="mt-5 flex justify-center">
                <TicketQRCode
                  bookingReference={booking.bookingReference}
                />
              </div>

              <p className="mt-4 text-center text-xs text-gray-500">
                This QR code identifies your booking.
                Entry requires validation by the event organizer.
              </p>

            </div>
          )}

      </div>
    </div>
  );
}