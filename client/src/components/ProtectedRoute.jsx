import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}) {
  const location = useLocation();

  const { isAuthenticated, isAdmin } = useAuth();

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Prevent regular users from accessing admin pages
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return children ?? <Outlet />;
}