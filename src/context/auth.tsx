import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi } from "@/lib/api";

interface AuthUser {
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "vfh_user";
const TOKEN_KEY = "vfh_token";

const isClient = typeof window !== "undefined";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!isClient) return null;
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.tenantLogin(email, password);
      localStorage.setItem(TOKEN_KEY, res.token);
      setUser({ email: res.user.email, name: res.user.name });
    } catch {
      if (import.meta.env.PROD) throw new Error("Invalid credentials");
      if (!email || password.length < 6) throw new Error("Invalid credentials");
      setUser({ email, name: email.split("@")[0] });
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
