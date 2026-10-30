
const express = require("express");
const router = express.Router();

const {
  getEvents,
  getEventById
} = require("../controllers/eventController");

const {
  createEvent,
  updateEvent,
  deleteEvent
} = require("../controllers/adminController");

// Authentication middleware owned by Person 4
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

router.delete("/:id", authenticate, requireAdmin, deleteEvent);

module.exports = router;
