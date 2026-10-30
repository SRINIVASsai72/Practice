const express = require("express");

const {
  createBooking,
  getMyBookings,
  cancelBooking,
} = require("../controllers/bookingController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all booking routes
router.use(authenticate);

// Create a booking
router.post("/", createBooking);

// Get my bookings
router.get("/my", getMyBookings);

// Cancel a booking
router.patch("/:id/cancel", cancelBooking);

module.exports = router;