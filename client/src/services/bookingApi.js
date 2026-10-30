import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const bookingClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to requests
bookingClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("eventpulse_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Fetch event details for checkout
export const getCheckoutEvent = async (eventId) => {
  const response = await bookingClient.get(
    `/events/${encodeURIComponent(eventId)}`
  );

  return response.data;
};

// Generate a unique key for each new booking attempt
export const createBookingAttemptKey = () => {
  return crypto.randomUUID();
};

// Create a booking
export const createBooking = async ({
  eventId,
  quantity,
  idempotencyKey,
}) => {
  if (!idempotencyKey) {
    throw new Error("Booking attempt key is required.");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Please select a valid ticket quantity.");
  }

  const response = await bookingClient.post(
    "/bookings",
    {
      eventId,
      quantity,
    },
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }
  );

  return response.data;
};

// Fetch bookings of the logged-in user
export const getMyBookings = async () => {
  const response = await bookingClient.get("/bookings/my");

  return response.data;
};

// Cancel a booking
export const cancelBooking = async (bookingId) => {
  const response = await bookingClient.patch(
    `/bookings/${encodeURIComponent(bookingId)}/cancel`
  );

  return response.data;
};

// Handle booking API errors
export const getBookingErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.status === 409) {
    return "Booking could not be completed. Please check ticket availability.";
  }

  if (error.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please check your booking status before retrying.";
  }

  if (error.request) {
    return "Unable to confirm the request. Please check your bookings before trying again.";
  }

  return error.message || "Something went wrong. Please try again.";
};