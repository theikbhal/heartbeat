"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const API_URL = "https://tawhid.in/tiny/heartbeat/users.php";
const AUTH_KEY = "auth-user";

export type User = {
  name: string;
  email: string;
  token: string;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password })
    });
    const data = await res.json();
    if (data.success && data.token) {
      const u = { name: data.name, email: data.email, token: data.token };
      setUser(u);
      localStorage.setItem(AUTH_KEY, JSON.stringify(u));
      return { success: true };
    } else {
      return { success: false, error: data.error || "Login failed" };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", name, email, password })
    });
    const data = await res.json();
    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data.error || "Registration failed" };
    }
  };

  const logout = async () => {
    if (!user) return;
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", token: user.token })
    });
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
} 