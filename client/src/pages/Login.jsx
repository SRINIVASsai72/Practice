import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getAuthErrorMessage } from "../services/authApi";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, isAuthenticated, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setServerError("");
  };

  // Validate login form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    return newErrors;
  };

  // Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const validationErrors = validateForm();

    setErrors(validationErrors);
    setServerError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const data = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      const defaultPath =
        data.user.role === "admin" ? "/admin" : "/";

      const from = location.state?.from;

      // Return to the originally requested protected page
      const requestedPath =
        typeof from?.pathname === "string"
          ? from.pathname
          : typeof from === "string"
            ? from
            : null;

      const destination =
        requestedPath?.startsWith("/") &&
        !requestedPath.startsWith("//")
          ? requestedPath
          : defaultPath;

      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Redirect users who are already logged in
  if (isAuthenticated) {
    return (
      <Navigate
        to={isAdmin ? "/admin" : "/"}
        replace
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">
            EventPulse
          </h1>

          <h2 className="text-2xl font-semibold mt-4 text-gray-800">
            Welcome Back
          </h2>

          <p className="text-gray-500 mt-2">
            Login to continue your EventPulse journey
          </p>
        </div>

        {/* Registration Success Message */}
        {location.state?.message && (
          <div
            role="status"
            className="bg-green-50 text-green-700 p-3 rounded-lg mb-5 text-sm"
          >
            {location.state.message}
          </div>
        )}

        {/* Server Error */}
        {serverError && (
          <div
            role="alert"
            className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm"
          >
            {serverError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="login-email"
              className="block text-gray-700 font-medium mb-2"
            >
              Email Address
            </label>

            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              aria-invalid={Boolean(errors.email)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label
              htmlFor="login-password"
              className="block text-gray-700 font-medium mb-2"
            >
              Password
            </label>

            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>

        {/* Registration Link */}
        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}