
const express = require("express");
const router = express.Router();

const {
  getEvents,
  getEventById
} = require("../controllers/eventController");

const {
  createEvent
} = require("../controllers/adminController");

// Person 4 owns this middleware.
// It will become available after integration.
const {
  authenticate,
  requireAdmin
} = require("../middleware/authMiddleware");

// Public routes
router.get("/", getEvents);
router.get("/:id", getEventById);

// Admin-only route
router.post("/", authenticate, requireAdmin, createEvent);

module.exports = router;
