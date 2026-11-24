import { createContext, useContext, useEffect, useState } from "react";
import api from "@/api/axios";

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

  // ==========================================
  // CHECK AUTHENTICATION
  // ==========================================

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me");

        setUser(normalizeUser(data.user));
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

  const signIn = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    const loggedInUser = normalizeUser(data.user);

    setUser(loggedInUser);

    return loggedInUser;
  };

  // ==========================================
  // REGISTER
  // ==========================================

  const register = async (userData) => {
    const { data } = await api.post("/auth/register", userData);

    return data.user;
  };

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const updateProfile = async (profileData) => {
    const { data } = await api.patch("/users/me", profileData);

    const updatedUser = normalizeUser(data.user);

    setUser(updatedUser);

    return updatedUser;
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const signOut = async () => {
    await api.post("/auth/logout");

    setUser(null);
  };

  // ==========================================
  // CONTEXT PROVIDER
  // ==========================================

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        register,
        updateProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
