
const mongoose = require("mongoose");
const Event = require("../models/Event");
const Booking = require("../models/Booking");

// Fields that admins are allowed to update
const UPDATE_FIELDS = [
  "title",
  "description",
  "category",
  "venue",
  "city",
  "date",
  "imageUrl",
  "price",
  "totalSeats"
];

// Update event details and capacity safely
const updateEventSafely = async (eventId, updates) => {
  if (!mongoose.isObjectIdOrHexString(eventId)) {
    const error = new Error("Invalid event ID");
    error.statusCode = 400;
    throw error;
  }

  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    const error = new Error("Invalid update data");
    error.statusCode = 400;
    throw error;
  }

  const keys = Object.keys(updates);

  if (keys.length === 0) {
    const error = new Error("Provide fields to update");
    error.statusCode = 400;
    throw error;
  }

  // Block unknown fields, including bookedSeats
  const invalidFields = keys.filter(
    (key) => !UPDATE_FIELDS.includes(key)
  );

  if (invalidFields.length > 0) {
    const error = new Error(
      `Fields cannot be updated: ${invalidFields.join(", ")}`
    );
    error.statusCode = 400;
    throw error;
  }

  // Explicitly validate important numeric fields
  if ("price" in updates) {
    if (
      typeof updates.price !== "number" ||
      !Number.isFinite(updates.price) ||
      updates.price < 0
    ) {
      const error = new Error(
        "Price must be a nonnegative number"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if ("totalSeats" in updates) {
    if (
      !Number.isSafeInteger(updates.totalSeats) ||
      updates.totalSeats < 1
    ) {
      const error = new Error(
        "Total seats must be a positive integer"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Condition evaluated atomically by MongoDB
  const filter = { _id: eventId };

  if ("totalSeats" in updates) {
    filter.bookedSeats = {
      $lte: updates.totalSeats
    };
  }

  const event = await Event.findOneAndUpdate(
    filter,
    { $set: updates },
    {
      returnDocument: "after",
      runValidators: true
    }
  );

  if (event) {
    return event;
  }

  // Find why the update did not match
  const exists = await Event.exists({ _id: eventId });

  const error = new Error(
    exists
      ? "Cannot reduce capacity below booked seats"
      : "Event not found"
  );

  error.statusCode = exists ? 409 : 404;
  throw error;
};


/**
 * Safely delete an event only if it has no
 * confirmed bookings.
 */
const deleteEventSafely = async (eventId) => {
  if (!mongoose.isObjectIdOrHexString(eventId)) {
    const error = new Error("Invalid event ID");
    error.statusCode = 400;
    throw error;
  }

  return mongoose.connection.transaction(async (session) => {
    // Read the event inside the transaction
    const event = await Event.findById(eventId).session(session);

    if (!event) {
      const error = new Error("Event not found");
      error.statusCode = 404;
      throw error;
    }

    // Active reserved seats mean deletion is not allowed
    if (event.bookedSeats > 0) {
      const error = new Error(
        "Cannot delete an event with confirmed bookings"
      );
      error.statusCode = 409;
      throw error;
    }

    // Check the Booking collection as an additional safeguard
    const confirmedBooking = await Booking.exists({
      event: event._id,
      status: "confirmed"
    }).session(session);

    if (confirmedBooking) {
      const error = new Error(
        "Cannot delete an event with confirmed bookings"
      );
      error.statusCode = 409;
      throw error;
    }

    // Delete within the same transaction
    const result = await Event.deleteOne({
      _id: event._id,
      bookedSeats: 0
    }).session(session);

    if (result.deletedCount !== 1) {
      const error = new Error(
        "Event could not be deleted safely"
      );
      error.statusCode = 409;
      throw error;
    }

    return {
      message: "Event deleted successfully"
    };
  });
};


module.exports = {
  updateEventSafely,
  deleteEventSafely
};