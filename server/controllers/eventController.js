
const mongoose = require("mongoose");
const Event = require("../models/Event");

// GET /api/events
const getEvents = async (req, res) => {
  try {
    const { search, category, city, date } = req.query;
    const filter = {};

    // Search title and description
    if (search) {
      if (typeof search !== "string") {
        return res.status(400).json({ message: "Invalid search" });
      }

      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } }
      ];
    }

    // Filter by category
    if (category) {
      if (typeof category !== "string") {
        return res.status(400).json({ message: "Invalid category" });
      }
      filter.category = category;
    }

    // Filter by city
    if (city) {
      if (typeof city !== "string") {
        return res.status(400).json({ message: "Invalid city" });
      }
      filter.city = city;
    }

    // Filter events occurring on a specific calendar date (UTC)
    if (date) {
      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      ) {
        return res.status(400).json({
          message: "Date must be in YYYY-MM-DD format"
        });
      }

      const start = new Date(`${date}T00:00:00.000Z`);

      if (
        Number.isNaN(start.getTime()) ||
        start.toISOString().slice(0, 10) !== date
      ) {
        return res.status(400).json({
          message: "Invalid calendar date"
        });
      }

      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);

      filter.date = {
        $gte: start,
        $lt: end
      };
    }

    const events = await Event.find(filter).sort({ date: 1 });

    return res.status(200).json({ events });
  } catch (error) {
    console.error("Get events error:", error);
    return res.status(500).json({
      message: "Failed to fetch events"
    });
  }
};

// GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({
        message: "Invalid event ID"
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    return res.status(200).json({ event });
  } catch (error) {
    console.error("Get event error:", error);
    return res.status(500).json({
      message: "Failed to fetch event"
    });
  }
};

module.exports = {
  getEvents,
  getEventById
};
