import { createContext, useContext, useEffect, useState } from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

// Convert backend roles to frontend roles
const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role === "MEMBER" ? "dancer" : user.role.toLowerCase(),
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/auth/me");

        setUser(normalizeUser(response.data.user));
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login
  const signIn = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const loggedInUser = normalizeUser(response.data.user);

    setUser(loggedInUser);

    return loggedInUser;
  };

  // Register
  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);

    return response.data.user;
  };

  // Logout
  const signOut = async () => {
    await api.post("/auth/logout");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        register,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
