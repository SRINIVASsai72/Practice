
const mongoose = require("mongoose");
const Event = require("../models/Event");

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

module.exports = {
  updateEventSafely
};
