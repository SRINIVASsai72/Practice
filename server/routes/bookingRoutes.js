
const express = require("express");

const {
  createBooking,
  getMyBookings,
} = require("../controllers/bookingController");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all booking routes
router.use(authenticate);

// POST /api/bookings
// Create a new booking
router.post("/", createBooking);

// GET /api/bookings/my
// Get logged-in user's bookings
router.get("/my", getMyBookings);

module.exports = router;
