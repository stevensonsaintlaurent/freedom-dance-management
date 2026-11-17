import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const ProtectedRoute = ({ roles = [] }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Wait while checking the user's session
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-400/20 border-t-amber-400" />

          <p className="text-sm font-medium text-zinc-400">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  // Redirect if the user is not authenticated
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
