import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAuthErrorMessage } from "../services/authApi";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  // Validate registration form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  // Handle registration
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
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      navigate("/login", {
        replace: true,
        state: {
          message: "Registration successful! Please log in.",
        },
      });
    } catch (error) {
      setServerError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">
            EventPulse
          </h1>

          <h2 className="text-2xl font-semibold mt-4 text-gray-800">
            Create Account
          </h2>

          <p className="text-gray-500 mt-2">
            Join EventPulse and discover amazing events
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div
            role="alert"
            className="bg-red-50 text-red-600 p-3 rounded-lg mb-5 text-sm"
          >
            {serverError}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className="mb-4">
            <label
              htmlFor="register-name"
              className="block text-gray-700 font-medium mb-2"
            >
              Full Name
            </label>

            <input
              id="register-name"
              type="text"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              aria-invalid={Boolean(errors.name)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="register-email"
              className="block text-gray-700 font-medium mb-2"
            >
              Email Address
            </label>

            <input
              id="register-email"
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
          <div className="mb-4">
            <label
              htmlFor="register-password"
              className="block text-gray-700 font-medium mb-2"
            >
              Password
            </label>

            <input
              id="register-password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              aria-invalid={Boolean(errors.password)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label
              htmlFor="register-confirm-password"
              className="block text-gray-700 font-medium mb-2"
            >
              Confirm Password
            </label>

            <input
              id="register-confirm-password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              aria-invalid={Boolean(errors.confirmPassword)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}