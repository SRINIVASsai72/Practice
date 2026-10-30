import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const adminClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to protected requests
adminClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("eventpulse_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Fetch admin dashboard statistics
export const getAdminStats = async () => {
  const response = await adminClient.get("/admin/stats");

  return response.data;
};

// Fetch all bookings for admin
export const getAllBookings = async () => {
  const response = await adminClient.get("/admin/bookings");

  return response.data;
};

// Fetch all events
export const getAdminEvents = async () => {
  const response = await adminClient.get("/events");

  return response.data;
};

// Fetch a single event
export const getAdminEventById = async (eventId) => {
  if (!eventId) {
    throw new Error("Event ID is required.");
  }

  const response = await adminClient.get(
    `/events/${encodeURIComponent(eventId)}`
  );

  return response.data;
};

// Create a new event
export const createEvent = async (eventData) => {
  const response = await adminClient.post(
    "/events",
    eventData
  );

  return response.data;
};

// Update an existing event
export const updateEvent = async (eventId, eventData) => {
  if (!eventId) {
    throw new Error("Event ID is required.");
  }

  const response = await adminClient.put(
    `/events/${encodeURIComponent(eventId)}`,
    eventData
  );

  return response.data;
};

// Delete an event
export const deleteEvent = async (eventId) => {
  if (!eventId) {
    throw new Error("Event ID is required.");
  }

  const response = await adminClient.delete(
    `/events/${encodeURIComponent(eventId)}`
  );

  return response.data;
};

// Handle admin API errors
export const getAdminErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.status === 400) {
    return "Invalid information. Please check your inputs.";
  }

  if (error.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error.response?.status === 403) {
    return "Access denied. Admin privileges are required.";
  }

  if (error.response?.status === 404) {
    return "The requested resource was not found.";
  }

  if (error.response?.status === 409) {
    return "This action conflicts with existing bookings or event capacity.";
  }

  if (error.response?.status >= 500) {
    return "Server error. Please try again later.";
  }

  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please refresh and verify the result before retrying.";
  }

  if (error.request) {
    return "Unable to connect to the server. Please check your connection.";
  }

  return error.message || "Something went wrong. Please try again.";
};