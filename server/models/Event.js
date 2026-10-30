
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [3, "Title must have at least 3 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"]
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true
    },

    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true
    },

    date: {
      type: Date,
      required: [true, "Event date is required"]
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: (value) =>
          !value || /^https?:\/\/\S+$/i.test(value),
        message: "Invalid image URL"
      }
    },

    price: {
      type: Number,
      required: [true, "Ticket price is required"],
      min: [0, "Price cannot be negative"]
    },

    totalSeats: {
      type: Number,
      required: [true, "Total seats are required"],
      min: [1, "Total seats must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Total seats must be an integer"
      }
    },

    bookedSeats: {
      type: Number,
      default: 0,
      min: [0, "Booked seats cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Booked seats must be an integer"
      }
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Event creator is required"]
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Prevent bookedSeats from exceeding totalSeats
eventSchema.pre("validate", function () {
  if (
    this.totalSeats != null &&
    this.bookedSeats != null &&
    this.bookedSeats > this.totalSeats
  ) {
    this.invalidate(
      "bookedSeats",
      "Booked seats cannot exceed total seats"
    );
  }
});

// Automatically calculate available seats
eventSchema.virtual("availableSeats").get(function () {
  return this.totalSeats - this.bookedSeats;
});

// Improve event filtering performance
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1, city: 1, date: 1 });

module.exports = mongoose.model("Event", eventSchema);
