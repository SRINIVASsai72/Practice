import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api"
).replace(/\/+$/, "");

const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Register a new user
export const registerUser = async (userData) => {
  const response = await authClient.post(
    "/auth/register",
    userData
  );

  return response.data;
};

// Login an existing user
export const loginUser = async (credentials) => {
  const response = await authClient.post(
    "/auth/login",
    credentials
  );

  return response.data;
};

// Handle authentication errors
export const getAuthErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }

  if (error.request) {
    return "Unable to connect to the server.";
  }

  return "Something went wrong. Please try again.";
};