
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT and identify the logged-in user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      typeof authHeader !== "string" ||
      !/^Bearer\s+\S+$/i.test(authHeader)
    ) {
      return res.status(401).json({
        message: "Authentication token required",
      });
    }

    const token = authHeader.split(/\s+/)[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Verify token signature and expiration
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (!decoded.sub || typeof decoded.sub !== "string") {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    // Find the user associated with this token
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    // Attach authenticated user to request
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError" ||
      error.name === "CastError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired authentication token",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Authentication failed",
    });
  }
};

// Allow only administrators
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireAdmin,
};
