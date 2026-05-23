import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { login as apiLogin, setAuthToken, getMe } from "./api";
import {
  saveToken,
  getToken,
  removeToken,
  saveUser,
  getUser,
  clearAuth,
} from "./storage";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---- bootstrap: load persisted token on mount ----
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();

        if (storedToken) {
          setAuthToken(storedToken);
          setToken(storedToken);

          if (storedUser) {
            setUser(storedUser as AuthUser);
          }

          // Validate token is still valid by hitting /me
          try {
            const { user: freshUser } = await getMe();
            setUser(freshUser);
            await saveUser(freshUser);
          } catch {
            // Token expired — clear everything
            setAuthToken(null);
            setToken(null);
            setUser(null);
            await clearAuth();
          }
        }
      } catch (err) {
        console.warn("Auth bootstrap error:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    const { token: newToken, user: newUser } = data;

    // Persist
    await saveToken(newToken);
    await saveUser(newUser);

    // Set in-memory
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await clearAuth();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: freshUser } = await getMe();
      setUser(freshUser);
      await saveUser(freshUser);
    } catch (err) {
      console.warn("refreshUser failed:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
