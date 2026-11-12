import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import api from "../lib/api";
import type { User } from "../types";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  level: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Reads token/user whether the API returns { token, user }, { data: { token, user } }, or user fields at top level
  function extractSession(data: any): { token?: string; user?: User } {
    const body = data?.data ?? data;
    const token = body?.token;
    const user =
      body?.user ??
      (body?.email ? (({ token: _t, ...rest }) => rest)(body) : undefined);
    return { token, user };
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        const body = res.data?.data ?? res.data;
        setUser(body?.user ?? body);
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data: unknown) => {
    const { token, user } = extractSession(data);
    if (!token || !user)
      throw new Error("Unexpected login response from server");
    localStorage.setItem("token", token);
    setUser(user);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    saveSession(res.data);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post("/auth/register", data);
    saveSession(res.data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
