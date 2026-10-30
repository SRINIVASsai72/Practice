
const express = require("express");
const router = express.Router();

const {
  getEvents,
  getEventById
} = require("../controllers/eventController");

const {
  createEvent,
  updateEvent
} = require("../controllers/adminController");

// Person 4's authentication middleware
const {
  authenticate,
  requireAdmin
} = require("../middleware/authMiddleware");

// Public routes
router.get("/", getEvents);
router.get("/:id", getEventById);

// Admin-only routes
router.post("/", authenticate, requireAdmin, createEvent);
router.put("/:id", authenticate, requireAdmin, updateEvent);

module.exports = router;
