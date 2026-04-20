"use client";

import React, { createContext, useContext } from "react";

export type UserRole = "ADMIN" | "MANAGER" | "SALES_REP";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Auth removed — everyone is automatically an admin.
const DEFAULT_USER: AuthUser = {
  id: "local-admin",
  email: "admin@wholesaleos.local",
  name: "Admin",
  role: "ADMIN",
  avatar: null,
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_USER,
  loading: false,
  login: async () => ({}),
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const value: AuthContextType = {
    user: DEFAULT_USER,
    loading: false,
    login: async () => ({}),
    logout: async () => {},
    refresh: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
