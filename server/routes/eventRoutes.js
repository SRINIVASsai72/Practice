
const express = require("express");
const router = express.Router();

const {
  getEvents,
  getEventById
} = require("../controllers/eventController");

// Public routes — authentication not required
router.get("/", getEvents);
router.get("/:id", getEventById);

module.exports = router;
