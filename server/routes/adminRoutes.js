
const express = require("express");
const router = express.Router();

const {
  getAdminStats,
  getAdminBookings
} = require("../controllers/adminController");

// Authentication middleware owned by Person 4
const {
  authenticate,
  requireAdmin
} = require("../middleware/authMiddleware");

// Protect all routes in this router
router.use(authenticate, requireAdmin);

// GET /api/admin/stats
router.get("/stats", getAdminStats);

// GET /api/admin/bookings
router.get("/bookings", getAdminBookings);

module.exports = router;
