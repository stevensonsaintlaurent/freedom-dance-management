import { createContext, useContext, useState } from 'react';
const AuthContext = createContext(null);
// UI prototype only. Replace with server-backed sessions before production.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const demoSignIn = (role, name = 'Demo User') => setUser({ id: 'demo', name, role });
  const signOut = () => setUser(null);
  return <AuthContext.Provider value={{ user, demoSignIn, signOut }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
