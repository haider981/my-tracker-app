import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// src/components/ProtectedRoute.jsx
export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("authToken");

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    // Decode and validate token
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    // Check if token is expired
    if (decoded.exp < currentTime) {
      localStorage.removeItem("authToken");
      return <Navigate to="/" replace />;
    }

    // Check if user's role is allowed
    const userRole = decoded.role?.toLowerCase();
    
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on their actual role
      switch (userRole) {
        case "employee":
          return <Navigate to="/employee-dashboard" replace />;
        case "spoc":
          return <Navigate to="/spoc-dashboard" replace />;
        case "admin":
          return <Navigate to="/admin-dashboard" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }

    // User is authorized, render the protected component
    return children;

  } catch (error) {
    console.error("Token validation error:", error);
    localStorage.removeItem("authToken");
    return <Navigate to="/" replace />;
  }
}
