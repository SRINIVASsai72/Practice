
const Booking = require("../models/Booking");

const {
  createBooking: createBookingService,
  BookingError,
} = require("../services/bookingService");

// POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const { eventId, quantity } = req.body || {};

    const idempotencyKey = req.get("Idempotency-Key");

    const booking = await createBookingService({
      userId: req.user.id,
      eventId,
      quantity,
      idempotencyKey,
    });

    return res.status(201).json({
      booking,
      message: "Booking confirmed",
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error("Create booking error:", error);

    return res.status(500).json({
      message: "Unable to process booking",
    });
  }
};

// GET /api/bookings/my
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("eventId", "title price");

    return res.status(200).json({
      bookings,
    });
  } catch (error) {
    console.error("Fetch bookings error:", error);

    return res.status(500).json({
      message: "Unable to fetch bookings",
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
};
