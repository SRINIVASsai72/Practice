import { useEffect, useRef, useState } from "react";
import { getBookingErrorMessage } from "../services/bookingApi";

export default function BookingForm({
  event,
  onBook,
  isSubmitting = false,
  error = "",
}) {
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const submissionLock = useRef(false);

  const availableSeats =
    event?.availableSeats != null
      ? Number(event.availableSeats)
      : event?.totalSeats != null && event?.bookedSeats != null
        ? Math.max(
            0,
            Number(event.totalSeats) - Number(event.bookedSeats)
          )
        : null;

  const soldOut = availableSeats !== null && availableSeats <= 0;

  const maxQuantity =
    availableSeats === null
      ? 10
      : Math.min(10, Math.max(0, availableSeats));

  const ticketPrice = Number(event?.price);

  const validPrice =
    Number.isFinite(ticketPrice) && ticketPrice >= 0;

  const totalPrice = validPrice ? ticketPrice * quantity : 0;

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  useEffect(() => {
    setQuantity(1);
    setLocalError("");
  }, [event?._id]);

  useEffect(() => {
    if (maxQuantity > 0) {
      setQuantity((prev) => Math.min(Math.max(1, prev), maxQuantity));
    }
  }, [maxQuantity]);

  const handleQuantityChange = (value) => {
    const updatedQuantity = Number(value);

    if (
      Number.isInteger(updatedQuantity) &&
      updatedQuantity >= 1 &&
      updatedQuantity <= maxQuantity
    ) {
      setQuantity(updatedQuantity);
      setLocalError("");
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    if (submissionLock.current || submitting || isSubmitting) {
      return;
    }

    if (!event?._id) {
      setLocalError("Event information is unavailable.");
      return;
    }

    if (soldOut) {
      setLocalError("Sorry, this event is sold out.");
      return;
    }

    if (!validPrice) {
      setLocalError("Ticket price is unavailable.");
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > maxQuantity
    ) {
      setLocalError("Please select a valid ticket quantity.");
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);
    setLocalError("");

    try {
      await onBook(quantity);
    } catch (err) {
      setLocalError(getBookingErrorMessage(err));
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  if (!event) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-md">
        <p className="text-gray-500">
          Event details are unavailable.
        </p>
      </div>
    );
  }

  const busy = submitting || isSubmitting;

  return (
    <div className="w-full rounded-2xl bg-white p-6 shadow-lg">

      {/* Header */}
      <h2 className="mb-2 text-2xl font-bold text-gray-800">
        Book Your Tickets
      </h2>

      <p className="mb-6 text-sm text-gray-500">
        Select the number of tickets you want to book.
      </p>

      {/* Event Information */}
      <div className="mb-6 rounded-xl bg-indigo-50 p-4">
        <h3 className="text-lg font-semibold text-indigo-700">
          {event.title}
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          {event.venue}, {event.city}
        </p>

        <p className="mt-2 text-sm text-gray-600">
          Price per ticket:{" "}
          <span className="font-semibold">
            {validPrice
              ? formatPrice(ticketPrice)
              : "Unavailable"}
          </span>
        </p>

        <p className="mt-2 text-sm">
          {soldOut ? (
            <span className="font-semibold text-red-600">
              Sold Out
            </span>
          ) : availableSeats !== null ? (
            <span className="font-medium text-green-600">
              {availableSeats} seats currently available
            </span>
          ) : (
            <span className="text-gray-500">
              Availability will be checked during booking
            </span>
          )}
        </p>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleBooking}>

        {/* Quantity Selection */}
        <div className="mb-6">
          <label
            htmlFor="ticket-quantity"
            className="mb-3 block font-medium text-gray-700"
          >
            Number of Tickets
          </label>

          <div className="flex items-center gap-4">

            {/* Decrease */}
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || soldOut || busy}
              className="h-11 w-11 rounded-lg bg-gray-100 text-xl font-bold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease ticket quantity"
            >
              −
            </button>

            {/* Quantity */}
            <input
              id="ticket-quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              disabled={soldOut || busy}
              className="h-11 w-20 rounded-lg border border-gray-300 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Increase */}
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={
                quantity >= maxQuantity || soldOut || busy
              }
              className="h-11 w-11 rounded-lg bg-gray-100 text-xl font-bold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase ticket quantity"
            >
              +
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Maximum {maxQuantity} tickets per booking.
          </p>
        </div>

        {/* Price Summary */}
        <div className="mb-6 rounded-xl bg-gray-50 p-4">
          <h3 className="mb-4 font-semibold text-gray-800">
            Booking Summary
          </h3>

          <div className="mb-3 flex justify-between text-gray-600">
            <span>Ticket Price</span>
            <span>
              {validPrice
                ? formatPrice(ticketPrice)
                : "Unavailable"}
            </span>
          </div>

          <div className="mb-3 flex justify-between text-gray-600">
            <span>Quantity</span>
            <span>{quantity}</span>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between text-lg font-bold text-gray-800">
              <span>Estimated Total</span>
              <span className="text-indigo-600">
                {validPrice
                  ? formatPrice(totalPrice)
                  : "Unavailable"}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {(localError || error) && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {localError || error}
          </div>
        )}

        {/* Booking Button */}
        <button
          type="submit"
          disabled={
            soldOut ||
            busy ||
            !validPrice ||
            typeof onBook !== "function"
          }
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? "Processing Booking..."
            : soldOut
              ? "Sold Out"
              : "Confirm Booking"}
        </button>

        <p className="mt-3 text-center text-xs text-gray-500">
          Ticket availability and final price are confirmed by
          the server when your booking is submitted.
        </p>
      </form>
    </div>
  );
}