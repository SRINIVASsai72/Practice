
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 10000,
});

export const getEvents = async () => {
  const response = await api.get("/api/events");
  return response.data.events;
};

export const getEventById = async (id) => {
  const response = await api.get(
    `/api/events/${encodeURIComponent(id)}`
  );
  return response.data.event;
};
