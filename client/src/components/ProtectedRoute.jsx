import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const ProtectedRoute = ({ roles = [] }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Check if user is logged in
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search + location.hash,
        }}
      />
    );
  }

  // Check user permissions
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Display the protected page
  return <Outlet />;
};

export default ProtectedRoute;
