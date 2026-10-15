import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api, { clearToken, getToken, setToken } from "../lib/api";
import type { AuthResponse, User } from "../types";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  level: number;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // on page load, restore the session if a token is stored
  useEffect(() => {
    const restore = async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get<User>("/auth/me");
        setUser(data);
      } catch {
        clearToken();
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const handleAuth = (data: AuthResponse) => {
    const { token, ...profile } = data;
    setToken(token);
    setUser(profile);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
    handleAuth(data);
  };

  const register = async (details: RegisterData) => {
    const { data } = await api.post<AuthResponse>("/auth/register", details);
    handleAuth(data);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};