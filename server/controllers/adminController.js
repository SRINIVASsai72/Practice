
const mongoose = require("mongoose");
const Event = require("../models/Event");
const {
  updateEventSafely,
  deleteEventSafely
} = require("../services/eventService");

// Fields that an admin can provide when creating an event
const CREATE_FIELDS = [
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

// POST /api/events
const createEvent = async (req, res) => {
  try {
    // Authentication and admin authorization are handled
    // by Person 4's middleware before this controller.
    const adminId = req.user?.id;

    if (!adminId || !mongoose.isObjectIdOrHexString(adminId)) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    if (!req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)) {
      return res.status(400).json({
        message: "Event details must be a JSON object"
      });
    }

    // Reject fields that the client is not allowed to set.
    // This includes bookedSeats, createdBy and _id.
    const unexpectedFields = Object.keys(req.body).filter(
      (field) => !CREATE_FIELDS.includes(field)
    );

    if (unexpectedFields.length > 0) {
      return res.status(400).json({
        message: `Unsupported event fields: ${unexpectedFields.join(", ")}`
      });
    }

    // Explicitly copy only approved fields
    const eventData = {};

    for (const field of CREATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        eventData[field] = req.body[field];
      }
    }

    // Reject incorrect numeric types instead of silently casting them
    if (
      typeof eventData.price !== "number" ||
      !Number.isFinite(eventData.price) ||
      eventData.price < 0
    ) {
      return res.status(400).json({
        message: "Price must be a nonnegative number"
      });
    }

    if (
      !Number.isSafeInteger(eventData.totalSeats) ||
      eventData.totalSeats < 1
    ) {
      return res.status(400).json({
        message: "Total seats must be a positive integer"
      });
    }

    // Use authenticated user as the creator
    const event = new Event({
      ...eventData,
      createdBy: adminId,
      bookedSeats: 0
    });

    // Validate before saving
    await event.validate();
    await event.save();

    return res.status(201).json({
      message: "Event created successfully",
      event
    });

  } catch (error) {
    if (error.name === "ValidationError" ||
        error.name === "CastError") {
      return res.status(400).json({
        message: error.message
      });
    }

    console.error("Create event error:", error);

    return res.status(500).json({
      message: "Failed to create event"
    });
  }
};


/**
 * PUT /api/events/:id
 * Update event details and capacity (admin only)
 */
const updateEvent = async (req, res) => {
  try {
    const event = await updateEventSafely(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      message: "Event updated successfully",
      event
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message: error.message
      });
    }

    console.error("Update event error:", error);

    return res.status(500).json({
      message: "Failed to update event"
    });
  }
};


/**
 * DELETE /api/events/:id
 * Delete an event only when no confirmed bookings exist.
 */
const deleteEvent = async (req, res) => {
  try {
    const result = await deleteEventSafely(req.params.id);

    return res.status(200).json({
      message: result.message
    });

  } catch (error) {
    // Handle known errors from eventService
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message: error.message
      });
    }

    console.error("Delete event error:", error);

    return res.status(500).json({
      message: "Failed to delete event"
    });
  }
};


module.exports = {
  createEvent,
  updateEvent,
  deleteEvent
};
