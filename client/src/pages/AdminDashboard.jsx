import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  getAdminStats,
  getAllBookings,
  getAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getAdminErrorMessage,
} from "../services/adminApi";

const initialForm = {
  title: "",
  description: "",
  category: "",
  venue: "",
  city: "",
  date: "",
  imageUrl: "",
  price: "",
  totalSeats: "",
};

const formatCurrency = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Invalid date";
  }

  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toDateInput = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  const pad = (value) => String(value).padStart(2, "0");

  return (
    `${parsed.getFullYear()}-` +
    `${pad(parsed.getMonth() + 1)}-` +
    `${pad(parsed.getDate())}T` +
    `${pad(parsed.getHours())}:` +
    `${pad(parsed.getMinutes())}`
  );
};

const getAvailableSeats = (event) => {
  const total = Number(event.totalSeats || 0);
  const booked = Number(event.bookedSeats || 0);

  const remaining = Math.max(0, total - booked);

  if (event.availableSeats != null) {
    const available = Number(event.availableSeats);

    if (Number.isFinite(available)) {
      return Math.max(0, available);
    }
  }

  return remaining;
};

const statusStyle = (status) => {
  switch (String(status).toLowerCase()) {
    case "confirmed":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    case "pending":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState("events");

  const [stats, setStats] = useState({
    totalEvents: 0,
    totalBookings: 0,
    ticketsSold: 0,
    totalRevenue: 0,
  });

  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");

  // Fetch dashboard information
  const fetchDashboard = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [statsResponse, eventsResponse, bookingsResponse] =
        await Promise.all([
          getAdminStats(),
          getAdminEvents(),
          getAllBookings(),
        ]);

      if (
        !Array.isArray(eventsResponse?.events) ||
        !Array.isArray(bookingsResponse?.bookings)
      ) {
        throw new Error("Invalid dashboard data received.");
      }

      setStats({
        totalEvents: Number(statsResponse.totalEvents || 0),
        totalBookings: Number(statsResponse.totalBookings || 0),
        ticketsSold: Number(statsResponse.ticketsSold || 0),
        totalRevenue: Number(statsResponse.totalRevenue || 0),
      });

      setEvents(eventsResponse.events);
      setBookings(bookingsResponse.bookings);

      return true;
    } catch (err) {
      setError(getAdminErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboard();
    }
  }, [isAdmin, fetchDashboard]);

  // Input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  };

  // Open create form
  const handleCreateClick = () => {
    setEditingEvent(null);
    setFormData(initialForm);
    setFormError("");
    setSuccess("");
    setShowForm(true);
    setActiveTab("events");
  };

  // Open edit form
  const handleEditClick = (event) => {
    setEditingEvent(event);

    setFormData({
      title: event.title || "",
      description: event.description || "",
      category: event.category || "",
      venue: event.venue || "",
      city: event.city || "",
      date: toDateInput(event.date),
      imageUrl: event.imageUrl || "",
      price: String(event.price ?? ""),
      totalSeats: String(event.totalSeats ?? ""),
    });

    setFormError("");
    setSuccess("");
    setShowForm(true);
    setActiveTab("events");
  };

  // Close event form
  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingEvent(null);
    setFormData(initialForm);
    setFormError("");
  };

  // Validate event form
  const validateEvent = () => {
    if (!formData.title.trim()) {
      return "Event title is required.";
    }

    if (!formData.description.trim()) {
      return "Event description is required.";
    }

    if (!formData.category.trim()) {
      return "Event category is required.";
    }

    if (!formData.venue.trim()) {
      return "Venue is required.";
    }

    if (!formData.city.trim()) {
      return "City is required.";
    }

    if (!formData.date) {
      return "Event date is required.";
    }

    const eventDate = new Date(formData.date);

    if (Number.isNaN(eventDate.getTime())) {
      return "Enter a valid event date.";
    }

    if (formData.price.trim() === "") {
      return "Ticket price is required.";
    }

    const price = Number(formData.price);

    if (!Number.isFinite(price) || price < 0) {
      return "Ticket price must be zero or greater.";
    }

    if (formData.totalSeats.trim() === "") {
      return "Total seat capacity is required.";
    }

    const totalSeats = Number(formData.totalSeats);

    if (!Number.isInteger(totalSeats) || totalSeats < 0) {
      return "Seat capacity must be a non-negative whole number.";
    }

    if (editingEvent) {
      const bookedSeats = Number(editingEvent.bookedSeats || 0);

      if (totalSeats < bookedSeats) {
        return `Capacity cannot be less than ${bookedSeats} already booked seats.`;
      }
    }

    if (formData.imageUrl.trim()) {
      try {
        const url = new URL(formData.imageUrl.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          return "Image URL must use HTTP or HTTPS.";
        }
      } catch {
        return "Enter a valid image URL.";
      }
    }

    return "";
  };

  // Create or update event
  const handleSaveEvent = async (e) => {
    e.preventDefault();

    if (saving) return;

    const validationError = validateEvent();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");
    setSuccess("");

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      venue: formData.venue.trim(),
      city: formData.city.trim(),
      date: new Date(formData.date).toISOString(),
      imageUrl: formData.imageUrl.trim(),
      price: Number(formData.price),
      totalSeats: Number(formData.totalSeats),
    };

    try {
      if (editingEvent) {
        await updateEvent(editingEvent._id, eventData);

        setSuccess("Event updated successfully.");
      } else {
        await createEvent(eventData);

        setSuccess("Event created successfully.");
      }

      setShowForm(false);
      setEditingEvent(null);
      setFormData(initialForm);

      await fetchDashboard(true);
    } catch (err) {
      setFormError(getAdminErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (event) => {
    if (deletingId || saving) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"?\n\nThis action may affect existing bookings.`
    );

    if (!confirmed) return;

    setDeletingId(event._id);
    setError("");
    setSuccess("");

    try {
      await deleteEvent(event._id);

      setSuccess("Event deleted successfully.");

      await fetchDashboard(true);
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    const query = search.toLowerCase().trim();

    return (
      String(event.title || "").toLowerCase().includes(query) ||
      String(event.city || "").toLowerCase().includes(query) ||
      String(event.category || "").toLowerCase().includes(query)
    );
  });

  // Sort bookings
  const sortedBookings = [...bookings].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
  );

  // Admin access check
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-3xl font-bold text-red-600">
            Access Denied
          </h1>

          <p className="mt-4 text-gray-600">
            You need administrator privileges to access this page.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Initial loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

          <p className="mt-4 text-gray-600">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        {/* Dashboard Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Manage events, bookings, and platform statistics.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing || saving}
              className="rounded-xl border border-indigo-600 px-5 py-3 font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handleCreateClick}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              + Create Event
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="font-bold text-red-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 p-4"
          >
            <p className="text-sm font-medium text-green-700">
              {success}
            </p>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
              className="font-bold text-green-700"
            >
              ×
            </button>
          </div>
        )}

        {/* KPI Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total Events */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Total Events
              </p>

              <span className="rounded-lg bg-indigo-100 p-3 text-xl">
                📅
              </span>
            </div>

            <h2 className="text-3xl font-bold text-indigo-600">
              {stats.totalEvents}
            </h2>

            <p className="mt-2 text-xs text-gray-400">
              Events on the platform
            </p>
          </div>

          {/* Total Bookings */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Total Bookings
              </p>

              <span className="rounded-lg bg-purple-100 p-3 text-xl">
                🎟️
              </span>
            </div>

            <h2 className="text-3xl font-bold text-purple-600">
              {stats.totalBookings}
            </h2>

            <p className="mt-2 text-xs text-gray-400">
              Booking records
            </p>
          </div>

          {/* Tickets Sold */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Tickets Sold
              </p>

              <span className="rounded-lg bg-green-100 p-3 text-xl">
                ✅
              </span>
            </div>

            <h2 className="text-3xl font-bold text-green-600">
              {stats.ticketsSold}
            </h2>

            <p className="mt-2 text-xs text-gray-400">
              Tickets reported by the server
            </p>
          </div>

          {/* Total Revenue */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Total Revenue
              </p>

              <span className="rounded-lg bg-yellow-100 p-3 text-xl">
                💰
              </span>
            </div>

            <h2 className="break-words text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.totalRevenue)}
            </h2>

            <p className="mt-2 text-xs text-gray-400">
              Revenue reported by the server
            </p>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() => setActiveTab("events")}
              className={`rounded-xl px-6 py-3 text-sm font-semibold transition ${
                activeTab === "events"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Manage Events
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("bookings");
                setShowForm(false);
              }}
              className={`rounded-xl px-6 py-3 text-sm font-semibold transition ${
                activeTab === "bookings"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              View Bookings
            </button>

          </div>
        </div>

        {/* Event Management */}
        {activeTab === "events" && (
          <div>

            {/* Create / Edit Event Form */}
            {showForm && (
              <div className="mb-8 rounded-2xl bg-white p-6 shadow-md">

                <div className="mb-6 flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingEvent
                      ? "Edit Event"
                      : "Create New Event"}
                  </h2>

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    aria-label="Close event form"
                    className="text-2xl font-bold text-gray-400 hover:text-gray-700 disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-600"
                  >
                    {formError}
                  </div>
                )}

                <form onSubmit={handleSaveEvent}>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                    {/* Event Title */}
                    <div>
                      <label
                        htmlFor="event-title"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Event Title *
                      </label>

                      <input
                        id="event-title"
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter event title"
                        required
                        maxLength={150}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label
                        htmlFor="event-category"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Category *
                      </label>

                      <input
                        id="event-category"
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        placeholder="Music, Technology, Sports..."
                        required
                        maxLength={100}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Venue */}
                    <div>
                      <label
                        htmlFor="event-venue"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Venue *
                      </label>

                      <input
                        id="event-venue"
                        type="text"
                        name="venue"
                        value={formData.venue}
                        onChange={handleInputChange}
                        placeholder="Enter venue"
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label
                        htmlFor="event-city"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        City *
                      </label>

                      <input
                        id="event-city"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Event Date */}
                    <div>
                      <label
                        htmlFor="event-date"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Event Date & Time *
                      </label>

                      <input
                        id="event-date"
                        type="datetime-local"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Ticket Price */}
                    <div>
                      <label
                        htmlFor="event-price"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Ticket Price (₹) *
                      </label>

                      <input
                        id="event-price"
                        type="number"
                        name="price"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="Enter ticket price"
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Total Capacity */}
                    <div>
                      <label
                        htmlFor="event-seats"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Total Seat Capacity *
                      </label>

                      <input
                        id="event-seats"
                        type="number"
                        name="totalSeats"
                        min={
                          editingEvent
                            ? Math.max(
                                0,
                                Number(editingEvent.bookedSeats || 0)
                              )
                            : 0
                        }
                        step="1"
                        value={formData.totalSeats}
                        onChange={handleInputChange}
                        placeholder="Enter total seats"
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      {editingEvent && (
                        <p className="mt-2 text-xs text-gray-500">
                          Already booked:{" "}
                          {editingEvent.bookedSeats || 0} seats.
                          Capacity cannot be reduced below this
                          number.
                        </p>
                      )}
                    </div>

                    {/* Image URL */}
                    <div>
                      <label
                        htmlFor="event-image"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Event Image URL
                      </label>

                      <input
                        id="event-image"
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                  </div>

                  {/* Description */}
                  <div className="mt-5">
                    <label
                      htmlFor="event-description"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Event Description *
                    </label>

                    <textarea
                      id="event-description"
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your event..."
                      required
                      className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Form Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : editingEvent
                          ? "Update Event"
                          : "Create Event"}
                    </button>

                    <button
                      type="button"
                      onClick={closeForm}
                      disabled={saving}
                      className="rounded-xl border border-gray-300 px-8 py-3 font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                  </div>
                </form>
              </div>
            )}

            {/* Events Header */}
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  All Events
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {filteredEvents.length} event(s) found
                </p>
              </div>

              {/* Search */}
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                aria-label="Search events"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-72"
              />

            </div>

            {/* Empty Events */}
            {filteredEvents.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                <h3 className="text-xl font-bold text-gray-800">
                  No Events Found
                </h3>

                <p className="mt-3 text-gray-500">
                  {search
                    ? "Try a different search."
                    : "Create your first event to get started."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={handleCreateClick}
                    className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
                  >
                    Create Event
                  </button>
                )}
              </div>
            ) : (
              /* Event Cards */
              <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3">

                {filteredEvents.map((event) => {
                  const availableSeats = getAvailableSeats(event);
                  const bookedSeats = Number(event.bookedSeats || 0);
                  const totalSeats = Number(event.totalSeats || 0);

                  const occupancy =
                    totalSeats > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            (bookedSeats / totalSeats) * 100
                          )
                        )
                      : 0;

                  return (
                    <div
                      key={event._id}
                      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md"
                    >

                      {/* Event Image */}
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          loading="lazy"
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
                          <span className="text-2xl font-bold text-white">
                            EventPulse
                          </span>
                        </div>
                      )}

                      <div className="p-5">

                        {/* Category */}
                        <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {event.category || "Event"}
                        </span>

                        {/* Title */}
                        <h3 className="mt-3 break-words text-xl font-bold text-gray-800">
                          {event.title}
                        </h3>

                        {/* Event Details */}
                        <p className="mt-3 text-sm text-gray-600">
                          📅 {formatDate(event.date)}
                        </p>

                        <p className="mt-2 text-sm text-gray-600">
                          📍 {event.venue}, {event.city}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-indigo-600">
                          {formatCurrency(event.price)}
                        </p>

                        {/* Capacity Management */}
                        <div className="mt-5 rounded-xl bg-gray-50 p-4">

                          <div className="mb-3 flex justify-between text-sm">
                            <span className="font-medium text-gray-600">
                              Seat Capacity
                            </span>

                            <span className="font-bold text-gray-800">
                              {bookedSeats} / {totalSeats}
                            </span>
                          </div>

                          {/* Capacity Progress */}
                          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-indigo-600 transition-all"
                              style={{
                                width: `${occupancy}%`,
                              }}
                            />
                          </div>

                          <div className="mt-3 flex justify-between text-xs">
                            <span className="text-gray-500">
                              {availableSeats} available
                            </span>

                            <span className="font-medium text-indigo-600">
                              {occupancy.toFixed(0)}% booked
                            </span>
                          </div>

                        </div>

                        {/* Action Buttons */}
                        <div className="mt-5 flex gap-3">

                          <button
                            type="button"
                            onClick={() => {
                              handleEditClick(event);
                              window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }}
                            disabled={saving || Boolean(deletingId)}
                            className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Edit / Capacity
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(event)}
                            disabled={Boolean(deletingId) || saving}
                            className="flex-1 rounded-xl border border-red-500 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === event._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>

                      </div>
                    </div>
                  );
                })}

              </div>
            )}

          </div>
        )}

        {/* Booking Management */}
        {activeTab === "bookings" && (
          <div className="rounded-2xl bg-white p-6 shadow-md">

            {/* Bookings Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                All Bookings
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                View and monitor bookings across all events.
              </p>
            </div>

            {sortedBookings.length === 0 ? (
              <div className="py-12 text-center">
                <h3 className="text-xl font-bold text-gray-700">
                  No Bookings Yet
                </h3>

                <p className="mt-3 text-gray-500">
                  Booking records will appear here when users
                  reserve tickets.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px] border-collapse text-left">

                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-sm text-gray-600">
                      <th className="px-4 py-4 font-semibold">
                        Booking Reference
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Customer
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Event
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Tickets
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Amount
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Status
                      </th>

                      <th className="px-4 py-4 font-semibold">
                        Booking Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {sortedBookings.map((booking) => {
                      const customer =
                        booking.userId &&
                        typeof booking.userId === "object"
                          ? booking.userId
                          : null;

                      const event =
                        booking.eventId &&
                        typeof booking.eventId === "object"
                          ? booking.eventId
                          : null;

                      const status = String(
                        booking.status || "pending"
                      ).toLowerCase();

                      return (
                        <tr
                          key={booking._id}
                          className="border-b border-gray-100 text-sm transition hover:bg-gray-50"
                        >

                          {/* Reference */}
                          <td className="px-4 py-4">
                            <span className="break-all font-mono font-semibold text-indigo-600">
                              {booking.bookingReference || "N/A"}
                            </span>
                          </td>

                          {/* Customer */}
                          <td className="px-4 py-4">
                            <p className="font-semibold text-gray-800">
                              {customer?.name || "User"}
                            </p>

                            <p className="mt-1 break-all text-xs text-gray-500">
                              {customer?.email ||
                                (typeof booking.userId === "string"
                                  ? booking.userId
                                  : "Not available")}
                            </p>
                          </td>

                          {/* Event */}
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-800">
                              {event?.title || "Event unavailable"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {event?.city || ""}
                            </p>
                          </td>

                          {/* Quantity */}
                          <td className="px-4 py-4 font-medium text-gray-700">
                            {booking.quantity}
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-4 font-semibold text-gray-800">
                            {formatCurrency(booking.totalAmount)}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(status)}`}
                            >
                              {status.charAt(0).toUpperCase() +
                                status.slice(1)}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-4 text-gray-600">
                            {formatDate(booking.createdAt)}
                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}