
const mongoose = require("mongoose");
const crypto = require("node:crypto");

const Event = require("../models/Event");
const Booking = require("../models/Booking");

const MAX_TRANSACTION_ATTEMPTS = 5;
const MAX_COMMIT_ATTEMPTS = 5;

// Consistent application errors
class BookingError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "BookingError";
    this.statusCode = statusCode;
  }
}

// Check MongoDB transaction error labels
const hasLabel = (error, label) =>
  typeof error?.hasErrorLabel === "function" &&
  error.hasErrorLabel(label);

// Generate an unpredictable booking reference
const generateBookingReference = () =>
  `EP-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;

// Verify whether a retry matches the original request
const checkExistingBooking = async (
  userId,
  eventId,
  quantity,
  idempotencyKey
) => {
  const booking = await Booking.findOne({
    userId,
    idempotencyKey,
  });

  if (!booking) return null;

  if (
    booking.eventId.toString() !== eventId.toString() ||
    booking.quantity !== quantity
  ) {
    throw new BookingError(
      "Idempotency key already used for a different booking",
      409
    );
  }

  return booking;
};

// Commit the SAME transaction again if the result is uncertain
const commitWithRetry = async (session) => {
  for (let attempt = 1; attempt <= MAX_COMMIT_ATTEMPTS; attempt++) {
    try {
      await session.commitTransaction();
      return;
    } catch (error) {
      if (!hasLabel(error, "UnknownTransactionCommitResult")) {
        throw error;
      }

      if (attempt === MAX_COMMIT_ATTEMPTS) {
        throw new BookingError(
          "Booking result uncertain. Retry with the same Idempotency-Key.",
          503
        );
      }
    }
  }
};

// Reserve tickets and create a booking atomically
const createBooking = async ({
  userId,
  eventId,
  quantity,
  idempotencyKey,
}) => {
  // Validate inputs before starting a transaction
  if (!mongoose.isValidObjectId(userId)) {
    throw new BookingError("Invalid user ID", 400);
  }

  if (
    typeof eventId !== "string" ||
    !mongoose.isValidObjectId(eventId)
  ) {
    throw new BookingError("Invalid event ID", 400);
  }

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new BookingError(
      "Quantity must be a positive integer",
      400
    );
  }

  if (
    typeof idempotencyKey !== "string" ||
    !/^[A-Za-z0-9_-]{8,200}$/.test(idempotencyKey)
  ) {
    throw new BookingError(
      "Valid Idempotency-Key header is required",
      400
    );
  }

  // First check for an already completed request
  const existing = await checkExistingBooking(
    userId,
    eventId,
    quantity,
    idempotencyKey
  );

  if (existing) return existing;

  for (
    let attempt = 1;
    attempt <= MAX_TRANSACTION_ATTEMPTS;
    attempt++
  ) {
    const session = await mongoose.startSession();
    let commitStarted = false;

    try {
      session.startTransaction({
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      });

      // Check again within the transaction
      const duplicate = await Booking.findOne({
        userId,
        idempotencyKey,
      }).session(session);

      if (duplicate) {
        if (
          duplicate.eventId.toString() !== eventId ||
          duplicate.quantity !== quantity
        ) {
          throw new BookingError(
            "Idempotency key already used for a different booking",
            409
          );
        }

        await session.abortTransaction();
        return duplicate;
      }

      // Read trusted event pricing from MongoDB
      const event = await Event.findById(eventId)
        .select("price")
        .session(session);

      if (!event) {
        throw new BookingError("Event not found", 404);
      }

      if (
        typeof event.price !== "number" ||
        !Number.isFinite(event.price) ||
        event.price < 0
      ) {
        throw new BookingError("Invalid event price", 500);
      }

      const totalAmount =
        Math.round((event.price * quantity + Number.EPSILON) * 100) / 100;

      if (!Number.isSafeInteger(Math.round(totalAmount * 100))) {
        throw new BookingError("Invalid booking amount", 400);
      }

      // Atomic conditional reservation
      const result = await Event.updateOne(
        {
          _id: event._id,
          $expr: {
            $lte: [
              "$bookedSeats",
              { $subtract: ["$totalSeats", quantity] },
            ],
          },
        },
        {
          $inc: { bookedSeats: quantity },
        },
        { session }
      );

      if (result.modifiedCount !== 1) {
        throw new BookingError(
          "Not enough tickets available",
          409
        );
      }

      // Create booking inside the SAME transaction
      const [booking] = await Booking.create(
        [
          {
            userId,
            eventId,
            quantity,
            totalAmount,
            bookingReference: generateBookingReference(),
            status: "confirmed",
            idempotencyKey,
          },
        ],
        { session }
      );

      commitStarted = true;
      await commitWithRetry(session);

      return booking;
    } catch (error) {
      if (!commitStarted) {
        try {
          if (session.inTransaction()) {
            await session.abortTransaction();
          }
        } catch (abortError) {
          console.error("Transaction abort error:", abortError);
        }
      }

      // After an uncertain commit, never start a new
      // transaction automatically for this request.
      if (commitStarted) {
        if (hasLabel(error, "TransientTransactionError")) {
          throw new BookingError(
            "Booking result uncertain. Retry with the same Idempotency-Key.",
            503
          );
        }

        if (error instanceof BookingError) {
          throw error;
        }

        throw new BookingError(
          "Booking result uncertain. Retry with the same Idempotency-Key.",
          503
        );
      }

      // Another request may have committed with the same key
      if (error.code === 11000) {
        const savedBooking = await checkExistingBooking(
          userId,
          eventId,
          quantity,
          idempotencyKey
        );

        if (savedBooking) return savedBooking;

        // If index conflict was on another unique field,
        // retry with a new reference when attempts remain.
        if (attempt < MAX_TRANSACTION_ATTEMPTS) {
          continue;
        }
      }

      // Retry transient transaction conflicts
      if (
        hasLabel(error, "TransientTransactionError") &&
        attempt < MAX_TRANSACTION_ATTEMPTS
      ) {
        const savedBooking = await checkExistingBooking(
          userId,
          eventId,
          quantity,
          idempotencyKey
        );

        if (savedBooking) return savedBooking;

        continue;
      }

      if (error instanceof BookingError) {
        throw error;
      }

      if (
        hasLabel(error, "TransientTransactionError") ||
        error.code === 11000
      ) {
        throw new BookingError(
          "Booking is busy. Retry with the same Idempotency-Key.",
          503
        );
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }

  throw new BookingError(
    "Booking could not be completed. Please retry.",
    503
  );
};

module.exports = {
  createBooking,
  BookingError,
};
