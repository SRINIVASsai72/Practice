
const express = require("express");
const cors = require("cors");

const eventRoutes = require("./routes/eventRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health-check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "EventPulse API is running"
  });
});

// API routes
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Express error:", err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON request body"
    });
  }

  return res.status(500).json({
    message: "Internal server error"
  });
});

module.exports = app;
