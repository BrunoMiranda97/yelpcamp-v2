import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "../types.ts";
import { clearSession, readStoredUser, saveSession, UNAUTHORIZED_EVENT } from "../services/session.ts";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Read synchronously so protected pages know the auth state on the first render
  const [user, setUser] = useState<User | null>(readStoredUser);

  const login = useCallback((userData: User, token: string) => {
    saveSession(userData, token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // The API rejected our token (expired or invalid): drop the session
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const value = useMemo(() => ({ user, isAuthenticated: !!user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

/** True when the user may edit/delete content owned by `authorId`. */
export const canModify = (user: User | null, authorId?: string | null) =>
  !!user && (user.isAdmin || (!!authorId && user.id === authorId));
