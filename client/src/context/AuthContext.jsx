import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from '../api/axios.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'axion_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Added token validation on mount
  useEffect(() => {
    if (user?.token) {
      axios.get('/api/auth/me').then((res) => {
        const next = { ...res.data.user, token: user.token };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
      }).catch(() => {
        logout();
      });
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    const next = {
      name: data.user.name,
      role: data.user.role,
      avatarInitials: data.user.avatarInitials,
      schoolId: data.user.schoolId,
      childId: data.user.childId,
      id: data.user.id,
      token: data.token,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
    return next;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
    }),
    [user]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
